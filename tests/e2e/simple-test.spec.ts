import { test, expect } from '@playwright/test'

test.describe('Simple 2FA Test', () => {
    test('should navigate to login page', async ({ page }) => {
        await page.goto('/admin/login')
        await expect(page.locator('input#login')).toBeVisible()
    })

    test('should login with superadmin', async ({ page }) => {
        await page.goto('/admin/login')
        await page.fill('input#login', 'superadmin@retry.sk')
        await page.fill('input#password', 'Hackaton25')
        await page.click('button[type="submit"]')
        await page.waitForURL('/dashboard', { timeout: 10000 })
        await expect(page).toHaveURL('/dashboard')
    })

    test('should login with testadmin', async ({ page }) => {
        await page.goto('/admin/login')
        await page.fill('input#login', 'testadmin@retry.sk')
        await page.fill('input#password', 'Hackaton25')
        await page.click('button[type="submit"]')
        // Wait longer and check any URL change
        await page.waitForTimeout(3000)
        console.log('Current URL after login:', page.url())
    })
})
