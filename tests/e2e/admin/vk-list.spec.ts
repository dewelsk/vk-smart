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

    // Check page heading (use more specific selector to avoid header h1)
    await expect(page.getByRole('heading', { name: 'Výberové konania', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /Vytvoriť VK/i })).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await expect(page.locator('input[placeholder="Hľadať..."]')).toBeVisible()
  })

  test('should display VK table', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await expect(page.locator('table')).toBeVisible()
    // Table has columns for: Identifikátor, Pozícia, Gestor, Uchádzači, Miesta, Dátum a čas začiatku, Validácia, Stav
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should search VK by identifier', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const searchInput = page.locator('input[placeholder="Hľadať..."]')
    await searchInput.fill('VK')

    // Wait for debounce
    await page.waitForTimeout(600)

    // Should show spinner
    await expect(page.locator('.animate-spin')).toBeVisible()

    // Wait for results
    await page.waitForTimeout(500)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should clear search', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const searchInput = page.locator('input[placeholder="Hľadať..."]')
    await searchInput.fill('Test')
    await page.waitForTimeout(600)

    await searchInput.clear()
    await page.waitForTimeout(600)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter VK by status', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const statusFilter = page.locator('#status-filter')
    await statusFilter.click()

    // Select PRIPRAVA option in the dropdown
    await page.getByRole('option', { name: 'Príprava' }).click()

    // Wait for results
    await page.waitForTimeout(1000)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should navigate to create VK page', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    await page.getByRole('link', { name: /Vytvoriť VK/i }).click()
    await page.waitForURL('/vk/new')
    await expect(page.getByTestId('page-title')).toBeVisible()
  })

  test('should navigate to VK detail on row click', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Should navigate to VK detail
    await page.waitForURL(/\/vk\/[a-z0-9]+/)
    await expect(page.getByTestId('vk-detail-page')).toBeVisible()
  })

  test('should display VK status badges', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    // Check that status badges are displayed with proper styling
    const firstRow = page.locator('tbody tr').first()
    const statusBadges = firstRow.locator('span.inline-flex.items-center.px-2\\.5.py-0\\.5.rounded-full.text-xs.font-medium')
    // Should have at least one badge (validation indicator or status)
    await expect(statusBadges.first()).toBeVisible()
  })

  test('should display candidates count', async ({ page }) => {
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })
    const firstRow = page.locator('tbody tr').first()
    const candidatesCell = firstRow.locator('td').nth(4) // 5th column
    await expect(candidatesCell).toBeVisible()
  })
})
