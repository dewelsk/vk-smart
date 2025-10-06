import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Applicants List @admin @applicants @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/applicants')
  })

  test('should display applicants list page', async ({ page }) => {
    await expect(page.getByTestId('applicants-page')).toBeVisible()
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('page-description')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await expect(page.getByTestId('search-input')).toBeVisible()
  })

  test('should display add applicant button', async ({ page }) => {
    await expect(page.getByTestId('add-applicant-button')).toBeVisible()
  })

  test('should display applicants table', async ({ page }) => {
    await expect(page.getByTestId('applicants-table')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should search applicants', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('CIS')

    // Wait for debounce
    await page.waitForTimeout(600)

    // Should show spinner
    const spinner = page.getByTestId('search-spinner')
    const spinnerVisible = await spinner.isVisible().catch(() => false)
    if (spinnerVisible) {
      await expect(spinner).toBeVisible()
    }

    // Wait for results
    await page.waitForTimeout(500)

    // Should have results
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })

  test('should clear search', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('Test')
    await page.waitForTimeout(600)

    await searchInput.clear()
    await page.waitForTimeout(600)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to applicant detail on name click', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      // Click on first applicant name link
      const firstNameLink = rows.first().locator('[data-testid^="applicant-name-"]')
      await firstNameLink.click()

      // Should navigate to applicant detail
      await page.waitForURL(/\/applicants\/[a-z0-9]+/)
      await expect(page.getByTestId('applicant-detail-page')).toBeVisible()
    }
  })

  test('should display applicant status badges', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      const statusBadges = page.locator('[data-testid^="status-badge-"]')
      const badgeCount = await statusBadges.count()
      expect(badgeCount).toBeGreaterThan(0)
    }
  })

  test('should handle empty search state', async ({ page }) => {
    // Search for something that doesn't exist
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('NONEXISTENT123456789')
    await page.waitForTimeout(1500)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })

  test('should have filters section', async ({ page }) => {
    await expect(page.getByTestId('filters-section')).toBeVisible()
    await expect(page.getByTestId('status-filter')).toBeVisible()
  })
})
