import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Admin Dashboard @admin @dashboard @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should display dashboard with statistics', async ({ page }) => {
    await expect(page.locator('h1').last()).toContainText('Dashboard')

    // Check stats cards are visible
    await expect(page.locator('text=Aktívne VK')).toBeVisible()
    await expect(page.locator('text=Uchádzači')).toBeVisible()
    await expect(page.locator('text=Používatelia')).toBeVisible()
  })

  test('should display stats numbers', async ({ page }) => {
    // Stats should have numbers
    const activeVKCard = page.locator('text=Aktívne VK').locator('..')
    await expect(activeVKCard.locator('.text-3xl')).toBeVisible()

    const candidatesCard = page.locator('text=Uchádzači').locator('..')
    await expect(candidatesCard.locator('.text-3xl')).toBeVisible()

    const usersCard = page.locator('text=Používatelia').locator('..')
    await expect(usersCard.locator('.text-3xl')).toBeVisible()
  })

  test('should navigate to VK list when clicking Active VK card', async ({ page }) => {
    await page.click('text=Aktívne VK')
    await page.waitForURL('/vk')
    await expect(page.locator('h1').last()).toContainText('Výberové konania')
  })

  test('should navigate to applicants list when clicking Applicants card', async ({ page }) => {
    await page.click('text=Uchádzači')
    await page.waitForURL('/applicants')
    await expect(page.locator('h1').last()).toContainText('Uchádzači')
  })

  test('should navigate to users list when clicking Users card', async ({ page }) => {
    await page.click('text=Používatelia')
    await page.waitForURL('/users')
    await expect(page.locator('h1').last()).toContainText('Používatelia')
  })

  test('should display recent VK section', async ({ page }) => {
    await expect(page.locator('text=Posledné výberové konania')).toBeVisible()
    await expect(page.locator('text=Nové VK')).toBeVisible()
  })

  test('should navigate to create VK when clicking create VK link', async ({ page }) => {
    await page.click('a[href="/vk/new"]')
    await page.waitForURL('/vk/new')
    await expect(page.locator('h1').last()).toContainText('Vytvorenie nového výberového konania')
  })
})
