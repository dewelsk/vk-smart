import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Applicants Create @admin @applicants @critical', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/applicants/new')
  })

  test('should display create applicant form', async ({ page }) => {
    await expect(page.locator('h1').last()).toContainText('Vytvoriť nového uchádzača')

    // Check form fields
    await expect(page.locator('label:has-text("Výberové konanie")')).toBeVisible()
    await expect(page.locator('label:has-text("Meno")')).toBeVisible()
    await expect(page.locator('label:has-text("Priezvisko")')).toBeVisible()
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label:has-text("Heslo")')).toBeVisible()
    await expect(page.locator('label:has-text("CIS Identifikátor")')).toBeVisible()

    // Check buttons
    await expect(page.locator('button:has-text("Vytvoriť uchádzača")')).toBeVisible()
    await expect(page.locator('a:has-text("Zrušiť")')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button:has-text("Vytvoriť uchádzača")')

    // Should show validation errors
    await expect(page.locator('text=Výberové konanie je povinné')).toBeVisible()
    await expect(page.locator('text=Meno je povinné')).toBeVisible()
    await expect(page.locator('text=Priezvisko je povinné')).toBeVisible()
    await expect(page.locator('text=Email je povinný')).toBeVisible()
    await expect(page.locator('text=Heslo je povinné')).toBeVisible()
    await expect(page.locator('text=CIS identifikátor je povinný')).toBeVisible()
  })

  test.skip('should show validation error for invalid email', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button:has-text("Vytvoriť uchádzača")')

    await expect(page.locator('text=Neplatná emailová adresa')).toBeVisible()
  })

  test('should create new applicant successfully', async ({ page }) => {
    const timestamp = Date.now()

    // Select VK - click on the select control itself
    await page.locator('#vk').click()
    await page.waitForTimeout(300)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Escape')

    // Fill user data
    await page.fill('input[name="name"]', 'Testovací')
    await page.fill('input[name="surname"]', 'Uchádzač')
    await page.fill('input[name="email"]', `uchadzac.${timestamp}@test.sk`)
    await page.fill('input[name="password"]', 'TestPassword123!')

    // Fill applicant data
    await page.fill('input[name="cisIdentifier"]', `CIS${timestamp}`)
    await page.fill('input[name="applicantEmail"]', `alt.${timestamp}@test.sk`)

    // Submit form
    await page.click('button:has-text("Vytvoriť uchádzača")')

    // Should redirect to applicants list
    await page.waitForURL('/applicants', { timeout: 15000 })

    // Should see success (user in list)
    await expect(page.locator('h1').last()).toContainText('Uchádzači')

    // Search for created applicant
    const searchInput = page.locator('input[placeholder="Hľadať..."]')
    await searchInput.fill(`CIS${timestamp}`)
    await page.waitForTimeout(1000)

    // Should find the applicant
    await expect(page.locator(`text=CIS${timestamp}`)).toBeVisible()
  })

  test('should cancel applicant creation', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/applicants')
    await expect(page.locator('h1').last()).toContainText('Uchádzači')
  })

  test.skip('should navigate from applicants list to create page', async ({ page }) => {
    await page.goto('/applicants')

    // Click "Pridať uchádzača" button
    const createButton = page.locator('a:has-text("Pridať uchádzača")')
    await expect(createButton).toBeVisible()

    await createButton.click()

    // Wait for navigation
    await page.waitForURL('/applicants/new')

    // Check we landed on create page
    await expect(page.locator('h1').last()).toContainText('Vytvoriť nového uchádzača')
  })
})
