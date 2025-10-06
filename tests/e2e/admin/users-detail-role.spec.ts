import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Users Detail - Role Display @admin @users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should display correct role in select box for KOMISIA user', async ({ page }) => {
    // Use the specific KOMISIA user ID mentioned by the user
    const komisiaUserId = 'cmge4ya6s001gw474zcmqb441'

    // Navigate to user detail
    await page.goto(`/users/${komisiaUserId}`)

    // Wait for page to load
    await expect(page.getByTestId('user-detail-page')).toBeVisible({ timeout: 10000 })

    // Wait for role field to be visible (may take time due to API loading)
    await expect(page.getByTestId('role-field')).toBeVisible({ timeout: 15000 })

    // Get the role select component
    // React-select displays the selected value in an element with class 'select__single-value'
    const roleValue = page.locator('.select__single-value').first()

    // Verify the displayed value is "Komisia" not "Superadmin"
    await expect(roleValue).toHaveText('Komisia')

    // Also verify it's NOT showing Superadmin
    await expect(roleValue).not.toHaveText('Superadmin')
  })

  test('should display correct role in select box for ADMIN user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    let adminUserId: string | null = null

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const roleText = await row.locator('td').nth(2).textContent()

      if (roleText?.includes('ADMIN') && !roleText?.includes('SUPERADMIN')) {
        const detailLink = row.locator('a').first()
        const href = await detailLink.getAttribute('href')

        if (href) {
          adminUserId = href.split('/').pop() || null
          break
        }
      }
    }

    if (!adminUserId) {
      test.skip()
      return
    }

    await page.goto(`/users/${adminUserId}`)
    await expect(page.getByTestId('user-detail-page')).toBeVisible()
    await expect(page.getByTestId('role-field')).toBeVisible()

    const roleValue = page.locator('.select__single-value').first()
    await expect(roleValue).toHaveText('Admin')
    await expect(roleValue).not.toHaveText('Superadmin')
  })

  test('should display correct role in select box for GESTOR user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    let gestorUserId: string | null = null

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const roleText = await row.locator('td').nth(2).textContent()

      if (roleText?.includes('GESTOR')) {
        const detailLink = row.locator('a').first()
        const href = await detailLink.getAttribute('href')

        if (href) {
          gestorUserId = href.split('/').pop() || null
          break
        }
      }
    }

    if (!gestorUserId) {
      test.skip()
      return
    }

    await page.goto(`/users/${gestorUserId}`)
    await expect(page.getByTestId('user-detail-page')).toBeVisible()
    await expect(page.getByTestId('role-field')).toBeVisible()

    const roleValue = page.locator('.select__single-value').first()
    await expect(roleValue).toHaveText('Gestor')
    await expect(roleValue).not.toHaveText('Superadmin')
  })

  test('should display correct role in select box for SUPERADMIN user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForSelector('tbody tr', { timeout: 10000 })

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    let superadminUserId: string | null = null

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const roleText = await row.locator('td').nth(2).textContent()

      if (roleText?.includes('SUPERADMIN')) {
        const detailLink = row.locator('a').first()
        const href = await detailLink.getAttribute('href')

        if (href) {
          superadminUserId = href.split('/').pop() || null
          break
        }
      }
    }

    if (!superadminUserId) {
      test.skip()
      return
    }

    await page.goto(`/users/${superadminUserId}`)
    await expect(page.getByTestId('user-detail-page')).toBeVisible()
    await expect(page.getByTestId('role-field')).toBeVisible()

    const roleValue = page.locator('.select__single-value').first()
    await expect(roleValue).toHaveText('Superadmin')
  })
})
