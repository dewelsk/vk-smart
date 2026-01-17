import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK List @admin @vk @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/vk')
  })

  test('should display VK list page', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })

    // Check page heading
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('create-vk-button')).toBeVisible()
  })

  test('should display filter sidebar', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await expect(page.getByTestId('filter-sidebar')).toBeVisible()
    await expect(page.getByTestId('filter-section-status')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await expect(page.getByTestId('search-input')).toBeVisible()
  })

  test('should display VK list', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await expect(page.getByTestId('vk-list')).toBeVisible()
    // List has header and rows
    await expect(page.getByTestId('vk-list-header')).toBeVisible()
    const rows = page.locator('[data-testid^="vk-row-"]')
    await expect(rows.first()).toBeVisible()
  })

  test('should search VK by identifier', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('VK')

    // Wait for debounce
    await page.waitForTimeout(600)

    // Wait for results
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })

    const rows = page.locator('[data-testid^="vk-row-"]')
    await expect(rows.first()).toBeVisible()
  })

  test('should clear search', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('Test')
    await page.waitForTimeout(600)

    // Use clear button
    await page.getByTestId('clear-search-button').click()
    await page.waitForTimeout(600)

    const rows = page.locator('[data-testid^="vk-row-"]')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter VK by status using sidebar', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })

    // Click on a status checkbox in the sidebar
    const statusCheckbox = page.getByTestId('status-filter-priprava')
    await statusCheckbox.click()

    // Wait for results
    await page.waitForTimeout(1000)

    // Should show either results or empty state
    const list = page.getByTestId('vk-list')
    const emptyState = page.getByTestId('empty-state')
    await expect(list.or(emptyState)).toBeVisible()
  })

  test('should navigate to create VK page', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await page.getByTestId('create-vk-button').click()
    await page.waitForURL('/vk/new')
    await expect(page.getByTestId('page-title')).toBeVisible()
  })

  test('should navigate to VK detail on row click', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const firstRow = page.locator('[data-testid^="vk-row-"]').first()
    await firstRow.click()

    // Should navigate to VK detail
    await page.waitForURL(/\/vk\/[a-z0-9]+/)
    await expect(page.getByTestId('vk-detail-page')).toBeVisible()
  })

  test('should display VK status badges', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    // Check that status badges are displayed
    const firstRow = page.locator('[data-testid^="vk-row-"]').first()
    const statusBadge = firstRow.locator('[data-testid^="status-badge-"]')
    await expect(statusBadge).toBeVisible()
  })

  test('should sort VK list', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const sortDropdown = page.getByTestId('sort-dropdown')
    await sortDropdown.click()

    // Select oldest first
    await page.getByRole('option', { name: 'Zoradiť od najstarších' }).click()

    // Wait for results
    await page.waitForTimeout(1000)

    const rows = page.locator('[data-testid^="vk-row-"]')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter by date range', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })

    // Set date from filter
    const dateFrom = page.getByTestId('date-filter-from')
    await dateFrom.fill('2024-01-01')

    // Wait for results
    await page.waitForTimeout(1000)

    // Should show either results or empty state
    const list = page.getByTestId('vk-list')
    const emptyState = page.getByTestId('empty-state')
    await expect(list.or(emptyState)).toBeVisible()
  })
})
