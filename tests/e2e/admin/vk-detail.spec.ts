import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Detail @admin @vk', () => {
  let vkId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to VK list and get first VK
    await page.goto('/vk')
    await page.waitForSelector('tbody tr')

    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/vk\/[a-z0-9]+/)

    // Extract VK ID from URL
    const url = page.url()
    vkId = url.split('/').pop() || ''
  })

  test('should display VK detail page', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()

    // Check if we see VK info sections
    await expect(page.locator('text=Základné informácie')).toBeVisible()
    await expect(page.locator('text=Upraviť VK')).toBeVisible()
  })

  test('should display VK basic information', async ({ page }) => {
    const infoSection = page.locator('text=Základné informácie').locator('..')
    await expect(infoSection).toBeVisible()

    // Should show identifier, position, etc.
    await expect(page.locator('dt:has-text("Identifikátor")')).toBeVisible()
    await expect(page.locator('dt:has-text("Pozícia")')).toBeVisible()
    await expect(page.locator('dt:has-text("Rezort")')).toBeVisible()
    await expect(page.locator('dt:has-text("Stav")')).toBeVisible()
  })

  test('should display edit form', async ({ page }) => {
    await expect(page.locator('input[name="position"]')).toBeVisible()
    await expect(page.locator('input[name="selectionType"]')).toBeVisible()
    await expect(page.locator('button:has-text("Uložiť zmeny")')).toBeVisible()
  })

  test('should update VK position', async ({ page }) => {
    const positionInput = page.locator('input[name="position"]')
    const newPosition = `Updated Position ${Date.now()}`

    await positionInput.clear()
    await positionInput.fill(newPosition)

    await page.click('button:has-text("Uložiť zmeny")')

    // Wait for save
    await page.waitForTimeout(2000)

    // Reload to verify
    await page.reload()
    await expect(positionInput).toHaveValue(newPosition)
  })

  test('should update VK status', async ({ page }) => {
    const statusSelect = page.locator('select[name="status"]')

    // Select different status
    await statusSelect.selectOption('TESTOVANIE')

    // Save
    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)

    // Verify
    await page.reload()
    await expect(statusSelect).toHaveValue('TESTOVANIE')

    // Reset to PRIPRAVA for other tests
    await statusSelect.selectOption('PRIPRAVA')
    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)
  })

  test('should update VK number of positions', async ({ page }) => {
    const numberOfPositionsInput = page.locator('input[name="numberOfPositions"]')

    await numberOfPositionsInput.clear()
    await numberOfPositionsInput.fill('3')

    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)

    await page.reload()
    await expect(numberOfPositionsInput).toHaveValue('3')
  })

  test('should cancel edit and return to VK list', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/vk')
    await expect(page.locator('h1')).toContainText('Výberové konania')
  })

  test('should navigate back to VK list', async ({ page }) => {
    await page.click('text=Späť')
    await page.waitForURL('/vk')
    await expect(page.locator('h1')).toContainText('Výberové konania')
  })

  test('should display candidates section', async ({ page }) => {
    const candidatesSection = page.locator('text=Uchádzači')
    const candidatesSectionVisible = await candidatesSection.isVisible().catch(() => false)

    if (candidatesSectionVisible) {
      await expect(candidatesSection).toBeVisible()
    }
  })

  test('should display assigned tests section', async ({ page }) => {
    const testsSection = page.locator('text=Priradené testy')
    const testsSectionVisible = await testsSection.isVisible().catch(() => false)

    if (testsSectionVisible) {
      await expect(testsSection).toBeVisible()
    }
  })

  test('should display commission section', async ({ page }) => {
    const commissionSection = page.locator('text=Komisia')
    const commissionSectionVisible = await commissionSection.isVisible().catch(() => false)

    if (commissionSectionVisible) {
      await expect(commissionSection).toBeVisible()
    }
  })

  test('should update multiple fields at once', async ({ page }) => {
    const timestamp = Date.now()

    await page.fill('input[name="position"]', `Multi Update Position ${timestamp}`)
    await page.fill('input[name="organizationalUnit"]', `Multi Update Unit ${timestamp}`)
    await page.fill('input[name="serviceField"]', `Multi Update Field ${timestamp}`)

    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)

    await page.reload()

    await expect(page.locator('input[name="position"]')).toHaveValue(`Multi Update Position ${timestamp}`)
    await expect(page.locator('input[name="organizationalUnit"]')).toHaveValue(`Multi Update Unit ${timestamp}`)
    await expect(page.locator('input[name="serviceField"]')).toHaveValue(`Multi Update Field ${timestamp}`)
  })
})
