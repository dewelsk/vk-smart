import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Users Create @admin @users @critical', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/users/new')
  })

  test('should display create user form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vytvoriť nového používateľa')

    // Check form fields
    await expect(page.locator('label:has-text("Meno")')).toBeVisible()
    await expect(page.locator('label:has-text("Priezvisko")')).toBeVisible()
    await expect(page.locator('label:has-text("Email")')).toBeVisible()
    await expect(page.locator('label:has-text("Používateľské meno")')).toBeVisible()
    await expect(page.locator('label:has-text("Heslo")')).toBeVisible()
    await expect(page.locator('label:has-text("Rola")')).toBeVisible()

    // Check buttons
    await expect(page.locator('button:has-text("Vytvoriť používateľa")')).toBeVisible()
    await expect(page.locator('a:has-text("Zrušiť")')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button:has-text("Vytvoriť používateľa")')

    // Should show validation errors
    await expect(page.locator('text=Meno je povinné')).toBeVisible()
    await expect(page.locator('text=Priezvisko je povinné')).toBeVisible()
    await expect(page.locator('text=Používateľské meno je povinné')).toBeVisible()
    await expect(page.locator('text=Heslo je povinné')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button:has-text("Vytvoriť používateľa")')

    await expect(page.locator('text=Neplatná emailová adresa')).toBeVisible()
  })

  test('should create new user successfully', async ({ page }) => {
    const timestamp = Date.now()

    // Fill form
    await page.fill('input[name="name"]', 'Test')
    await page.fill('input[name="surname"]', 'User')
    await page.fill('input[name="email"]', `test.user.${timestamp}@test.sk`)
    await page.fill('input[name="username"]', `test.user.${timestamp}`)
    await page.fill('input[name="password"]', 'TestPassword123!')

    // Select role
    await page.click('text=Vyber rolu...')
    await page.click('text=Admin')

    // Submit form
    await page.click('button:has-text("Vytvoriť používateľa")')

    // Should redirect to users list
    await page.waitForURL('/users', { timeout: 10000 })

    // Should see success (user in list)
    await expect(page.locator('h1')).toContainText('Používatelia')
  })

  test('should cancel user creation', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/users')
    await expect(page.locator('h1')).toContainText('Používatelia')
  })

  test('should create user with institution assignment', async ({ page }) => {
    const timestamp = Date.now()

    await page.fill('input[name="name"]', 'Admin')
    await page.fill('input[name="surname"]', 'Institution')
    await page.fill('input[name="email"]', `admin.inst.${timestamp}@test.sk`)
    await page.fill('input[name="username"]', `admin.inst.${timestamp}`)
    await page.fill('input[name="password"]', 'TestPassword123!')

    // Select Admin role
    await page.click('text=Vyber rolu...')
    await page.click('text=Admin')

    // Select institution
    await page.click('text=Vyber rezorty...')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')

    // Submit
    await page.click('button:has-text("Vytvoriť používateľa")')
    await page.waitForURL('/users', { timeout: 10000 })
  })

  test('should toggle active status checkbox', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]#active')

    // Should be checked by default
    await expect(checkbox).toBeChecked()

    // Uncheck
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()

    // Check again
    await checkbox.click()
    await expect(checkbox).toBeChecked()
  })
})
