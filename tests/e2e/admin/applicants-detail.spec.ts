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
    await expect(page.getByTestId('vk-tab')).toBeVisible()
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
    await expect(page.getByTestId('field-email')).toBeVisible()
    await expect(page.getByTestId('field-username')).toBeVisible()
    await expect(page.getByTestId('field-role')).toBeVisible()
    await expect(page.getByTestId('field-status')).toBeVisible()
  })

  test('should display creation and update dates', async ({ page }) => {
    await expect(page.getByTestId('field-created')).toBeVisible()
    await expect(page.getByTestId('field-updated')).toBeVisible()
  })

  test('should switch to VK tab', async ({ page }) => {
    const vkTab = page.getByTestId('vk-tab')
    await vkTab.click()

    // VK tab should be active
    await expect(vkTab).toHaveClass(/border-blue-500/)

    // VK content should be visible
    await expect(page.getByTestId('vk-content')).toBeVisible()
  })

  test('should display VK content or empty message in VK tab', async ({ page }) => {
    await page.getByTestId('vk-tab').click()

    // Should either see table or empty message
    const hasTable = await page.getByTestId('vk-table').isVisible().catch(() => false)
    const hasEmptyMessage = await page.getByTestId('vk-empty-message').isVisible().catch(() => false)

    // One of them should be visible
    expect(hasTable || hasEmptyMessage).toBeTruthy()
  })

  test('should navigate back to applicants list', async ({ page }) => {
    const backButton = page.getByTestId('back-button')
    await expect(backButton).toBeVisible()
    await backButton.click()

    await page.waitForURL('/applicants')
    await expect(page.getByTestId('applicants-page')).toBeVisible()
  })

  test('should have all field sections visible', async ({ page }) => {
    // All fields should be present
    await expect(page.getByTestId('field-name')).toBeVisible()
    await expect(page.getByTestId('field-surname')).toBeVisible()
    await expect(page.getByTestId('field-email')).toBeVisible()
    await expect(page.getByTestId('field-username')).toBeVisible()
    await expect(page.getByTestId('field-role')).toBeVisible()
    await expect(page.getByTestId('field-status')).toBeVisible()
    await expect(page.getByTestId('field-created')).toBeVisible()
    await expect(page.getByTestId('field-updated')).toBeVisible()
  })
})
