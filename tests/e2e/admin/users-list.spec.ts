import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Users List @admin @users @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/users')
  })

  test('should display users list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Používatelia')
    await expect(page.locator('button:has-text("+ Nový používateľ")')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await expect(page.locator('input[placeholder="Hľadaj..."]')).toBeVisible()
  })

  test('should display users table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th:has-text("Meno")')).toBeVisible()
    await expect(page.locator('th:has-text("Priezvisko")')).toBeVisible()
    await expect(page.locator('th:has-text("Email")')).toBeVisible()
    await expect(page.locator('th:has-text("Rola")')).toBeVisible()
    await expect(page.locator('th:has-text("Stav")')).toBeVisible()
  })

  test('should search users by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
    await searchInput.fill('Super')

    // Wait for debounce (500ms)
    await page.waitForTimeout(600)

    // Should show spinner during search
    await expect(page.locator('.animate-spin')).toBeVisible()

    // Wait for results
    await page.waitForTimeout(500)

    // Should have at least one result
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should clear search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
    await searchInput.fill('Test')
    await page.waitForTimeout(600)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(600)

    // Should show all users again
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter users by role', async ({ page }) => {
    // Find and open role filter multiselect
    const roleFilter = page.locator('text=Filtruj podľa role...').first()
    await roleFilter.click()

    // Select ADMIN role
    await page.click('text=Admin')

    // Click outside to close dropdown
    await page.click('h1')

    // Wait for results
    await page.waitForTimeout(1000)

    // Should filter results
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter users by active status', async ({ page }) => {
    const statusFilter = page.locator('text=Filtruj podľa stavu...').first()
    await statusFilter.click()

    // Select Active
    await page.click('text=Aktívny')

    // Click outside
    await page.click('h1')

    // Wait for results
    await page.waitForTimeout(1000)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should navigate to create user page', async ({ page }) => {
    await page.click('button:has-text("+ Nový používateľ")')
    await page.waitForURL('/users/new')
    await expect(page.locator('h1')).toContainText('Vytvoriť nového používateľa')
  })

  test('should navigate to user detail on row click', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Should navigate to user detail
    await page.waitForURL(/\/users\/[a-z0-9]+/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should sort table by name', async ({ page }) => {
    // Click on name header to sort
    await page.click('th:has-text("Meno")')

    // Wait for sort
    await page.waitForTimeout(500)

    // Check if sorted (should see chevron icon)
    await expect(page.locator('th:has-text("Meno") svg')).toBeVisible()
  })
})
