import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Create @admin @vk @critical', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/vk/new')
  })

  test('should display create VK form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vytvorenie nového výberového konania')

    // Check form fields
    await expect(page.locator('label:has-text("Identifikátor")')).toBeVisible()
    await expect(page.locator('label:has-text("Rezort")')).toBeVisible()
    await expect(page.locator('label:has-text("Druh výberového konania")')).toBeVisible()
    await expect(page.locator('label:has-text("Organizačná jednotka")')).toBeVisible()
    await expect(page.locator('label:has-text("Služobná oblasť")')).toBeVisible()
    await expect(page.locator('label:has-text("Označenie pracovného miesta")')).toBeVisible()
    await expect(page.locator('label:has-text("Druh štátnej služby")')).toBeVisible()
    await expect(page.locator('label:has-text("Dátum vyhlásenia")')).toBeVisible()

    // Check buttons
    await expect(page.locator('button:has-text("Vytvoriť VK")')).toBeVisible()
    await expect(page.locator('a:has-text("Zrušiť")')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button:has-text("Vytvoriť VK")')

    // Should show validation errors
    await expect(page.locator('text=Identifikátor je povinný')).toBeVisible()
    await expect(page.locator('text=Rezort je povinný')).toBeVisible()
    await expect(page.locator('text=Druh výberového konania je povinný')).toBeVisible()
    await expect(page.locator('text=Organizačná jednotka je povinná')).toBeVisible()
  })

  test('should create new VK successfully', async ({ page }) => {
    const timestamp = Date.now()

    // Fill form using data-testid
    await page.getByTestId('identifier-input').fill(`VK-TEST-${timestamp}`)

    // Select institution (rezort) - using inputId
    await page.locator('#institution-select').click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')

    await page.getByTestId('selection-type-input').fill('Výberové konanie')
    await page.getByTestId('organizational-unit-input').fill('Test Unit')
    await page.getByTestId('service-field-input').fill('Test Field')
    await page.getByTestId('position-input').fill('Test Position')
    await page.getByTestId('service-type-input').fill('Test Type')
    await page.getByTestId('date-input').fill('2025-12-31')

    // Submit form
    await page.getByTestId('submit-button').click()

    // Should redirect to VK detail
    await page.waitForURL(/\/vk\/[a-z0-9]+$/, { timeout: 10000 })

    // Verify we're on VK detail page
    await page.waitForLoadState('networkidle')
    const pageText = await page.textContent('body')
    expect(pageText).toContain('VK')
  })

  test('should cancel VK creation', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/vk')
    await expect(page.locator('h1')).toContainText('Výberové konania')
  })

  test('should set default numberOfPositions to 1', async ({ page }) => {
    const numberOfPositionsInput = page.locator('input[name="numberOfPositions"]')
    await expect(numberOfPositionsInput).toHaveValue('1')
  })

  test('should change numberOfPositions', async ({ page }) => {
    const numberOfPositionsInput = page.locator('input[name="numberOfPositions"]')
    await numberOfPositionsInput.clear()
    await numberOfPositionsInput.fill('5')
    await expect(numberOfPositionsInput).toHaveValue('5')
  })

  test('should create VK with gestor', async ({ page }) => {
    const timestamp = Date.now()

    await page.fill('input[name="identifier"]', `VK-GESTOR-${timestamp}`)

    // Select institution
    await page.click('text=Vyber rezort...')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')

    await page.fill('input[name="selectionType"]', 'Výberové konanie')
    await page.fill('input[name="organizationalUnit"]', 'Test Unit')
    await page.fill('input[name="serviceField"]', 'Test Field')
    await page.fill('input[name="position"]', 'Test Position')
    await page.fill('input[name="serviceType"]', 'Test Type')
    await page.fill('input[name="date"]', '2025-12-31')

    // Select gestor
    const gestorSelect = page.locator('text=Vyber gestora...').first()
    await gestorSelect.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')

    // Submit
    await page.click('button:has-text("Vytvoriť VK")')
    await page.waitForURL(/\/vk/, { timeout: 10000 })
  })

  test('should validate date field', async ({ page }) => {
    const dateInput = page.locator('input[name="date"]')
    await dateInput.fill('invalid-date')

    // Browser should handle date validation
    await expect(dateInput).toBeFocused()
  })
})
