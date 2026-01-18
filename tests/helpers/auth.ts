import { Page } from '@playwright/test'

export async function loginAsSuperadmin(page: Page) {
  await page.goto('/admin/login')
  await page.fill('input#login', 'superadmin@retry.sk')
  await page.fill('input#password', 'Hackaton25')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.fill('input#login', 'admin.mv@retry.sk')
  await page.fill('input#password', 'Test1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

export async function loginAsGestor(page: Page) {
  await page.goto('/admin/login')
  await page.fill('input#login', 'gestor.mv@retry.sk')
  await page.fill('input#password', 'Test1234')
  await page.click('button[type="submit"]')
  await page.waitForURL('/gestor/dashboard', { timeout: 10000 })
}

export async function logout(page: Page) {
  await page.click('button:has-text("Odhlásiť")')
  await page.waitForURL('/admin/login')
}
