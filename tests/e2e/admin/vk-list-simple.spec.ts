import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK List Simple Tests @admin @vk @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/vk')
  })

  test('should display VK list page with created VKs', async ({ page }) => {
    // Check header
    await expect(page.locator('h1').last()).toContainText('Výberové konania')

    // Check create button
    await expect(page.locator('text=Vytvoriť VK')).toBeVisible()

    // Check search input
    await expect(page.locator('input[placeholder="Hľadať..."]')).toBeVisible()

    // Check table
    await expect(page.locator('table')).toBeVisible()

    // Should have at least our 5 VKs
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(5)

    // Check first row has VK identifier
    await expect(rows.first()).toContainText('VK/2025')
  })

  test('should navigate to VK detail when clicking identifier', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('tbody tr')

    // Click first VK identifier link
    const firstVKLink = page.locator('tbody tr').first().locator('a').first()
    await firstVKLink.click()

    // Should navigate to VK detail page
    await page.waitForURL(/\/vk\/[a-z0-9]+/)
    await expect(page.locator('h1').last()).toBeVisible()
  })

  test('should navigate to create VK page', async ({ page }) => {
    await page.click('text=Vytvoriť VK')
    await page.waitForURL('/vk/new')
    await expect(page.locator('h1').last()).toContainText('Vytvoriť výberové konanie')
  })

  test('should display VK table columns', async ({ page }) => {
    await expect(page.locator('th:has-text("Identifikátor")')).toBeVisible()
    await expect(page.locator('th:has-text("Pozícia")')).toBeVisible()
    await expect(page.locator('th:has-text("Rezort")')).toBeVisible()
    await expect(page.locator('th:has-text("Stav")')).toBeVisible()
  })

  test('should search VKs by identifier', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('tbody tr')

    const searchInput = page.locator('input[placeholder="Hľadať..."]')
    await searchInput.fill('VK/2025')

    // Wait for debounce + search
    await page.waitForTimeout(1500)

    // Should have results
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)

    // All results should contain VK/2025
    await expect(rows.first()).toContainText('VK/2025')
  })

  test('should display status badges', async ({ page }) => {
    await page.waitForSelector('tbody tr')

    // Check for status badge in first row
    const firstRow = page.locator('tbody tr').first()
    const statusBadge = firstRow.locator('.inline-flex.items-center.px-2')
    await expect(statusBadge).toBeVisible()
    await expect(statusBadge).toContainText('Príprava')
  })
})
