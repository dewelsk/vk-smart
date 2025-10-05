import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK List @admin @vk @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/vk')
  })

  test('should display VK list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Výberové konania')
    await expect(page.locator('button:has-text("+ Nové VK")')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await expect(page.locator('input[placeholder="Hľadaj..."]')).toBeVisible()
  })

  test('should display VK table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th:has-text("Identifikátor")')).toBeVisible()
    await expect(page.locator('th:has-text("Pozícia")')).toBeVisible()
    await expect(page.locator('th:has-text("Rezort")')).toBeVisible()
    await expect(page.locator('th:has-text("Stav")')).toBeVisible()
    await expect(page.locator('th:has-text("Uchádzači")')).toBeVisible()
  })

  test('should search VK by identifier', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
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
    const searchInput = page.locator('input[placeholder="Hľadaj..."]')
    await searchInput.fill('Test')
    await page.waitForTimeout(600)

    await searchInput.clear()
    await page.waitForTimeout(600)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should filter VK by status', async ({ page }) => {
    const statusFilter = page.locator('text=Filtruj podľa stavu...').first()
    await statusFilter.click()

    // Select PRIPRAVA
    await page.click('text=Príprava')

    // Click outside
    await page.click('h1')

    // Wait for results
    await page.waitForTimeout(1000)

    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should navigate to create VK page', async ({ page }) => {
    await page.click('button:has-text("+ Nové VK")')
    await page.waitForURL('/vk/new')
    await expect(page.locator('h1')).toContainText('Vytvorenie nového výberového konania')
  })

  test('should navigate to VK detail on row click', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Should navigate to VK detail
    await page.waitForURL(/\/vk\/[a-z0-9]+/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should sort table by identifier', async ({ page }) => {
    await page.click('th:has-text("Identifikátor")')

    // Wait for sort
    await page.waitForTimeout(500)

    // Check if sorted icon visible
    await expect(page.locator('th:has-text("Identifikátor") svg')).toBeVisible()
  })

  test('should sort table by position', async ({ page }) => {
    await page.click('th:has-text("Pozícia")')
    await page.waitForTimeout(500)
    await expect(page.locator('th:has-text("Pozícia") svg')).toBeVisible()
  })

  test('should display VK status badges', async ({ page }) => {
    // Should have status badges with colors
    const firstRow = page.locator('tbody tr').first()
    const statusBadge = firstRow.locator('.inline-flex.items-center.px-2')
    await expect(statusBadge).toBeVisible()
  })

  test('should display candidates count', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()
    const candidatesCell = firstRow.locator('td').nth(4) // 5th column
    await expect(candidatesCell).toBeVisible()
  })
})
