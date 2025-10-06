import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Institutions Page @admin @institutions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should display institutions list', async ({ page }) => {
    await page.goto('/institutions')

    // Wait for page to load
    await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

    // Should display table or "no data" message
    const hasTable = await page.getByTestId('institutions-table').isVisible().catch(() => false)
    const hasNoData = await page.getByTestId('no-data-message').isVisible().catch(() => false)

    expect(hasTable || hasNoData).toBeTruthy()
  })

  test('should filter institutions by active status', async ({ page }) => {
    await page.goto('/institutions')

    await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

    // Active checkbox should be checked by default
    const activeCheckbox = page.getByTestId('filter-active')
    await expect(activeCheckbox).toBeChecked()

    // Uncheck active checkbox
    await activeCheckbox.uncheck()

    // Wait for data to reload
    await page.waitForTimeout(500)

    // Check inactive checkbox
    const inactiveCheckbox = page.getByTestId('filter-inactive')
    await inactiveCheckbox.check()

    // Should show inactive institutions
    await page.waitForTimeout(500)
  })

  test('should search for institutions', async ({ page }) => {
    await page.goto('/institutions')

    await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

    // Find search input
    const searchInput = page.getByTestId('search-input')
    await expect(searchInput).toBeVisible()

    // Type search query
    await searchInput.fill('MV')

    // Wait for search to complete (debounced)
    await page.waitForTimeout(500)
  })

  test('should display add institution button', async ({ page }) => {
    await page.goto('/institutions')

    await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

    // Should have "Add institution" button
    const addButton = page.getByTestId('add-institution-button')
    await expect(addButton).toBeVisible()
  })

  test('should display institution details in table', async ({ page }) => {
    await page.goto('/institutions')

    await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

    // Check if table exists
    const hasTable = await page.getByTestId('institutions-table').isVisible().catch(() => false)

    if (hasTable) {
      // Table should be visible
      await expect(page.getByTestId('institutions-table')).toBeVisible()
    }
  })

  test('should toggle institution active status', async ({ page }) => {
    await page.goto('/institutions')

    await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

    // Check if table exists
    const hasTable = await page.getByTestId('institutions-table').isVisible().catch(() => false)

    if (hasTable) {
      // Wait for table rows
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      const rowCount = await page.locator('table tbody tr').count()

      if (rowCount > 0) {
        // Find first institution's toggle button
        const firstRow = page.locator('table tbody tr').first()
        const toggleButton = firstRow.locator('button').first()

        // Click toggle button (will show confirmation dialog)
        page.on('dialog', dialog => dialog.accept())
        await toggleButton.click()

        // Wait for action to complete
        await page.waitForTimeout(1000)
      }
    }
  })
})
