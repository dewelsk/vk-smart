import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('Test Navigation @admin @test-navigation', () => {
  let testId: string
  let testName: string

  test.beforeAll(async () => {
    await prisma.$connect()

    // Get superadmin user for authorId
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })
    if (!superadmin) {
      throw new Error('No superadmin found in database')
    }

    // Get or create test category
    const testCategory = await prisma.testCategory.findFirst()
    if (!testCategory) {
      throw new Error('No test category found in database')
    }

    // Create a test for navigation testing
    const timestamp = Date.now()
    testName = `E2E Navigation Test ${timestamp}`

    const test = await prisma.test.create({
      data: {
        name: testName,
        type: 'ODBORNY',
        categoryId: testCategory.id,
        description: 'Test for E2E navigation from list to detail',
        difficulty: 5,
        recommendedDuration: 60,
        recommendedQuestionCount: 20,
        recommendedScore: 80,
        allowedQuestionTypes: ['SINGLE_CHOICE'],
        approved: false,
        authorId: superadmin.id,
        questions: [
          {
            order: 1,
            text: 'Navigation test question?',
            points: 2,
            questionType: 'SINGLE_CHOICE',
            status: 'confirmed',
            answers: [
              { letter: 'a', text: 'Answer A', isCorrect: true },
              { letter: 'b', text: 'Answer B', isCorrect: false }
            ]
          }
        ]
      }
    })

    testId = test.id
  })

  test.afterAll(async () => {
    // Cleanup: Delete the test
    if (testId) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should navigate from tests list to test detail by clicking test name', async ({ page }) => {
    // Navigate to tests list
    await page.goto('/tests')
    await expect(page.locator('h1:has-text("Testy")')).toBeVisible({ timeout: 10000 })

    // Wait for table to load
    await page.waitForTimeout(2000)

    // Search for our test to ensure it's visible
    const searchInput = page.locator('input[placeholder*="Hľadať"]')
    await searchInput.fill(testName)
    await page.waitForTimeout(1000)

    // Click on test name link
    const testLink = page.locator(`a[href="/tests/${testId}"]`).first()
    await expect(testLink).toBeVisible({ timeout: 5000 })
    await testLink.click()

    // Should navigate to test detail page
    await page.waitForURL(`/tests/${testId}`, { timeout: 10000 })
    await expect(page).toHaveURL(`/tests/${testId}`)

    // Verify test detail page loaded correctly
    await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

    // Verify test name is displayed
    await expect(page.getByTestId('test-name-input')).toHaveValue(testName)

    // Verify tabs are visible
    await expect(page.getByTestId('overview-tab')).toBeVisible()
    await expect(page.getByTestId('questions-tab')).toBeVisible()
    await expect(page.getByTestId('vks-tab')).toBeVisible()
  })

  test('should display correct test data in detail page after navigation', async ({ page }) => {
    // Navigate to tests list
    await page.goto('/tests')
    await expect(page.locator('h1:has-text("Testy")')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    // Search for our test
    const searchInput = page.locator('input[placeholder*="Hľadať"]')
    await searchInput.fill(testName)
    await page.waitForTimeout(1000)

    // Click on test name
    await page.locator(`a[href="/tests/${testId}"]`).first().click()

    // Wait for detail page
    await page.waitForURL(`/tests/${testId}`, { timeout: 10000 })
    await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

    // Verify basic information
    await expect(page.getByTestId('test-name-input')).toHaveValue(testName)
    await expect(page.getByTestId('test-description-input')).toHaveValue('Test for E2E navigation from list to detail')
    await expect(page.getByTestId('test-difficulty-value')).toHaveText('5')
    await expect(page.getByTestId('test-duration-input')).toHaveValue('60')

    // Verify question count
    await expect(page.getByTestId('test-question-count')).toHaveText('1')

    // Switch to Questions tab
    await page.getByTestId('questions-tab').click()
    await page.waitForTimeout(500)

    // Verify question is displayed
    await expect(page.getByTestId('questions-list')).toBeVisible()
    await expect(page.getByTestId('question-item-0')).toBeVisible()
    await expect(page.getByTestId('question-text-0')).toHaveText('Navigation test question?')
  })

  test('should navigate back to tests list from test detail', async ({ page }) => {
    // Navigate directly to test detail
    await page.goto(`/tests/${testId}`)
    await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

    // Click back to list link
    await page.getByTestId('back-to-list-link').click()

    // Should navigate back to tests list
    await page.waitForURL('/tests', { timeout: 5000 })
    await expect(page).toHaveURL('/tests')

    // Verify we're on tests list page
    await expect(page.locator('h1:has-text("Testy")')).toBeVisible()
  })

  test('should open test detail in same tab when clicking test name', async ({ page }) => {
    // Navigate to tests list
    await page.goto('/tests')
    await expect(page.locator('h1:has-text("Testy")')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    // Search for our test
    const searchInput = page.locator('input[placeholder*="Hľadať"]')
    await searchInput.fill(testName)
    await page.waitForTimeout(1000)

    // Get initial number of pages
    const pages = page.context().pages()
    const initialPageCount = pages.length

    // Click on test name
    await page.locator(`a[href="/tests/${testId}"]`).first().click()

    // Wait for navigation
    await page.waitForURL(`/tests/${testId}`, { timeout: 10000 })

    // Verify no new tab was opened
    const finalPages = page.context().pages()
    expect(finalPages.length).toBe(initialPageCount)

    // Verify we're on the same page object
    await expect(page).toHaveURL(`/tests/${testId}`)
    await expect(page.getByTestId('test-detail-page')).toBeVisible()
  })
})
