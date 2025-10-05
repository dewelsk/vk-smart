import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Institutions Create @superadmin @institutions @critical', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/institutions/new')
  })

  test('should display create institution form', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Nový rezort')

    // Check form fields
    await expect(page.locator('label:has-text("Názov")')).toBeVisible()
    await expect(page.locator('label:has-text("Kód")')).toBeVisible()
    await expect(page.locator('label:has-text("Popis")')).toBeVisible()

    // Check buttons
    await expect(page.locator('button:has-text("Vytvoriť rezort")')).toBeVisible()
    await expect(page.locator('a:has-text("Zrušiť")')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button:has-text("Vytvoriť rezort")')

    // Should show validation errors
    await expect(page.locator('text=Názov je povinný')).toBeVisible()
    await expect(page.locator('text=Kód je povinný')).toBeVisible()
  })

  test('should validate code format', async ({ page }) => {
    await page.fill('input[name="code"]', 'invalid-code!')
    await page.click('button:has-text("Vytvoriť rezort")')

    await expect(page.locator('text=Kód môže obsahovať len písmená A-Z a číslice 0-9')).toBeVisible()
  })

  test('should create new institution successfully', async ({ page }) => {
    const timestamp = Date.now()

    // Fill form
    await page.fill('input[name="name"]', `Test Rezort ${timestamp}`)
    await page.fill('input[name="code"]', `TEST${timestamp.toString().slice(-4)}`)
    await page.fill('textarea[name="description"]', 'Testovací rezort')

    // Submit form
    await page.click('button:has-text("Vytvoriť rezort")')

    // Should redirect to institutions list
    await page.waitForURL('/institutions', { timeout: 15000 })

    // Should see success (institution in list)
    await expect(page.locator('main h1')).toContainText('Správa rezortov')
  })

  test('should auto-uppercase code input', async ({ page }) => {
    await page.fill('input[name="code"]', 'test')
    const codeValue = await page.inputValue('input[name="code"]')
    expect(codeValue).toBe('TEST')
  })

  test('should toggle active status checkbox', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]')

    // Should be checked by default
    await expect(checkbox).toBeChecked()

    // Uncheck
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()

    // Check again
    await checkbox.click()
    await expect(checkbox).toBeChecked()
  })

  test('should cancel institution creation', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/institutions')
    await expect(page.locator('main h1')).toContainText('Správa rezortov')
  })

  test('should reject duplicate code', async ({ page }) => {
    const timestamp = Date.now()
    const code = `DUP${timestamp.toString().slice(-4)}`

    // Create first institution
    await page.fill('input[name="name"]', `First Rezort ${timestamp}`)
    await page.fill('input[name="code"]', code)
    await page.click('button:has-text("Vytvoriť rezort")')
    await page.waitForURL('/institutions', { timeout: 15000 })

    // Try to create duplicate
    await page.goto('/institutions/new')
    await page.fill('input[name="name"]', `Second Rezort ${timestamp}`)
    await page.fill('input[name="code"]', code)
    await page.click('button:has-text("Vytvoriť rezort")')

    // Should show error
    await expect(page.locator(`text=Rezort s kódom '${code}' už existuje`)).toBeVisible()
  })
})
