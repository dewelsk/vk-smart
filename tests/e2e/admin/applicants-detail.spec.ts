import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Applicants Detail @admin @applicants', () => {
  let applicantId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to applicants list and get first applicant
    await page.goto('/applicants')
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => null)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount === 0) {
      test.skip()
      return
    }

    // Click on first applicant name link
    const firstNameLink = rows.first().locator('[data-testid^="applicant-name-"]')
    await firstNameLink.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/applicants\/[a-z0-9]+/)

    // Extract applicant ID from URL
    const url = page.url()
    applicantId = url.split('/').pop() || ''
  })

  test('should display applicant detail page', async ({ page }) => {
    await expect(page.getByTestId('applicant-detail-page')).toBeVisible()
    await expect(page.getByTestId('applicant-name')).toBeVisible()
    await expect(page.getByTestId('applicant-email')).toBeVisible()
  })

  test('should display tabs', async ({ page }) => {
    await expect(page.getByTestId('tabs-container')).toBeVisible()
    await expect(page.getByTestId('overview-tab')).toBeVisible()
    await expect(page.getByTestId('tests-tab')).toBeVisible()
    await expect(page.getByTestId('evaluations-tab')).toBeVisible()
    await expect(page.getByTestId('files-tab')).toBeVisible()
  })

  test('should display overview tab by default', async ({ page }) => {
    // Overview tab should have active class
    const overviewTab = page.getByTestId('overview-tab')
    await expect(overviewTab).toHaveClass(/border-blue-500/)

    // Overview content should be visible
    await expect(page.getByTestId('overview-content')).toBeVisible()
  })

  test('should display status badge', async ({ page }) => {
    await expect(page.getByTestId('status-badge')).toBeVisible()
  })

  test('should display basic information in overview tab', async ({ page }) => {
    await expect(page.getByTestId('overview-content')).toBeVisible()
    await expect(page.getByTestId('field-name')).toBeVisible()
    await expect(page.getByTestId('field-surname')).toBeVisible()
    await expect(page.getByTestId('field-cis-identifier')).toBeVisible()
    await expect(page.getByTestId('field-email')).toBeVisible()
    await expect(page.getByTestId('field-phone')).toBeVisible()
    await expect(page.getByTestId('field-status')).toBeVisible()
  })

  test('should display registration and login dates', async ({ page }) => {
    await expect(page.getByTestId('field-registered')).toBeVisible()
    await expect(page.getByTestId('field-last-login')).toBeVisible()
  })

  test('should display VK information in overview', async ({ page }) => {
    // VK link should be visible in header
    const vkLink = page.getByTestId('vk-link')
    const hasVkLink = await vkLink.isVisible().catch(() => false)

    if (hasVkLink) {
      // If VK link exists, VK fields should be visible in overview
      await expect(page.getByTestId('field-vk-identifier')).toBeVisible()
      await expect(page.getByTestId('field-vk-position')).toBeVisible()
      await expect(page.getByTestId('field-vk-status')).toBeVisible()
    }
  })

  test('should display files tab with data or empty state', async ({ page }) => {
    await page.getByTestId('files-tab').click()

    await expect(page.getByTestId('files-tab')).toHaveClass(/border-blue-500/)
    await expect(page.getByTestId('files-content')).toBeVisible()

    const hasTable = await page.getByTestId('files-table').isVisible().catch(() => false)
    const hasEmpty = await page.getByTestId('files-empty').isVisible().catch(() => false)
    const noCandidate = await page.getByTestId('files-empty-candidate').isVisible().catch(() => false)

    expect(hasTable || hasEmpty || noCandidate).toBeTruthy()
  })

  test('should navigate back to applicants list', async ({ page }) => {
    const backButton = page.getByTestId('back-button')
    await expect(backButton).toBeVisible()
    await backButton.click()

    await page.waitForURL('/applicants')
    await expect(page.getByTestId('applicants-page')).toBeVisible()
  })

  test('should have all field sections visible', async ({ page }) => {
    // All Candidate fields should be present
    await expect(page.getByTestId('field-name')).toBeVisible()
    await expect(page.getByTestId('field-surname')).toBeVisible()
    await expect(page.getByTestId('field-cis-identifier')).toBeVisible()
    await expect(page.getByTestId('field-email')).toBeVisible()
    await expect(page.getByTestId('field-phone')).toBeVisible()
    await expect(page.getByTestId('field-birth-date')).toBeVisible()
    await expect(page.getByTestId('field-status')).toBeVisible()
    await expect(page.getByTestId('field-registered')).toBeVisible()
    await expect(page.getByTestId('field-last-login')).toBeVisible()
  })

  test('should display tests tab with data or empty state', async ({ page }) => {
    await page.getByTestId('tests-tab').click()

    await expect(page.getByTestId('tests-tab')).toHaveClass(/border-blue-500/)
    await expect(page.getByTestId('tests-content')).toBeVisible()

    const hasTable = await page.getByTestId('tests-table').isVisible().catch(() => false)
    const hasEmpty = await page.getByTestId('tests-empty').isVisible().catch(() => false)
    const noCandidate = await page.getByTestId('tests-empty-candidate').isVisible().catch(() => false)

    expect(hasTable || hasEmpty || noCandidate).toBeTruthy()
  })

  test('should display evaluations tab with data or empty state', async ({ page }) => {
    await page.getByTestId('evaluations-tab').click()

    await expect(page.getByTestId('evaluations-tab')).toHaveClass(/border-blue-500/)
    await expect(page.getByTestId('evaluations-content')).toBeVisible()

    const hasTable = await page.getByTestId('evaluations-table').isVisible().catch(() => false)
    const hasEmpty = await page.getByTestId('evaluations-empty').isVisible().catch(() => false)
    const noCandidate = await page.getByTestId('evaluations-empty-candidate').isVisible().catch(() => false)

    expect(hasTable || hasEmpty || noCandidate).toBeTruthy()
  })
})
