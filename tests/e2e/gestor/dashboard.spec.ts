import { test, expect } from '@playwright/test'
import { loginAsGestor } from '../../helpers/auth'

test.describe('Gestor Dashboard @gestor @dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGestor(page)
  })

  test('should display gestor dashboard', async ({ page }) => {
    await expect(page.getByTestId('gestor-dashboard-page')).toBeVisible()
    await expect(page.getByTestId('page-title')).toBeVisible()
  })

  test('should navigate to assignments page', async ({ page }) => {
    await page.getByTestId('gestor-assignments-nav').click()
    await page.waitForURL('/gestor/assignments')
    await expect(page.getByTestId('gestor-assignments-page')).toBeVisible()
  })
})
