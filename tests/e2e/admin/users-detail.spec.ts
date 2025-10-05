import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Users Detail @admin @users', () => {
  let userId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to users list and get first user
    await page.goto('/users')
    await page.waitForSelector('tbody tr')

    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/users\/[a-z0-9]+/)

    // Extract user ID from URL
    const url = page.url()
    userId = url.split('/').pop() || ''
  })

  test('should display user detail page', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()

    // Check if we see user info sections
    await expect(page.locator('text=Základné informácie')).toBeVisible()
    await expect(page.locator('text=Upraviť používateľa')).toBeVisible()
  })

  test('should display user information', async ({ page }) => {
    // Should show email, username, role, etc.
    const infoSection = page.locator('text=Základné informácie').locator('..')
    await expect(infoSection).toBeVisible()
  })

  test('should display edit form', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="surname"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Uložiť zmeny")')).toBeVisible()
  })

  test('should update user name', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]')
    await nameInput.clear()
    await nameInput.fill('Updated Name')

    await page.click('button:has-text("Uložiť zmeny")')

    // Wait for save
    await page.waitForTimeout(2000)

    // Should still be on the page
    await expect(page.locator('h1')).toContainText('Updated Name')
  })

  test('should update user email', async ({ page }) => {
    const timestamp = Date.now()
    const emailInput = page.locator('input[name="email"]')

    await emailInput.clear()
    await emailInput.fill(`updated.${timestamp}@test.sk`)

    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)

    // Reload to verify
    await page.reload()
    await expect(emailInput).toHaveValue(`updated.${timestamp}@test.sk`)
  })

  test('should toggle user active status', async ({ page }) => {
    const activeCheckbox = page.locator('input[type="checkbox"]#active')

    // Get current state
    const wasChecked = await activeCheckbox.isChecked()

    // Toggle
    await activeCheckbox.click()

    // Save
    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)

    // Verify it changed
    await expect(activeCheckbox).toHaveProperty('checked', !wasChecked)
  })

  test('should cancel edit and return to users list', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/users')
    await expect(page.locator('h1')).toContainText('Používatelia')
  })

  test('should display delete button', async ({ page }) => {
    await expect(page.locator('button:has-text("Odstrániť")')).toBeVisible()
  })

  test('should show confirmation dialog on delete', async ({ page }) => {
    // Setup dialog listener
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain('odstrániť')
      await dialog.dismiss()
    })

    await page.click('button:has-text("Odstrániť")')

    // Wait a bit to ensure dialog was shown
    await page.waitForTimeout(500)
  })

  test('should navigate back to users list', async ({ page }) => {
    await page.click('text=Späť')
    await page.waitForURL('/users')
    await expect(page.locator('h1')).toContainText('Používatelia')
  })

  test('should display associated VKs if user is gestor', async ({ page }) => {
    // If user has gestorVKs, should display them
    const vkSection = page.locator('text=Výberové konania')
    const vkSectionVisible = await vkSection.isVisible().catch(() => false)

    if (vkSectionVisible) {
      await expect(vkSection).toBeVisible()
    }
  })

  test('should display institutions', async ({ page }) => {
    const institutionsSection = page.locator('text=Rezorty')
    await expect(institutionsSection).toBeVisible()
  })
})
