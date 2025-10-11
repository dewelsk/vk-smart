import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Users List @admin @users @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/users')
  })

  test('should display users list page', async ({ page }) => {
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('create-user-button')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await expect(page.getByTestId('search-input')).toBeVisible()
  })

  test('should display users table', async ({ page }) => {
    await expect(page.getByTestId('users-table')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should search users by name', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')
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
    const searchInput = page.getByTestId('search-input')
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
    const roleFilter = page.locator('#role-filter')
    await roleFilter.click()

    // Select ADMIN role
    await page.click('text=Admin')

    // Click outside to close dropdown
    await page.getByTestId('page-title').click()

    // Wait for results
    await page.waitForTimeout(1000)

    // Should filter results
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter users by active status', async ({ page }) => {
    const statusFilter = page.getByTestId('status-filter')
    await statusFilter.selectOption('active')

    // Wait for results
    await page.waitForTimeout(1000)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should navigate to create user page', async ({ page }) => {
    await page.getByTestId('create-user-button').click()
    await page.waitForURL('/users/new')
    await expect(page.getByTestId('page-title')).toBeVisible()
  })

  test('should navigate to user detail on row click', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()
    const firstLink = firstRow.locator('a').first()
    await firstLink.click()

    // Should navigate to user detail
    await page.waitForURL(/\/users\/[a-z0-9]+/)
    await expect(page.getByTestId('page-title')).toBeVisible()
  })
})
