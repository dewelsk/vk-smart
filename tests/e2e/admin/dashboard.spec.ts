import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Admin Dashboard @admin @dashboard @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should display dashboard with statistics', async ({ page }) => {
    await expect(page.getByTestId('page-title')).toContainText('Dashboard')

    // Check stats cards are visible
    await expect(page.getByTestId('stat-vk')).toBeVisible()
    await expect(page.getByTestId('stat-applicants')).toBeVisible()
    await expect(page.getByTestId('stat-users')).toBeVisible()
    await expect(page.getByTestId('stat-tests')).toBeVisible()
  })

  test('should display stats numbers', async ({ page }) => {
    // Stats should have numbers
    await expect(page.getByTestId('active-vk-count')).toBeVisible()
    await expect(page.getByTestId('candidates-count')).toBeVisible()
    await expect(page.getByTestId('users-count')).toBeVisible()
  })

  test('should navigate to VK list when clicking Active VK card', async ({ page }) => {
    await page.getByTestId('stat-vk').click()
    await page.waitForURL('/vk')
    await expect(page).toHaveURL('/vk')
  })

  test('should navigate to applicants list when clicking Applicants card', async ({ page }) => {
    await page.getByTestId('stat-applicants').click()
    await page.waitForURL('/applicants')
    await expect(page).toHaveURL('/applicants')
  })

  test('should navigate to users list when clicking Users card', async ({ page }) => {
    await page.getByTestId('stat-users').click()
    await page.waitForURL('/users')
    await expect(page).toHaveURL('/users')
  })

  test('should display recent VK section', async ({ page }) => {
    await expect(page.getByTestId('recent-vk-section')).toBeVisible()
    await expect(page.getByTestId('recent-vk-title')).toBeVisible()
    await expect(page.getByTestId('create-vk-button')).toBeVisible()
  })

  test('should navigate to create VK when clicking create VK link', async ({ page }) => {
    await page.getByTestId('create-vk-button').click()
    await page.waitForURL('/vk/new')
    await expect(page).toHaveURL('/vk/new')
  })
})
