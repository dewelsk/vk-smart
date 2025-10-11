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
    await expect(page.locator('label:has-text("CIS Identifikátor")')).toBeVisible()
    await expect(page.locator('label:has-text("Heslo")')).toBeVisible()
    await expect(page.locator('label:has-text("Email")')).toBeVisible()
    await expect(page.locator('label:has-text("Telefón")')).toBeVisible()
    await expect(page.locator('label:has-text("Dátum narodenia")')).toBeVisible()

    // Check buttons
    await expect(page.locator('button:has-text("Vytvoriť uchádzača")')).toBeVisible()
    await expect(page.locator('a:has-text("Zrušiť")')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button:has-text("Vytvoriť uchádzača")')

    // Should show validation errors for required fields only
    await expect(page.locator('text=Výberové konanie je povinné')).toBeVisible()
    await expect(page.locator('text=Meno je povinné')).toBeVisible()
    await expect(page.locator('text=Priezvisko je povinné')).toBeVisible()
    await expect(page.locator('text=CIS identifikátor je povinný')).toBeVisible()
  })

  test.skip('should show validation error for invalid email', async ({ page }) => {
    await page.fill('#email', 'invalid-email')
    await page.click('button:has-text("Vytvoriť uchádzača")')

    await expect(page.locator('text=Neplatná emailová adresa')).toBeVisible()
  })

  test('should create new applicant successfully', async ({ page }) => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000

    // Select first VK from dropdown
    await page.locator('#vk-select').click()
    await page.waitForTimeout(300)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)

    // Use VK-2025-001 format (we know this exists from seed data)
    // In real scenario, the selected VK would determine this, but for test we can use a known format
    const cisId = `VK-2025-001/${randomNum}`

    // Fill candidate data (required fields)
    await page.fill('#name', 'Martin')
    await page.fill('#surname', 'Testovací')
    await page.fill('#cisIdentifier', cisId)

    // Fill optional fields
    await page.fill('#pin', 'test123')
    await page.fill('#email', `martin${randomNum}@test.sk`)

    // Submit form
    await page.click('button:has-text("Vytvoriť uchádzača")')

    // Should redirect to applicants list
    await page.waitForURL('/applicants', { timeout: 15000 })

    // Should see success (user in list)
    await expect(page.locator('h1').last()).toContainText('Uchádzači')

    // Search for created applicant by CIS ID
    const searchInput = page.locator('input[placeholder="Hľadať..."]')
    await searchInput.fill(cisId)
    await page.waitForTimeout(1000)

    // Should find the applicant with unique CIS ID
    await expect(page.locator(`text=${cisId}`)).toBeVisible()
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
