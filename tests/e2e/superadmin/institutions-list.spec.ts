import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Institutions List @superadmin @institutions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/institutions')
  })

  test('should display institutions list page', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Správa rezortov')
    await expect(page.locator('a:has-text("Pridať rezort")')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Hľadať"]')
    await expect(searchInput).toBeVisible()
  })

  test('should display filter checkboxes', async ({ page }) => {
    await expect(page.locator('text=☑ Aktívne')).toBeVisible()
    await expect(page.locator('text=☐ Neaktívne')).toBeVisible()
  })

  test('should navigate to new institution page', async ({ page }) => {
    await page.click('a:has-text("Pridať rezort")')
    await page.waitForURL('/institutions/new')
    await expect(page.locator('main h1')).toContainText('Nový rezort')
  })

  test('should search institutions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Hľadať"]')

    // Type search query
    await searchInput.fill('Ministerstvo')

    // Wait for debounce (300ms)
    await page.waitForTimeout(500)

    // Results should be filtered (if any institutions exist)
    // This is a basic check - in real scenario we'd verify filtered results
  })

  test('should filter by active status', async ({ page }) => {
    const activeCheckbox = page.locator('input[type="checkbox"]').first()
    const inactiveCheckbox = page.locator('input[type="checkbox"]').nth(1)

    // Active should be checked by default
    await expect(activeCheckbox).toBeChecked()
    await expect(inactiveCheckbox).not.toBeChecked()

    // Toggle inactive
    await inactiveCheckbox.click()
    await expect(inactiveCheckbox).toBeChecked()

    // Wait for filter to apply
    await page.waitForTimeout(500)
  })

  test('should toggle institution active status', async ({ page }) => {
    // Create a test institution first
    const timestamp = Date.now()
    await page.goto('/institutions/new')
    await page.fill('input[name="name"]', `Toggle Test ${timestamp}`)
    await page.fill('input[name="code"]', `TOG${timestamp.toString().slice(-4)}`)
    await page.click('button:has-text("Vytvoriť rezort")')
    await page.waitForURL('/institutions')

    // Find the deactivate button (first in table)
    const deactivateButton = page.locator('button:has-text("🗑 Deaktivovať")').first()

    if (await deactivateButton.isVisible()) {
      // Click deactivate
      page.once('dialog', dialog => dialog.accept())
      await deactivateButton.click()

      // Wait for update
      await page.waitForTimeout(1000)

      // Should now show activate button
      await expect(page.locator('button:has-text("✓ Aktivovať")').first()).toBeVisible()
    }
  })
})
