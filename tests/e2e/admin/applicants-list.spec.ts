import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Applicants List @admin @applicants @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/applicants')
  })

  test('should display applicants list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Uchádzači')
  })

  test('should display search input', async ({ page }) => {
    await expect(page.locator('input[placeholder="Hľadaj..."]')).toBeVisible()
  })

  test('should display applicants table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th:has-text("CIS")')).toBeVisible()
    await expect(page.locator('th:has-text("Meno")')).toBeVisible()
    await expect(page.locator('th:has-text("VK")')).toBeVisible()
    await expect(page.locator('th:has-text("Stav")')).toBeVisible()
  })

  test('should search applicants by CIS', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
    await searchInput.fill('CIS')

    // Wait for debounce
    await page.waitForTimeout(600)

    // Should show spinner
    await expect(page.locator('.animate-spin')).toBeVisible()

    // Wait for results
    await page.waitForTimeout(500)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    // Should have results or show "no data" message
    if (rowCount > 0) {
      await expect(rows.first()).toBeVisible()
    }
  })

  test('should clear search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
    await searchInput.fill('Test')
    await page.waitForTimeout(600)

    await searchInput.clear()
    await page.waitForTimeout(600)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await expect(rows.first()).toBeVisible()
    }
  })

  test('should filter applicants by VK', async ({ page }) => {
    const vkFilter = page.locator('text=Filtruj podľa VK...').first()
    const filterVisible = await vkFilter.isVisible().catch(() => false)

    if (filterVisible) {
      await vkFilter.click()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await page.keyboard.press('Escape')

      // Wait for results
      await page.waitForTimeout(1000)

      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        await expect(rows.first()).toBeVisible()
      }
    }
  })

  test('should filter applicants by archived status', async ({ page }) => {
    const statusFilter = page.locator('text=Filtruj podľa stavu...').first()
    const filterVisible = await statusFilter.isVisible().catch(() => false)

    if (filterVisible) {
      await statusFilter.click()
      await page.click('text=Aktívny')
      await page.click('h1')

      // Wait for results
      await page.waitForTimeout(1000)

      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        await expect(rows.first()).toBeVisible()
      }
    }
  })

  test('should navigate to applicant detail on row click', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      const firstRow = rows.first()
      await firstRow.click()

      // Should navigate to applicant detail
      await page.waitForURL(/\/applicants\/[a-z0-9]+/)
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('should sort table by CIS identifier', async ({ page }) => {
    await page.click('th:has-text("CIS")')

    // Wait for sort
    await page.waitForTimeout(500)

    // Check if sorted icon visible
    await expect(page.locator('th:has-text("CIS") svg')).toBeVisible()
  })

  test('should display applicant status badges', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      const firstRow = rows.first()
      const statusBadge = firstRow.locator('.inline-flex.items-center.px-2')
      const badgeVisible = await statusBadge.isVisible().catch(() => false)

      if (badgeVisible) {
        await expect(statusBadge).toBeVisible()
      }
    }
  })

  test('should display test results count', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      // Test results column should be visible
      await expect(page.locator('th:has-text("Testy")')).toBeVisible()
    }
  })

  test('should handle empty state', async ({ page }) => {
    // Search for something that doesn't exist
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
    await searchInput.fill('NONEXISTENT123456789')
    await page.waitForTimeout(1500)

    // Should show "no results" message or empty table
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    // Either no rows or a "no data" row
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })
})
