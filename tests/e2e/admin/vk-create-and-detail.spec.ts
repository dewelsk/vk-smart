import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('VK Create and Detail @admin @vk @critical', () => {
  let vkId: string | null = null

  test.afterAll(async () => {
    // Cleanup: Delete created VK
    if (vkId) {
      await prisma.$connect()
      await prisma.vyberoveKonanie.delete({ where: { id: vkId } }).catch(() => {})
      await prisma.$disconnect()
    }
  })

  test('should create VK and load detail page successfully', async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to VK create page
    await page.goto('/vk/new')
    await expect(page.getByTestId('page-title')).toHaveText('Vytvoriť výberové konanie')

    const timestamp = Date.now()
    const identifier = `VK-E2E-TEST-${timestamp}`

    // Fill identifier
    await page.fill('#identifier', identifier)

    // Select institution (rezort) - click and select first option
    const institutionSelect = page.locator('.css-13cymwt-control').first()
    await institutionSelect.click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Fill required fields
    await page.fill('#selectionType', 'Výberové konanie')
    await page.fill('#organizationalUnit', 'E2E Test Unit')
    await page.fill('#serviceField', 'E2E Test Field')
    await page.fill('#position', 'E2E Test Position')
    await page.fill('#serviceType', 'E2E Test Service Type')
    await page.fill('#date', '2025-12-31')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to VK detail page
    await page.waitForURL(/\/vk\/[a-z0-9]+$/, { timeout: 10000 })

    // Extract VK ID from URL for cleanup
    const url = page.url()
    const match = url.match(/\/vk\/([a-z0-9]+)$/)
    if (match) {
      vkId = match[1]
    }

    // Verify we're on VK detail page
    await expect(page).toHaveURL(new RegExp(`/vk/${vkId}$`))

    // Verify VK detail page loaded
    await expect(page.locator('h1')).toContainText('Detail výberového konania', { timeout: 10000 })

    // Verify VK data is displayed
    await expect(page.locator(`text=${identifier}`)).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=E2E Test Position')).toBeVisible()
    await expect(page.locator('text=PRIPRAVA')).toBeVisible()
  })
})
