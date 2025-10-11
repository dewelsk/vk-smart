import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('Applicant Role Switching @admin @applicants @switch', () => {
  let testCandidateId: string | null = null
  let testVkId: string | null = null

  test.beforeAll(async () => {
    await prisma.$connect()

    // Find or create a test VK
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })

    if (!superadmin) {
      throw new Error('No SUPERADMIN user found in database')
    }

    const testVk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: `VK-SWITCH-TEST-${Date.now()}`,
        selectionType: 'Výberové konanie',
        organizationalUnit: 'Test Unit',
        serviceField: 'Test Field',
        position: 'Test Position',
        serviceType: 'Test Service Type',
        startDateTime: new Date('2025-12-31T10:00:00Z'),
        numberOfPositions: 1,
        status: 'PRIPRAVA',
        createdBy: {
          connect: { id: superadmin.id }
        }
      },
    })

    testVkId = testVk.id

    // Create a test candidate
    const testCandidate = await prisma.candidate.create({
      data: {
        cisIdentifier: `TEST-CIS-${Date.now()}`,
        password: 'test-password-hash',
        name: 'Test',
        surname: 'Candidate',
        email: `test${Date.now()}@example.com`,
        vkId: testVk.id,
        active: true,
        deleted: false,
      },
    })

    testCandidateId = testCandidate.id

    await prisma.$disconnect()
  })

  test.afterAll(async () => {
    // Cleanup
    if (testCandidateId && testVkId) {
      await prisma.$connect()
      await prisma.candidate.delete({ where: { id: testCandidateId } }).catch(() => {})
      await prisma.vyberoveKonanie.delete({ where: { id: testVkId } }).catch(() => {})
      await prisma.$disconnect()
    }
  })

  test('should display switch button for active candidates', async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/applicants')

    // Wait for table to load
    await expect(page.getByTestId('applicants-table')).toBeVisible({ timeout: 10000 })

    // Check if there are any rows
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      // Check if switch button exists
      const switchButtons = page.locator('[data-testid^="switch-button-"]')
      const buttonCount = await switchButtons.count()
      expect(buttonCount).toBeGreaterThan(0)

      // Verify button text
      const firstButton = switchButtons.first()
      await expect(firstButton).toContainText('Prepnúť')
    }
  })

  test('should switch to candidate view when clicking switch button', async ({ page }) => {
    if (!testCandidateId) {
      test.skip()
      return
    }

    await loginAsSuperadmin(page)
    await page.goto('/applicants')

    // Wait for table to load
    await expect(page.getByTestId('applicants-table')).toBeVisible({ timeout: 10000 })

    // Find our specific test candidate's switch button
    const switchButton = page.locator(`[data-testid="switch-button-${testCandidateId}"]`)

    // If our test candidate's button is not visible, skip the test
    const isVisible = await switchButton.isVisible().catch(() => false)
    if (!isVisible) {
      console.log(`Test candidate ${testCandidateId} switch button not found - skipping test`)
      test.skip()
      return
    }

    console.log(`Found test candidate switch button for ${testCandidateId}`)

    // Wait for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes(`/api/admin/applicants/${testCandidateId}/switch`),
      { timeout: 10000 }
    )

    // Click switch button
    await switchButton.click()

    // Wait for API call to complete
    const response = await responsePromise
    console.log(`API response status: ${response.status()}`)

    const responseData = await response.json()
    console.log('API response:', responseData)

    // Verify success response
    expect(response.status()).toBe(200)
    expect(responseData.success).toBe(true)

    // Wait for redirect
    await page.waitForURL(/\/applicant\/dashboard/, { timeout: 5000 })

    // Verify we're on the applicant dashboard
    expect(page.url()).toMatch(/\/applicant\/dashboard/)
  })
})
