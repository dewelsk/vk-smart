import { test, expect } from '@playwright/test'

/**
 * Production Smoke Tests
 *
 * These tests run against the live production site (https://vk.retry.sk)
 * to verify critical functionality works after deployment.
 *
 * Run with: npm run test:e2e:smoke
 */

const PRODUCTION_URL = 'https://vk.retry.sk'

test.describe('Production Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production
    test.setTimeout(60000)
  })

  test('should load homepage and redirect to login', async ({ page }) => {
    await page.goto(PRODUCTION_URL)

    // Should redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/)

    // Login page should load
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('should login with admin credentials', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/admin/login`)

    // Fill login form
    await page.getByTestId('email-input').fill(process.env.TEST_ADMIN_EMAIL || 'super@retry.sk')
    await page.getByTestId('password-input').fill(process.env.TEST_ADMIN_PASSWORD || 'heslo123')

    // Submit
    await page.getByTestId('login-button').click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('should load dashboard with stats', async ({ page }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/admin/login`)
    await page.getByTestId('email-input').fill(process.env.TEST_ADMIN_EMAIL || 'super@retry.sk')
    await page.getByTestId('password-input').fill(process.env.TEST_ADMIN_PASSWORD || 'heslo123')
    await page.getByTestId('login-button').click()

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
    await expect(page.getByTestId('dashboard-page')).toBeVisible()

    // Verify stats cards are visible
    await expect(page.getByTestId('stat-users')).toBeVisible()
    await expect(page.getByTestId('stat-vk')).toBeVisible()
    await expect(page.getByTestId('stat-applicants')).toBeVisible()
    await expect(page.getByTestId('stat-tests')).toBeVisible()
  })

  test('should load tests list page', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/admin/login`)
    await page.getByTestId('email-input').fill(process.env.TEST_ADMIN_EMAIL || 'super@retry.sk')
    await page.getByTestId('password-input').fill(process.env.TEST_ADMIN_PASSWORD || 'heslo123')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to tests via sidebar
    const testsMenuButton = page.locator('button:has-text("Testy")')
    await testsMenuButton.click()

    const testsLink = page.locator('a:has-text("Zoznam testov")')
    await testsLink.click()

    // Wait for tests page
    await expect(page).toHaveURL(/\/tests$/, { timeout: 10000 })
    await expect(page.getByTestId('tests-page')).toBeVisible()

    // Tests should load (or show empty state)
    const hasTests = await page.getByTestId('tests-table').isVisible().catch(() => false)
    const isEmpty = await page.locator('text=Žiadne testy').isVisible().catch(() => false)

    expect(hasTests || isEmpty).toBeTruthy()
  })

  test('should load practice tests page', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/admin/login`)
    await page.getByTestId('email-input').fill(process.env.TEST_ADMIN_EMAIL || 'super@retry.sk')
    await page.getByTestId('password-input').fill(process.env.TEST_ADMIN_PASSWORD || 'heslo123')
    await page.getByTestId('login-button').click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to practice via sidebar
    const testsMenuButton = page.locator('button:has-text("Testy")')
    await testsMenuButton.click()

    const practiceLink = page.locator('a:has-text("Precvičovanie")')
    await practiceLink.click()

    // Wait for practice page
    await expect(page).toHaveURL(/\/tests\/practice$/, { timeout: 10000 })
    await expect(page.getByTestId('practice-page')).toBeVisible()
  })

  test('should verify API is responding', async ({ request }) => {
    // Test that API endpoints are reachable (without auth for public endpoints)
    // This is a basic connectivity test

    const response = await request.get(`${PRODUCTION_URL}/api/health`)

    // We expect 404 (no health endpoint) or redirect, but NOT timeout or connection error
    // The important thing is that we got a response
    expect([200, 307, 404]).toContain(response.status())
  })
})
