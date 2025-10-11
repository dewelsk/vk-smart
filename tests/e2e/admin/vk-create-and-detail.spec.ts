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
    await page.getByTestId('identifier-input').fill(identifier)

    // Fill required fields using data-testid
    await page.getByTestId('selection-type-input').fill('Výberové konanie')
    await page.getByTestId('organizational-unit-input').fill('E2E Test Unit')
    await page.getByTestId('service-field-input').fill('E2E Test Field')
    await page.getByTestId('position-input').fill('E2E Test Position')
    await page.getByTestId('service-type-input').fill('E2E Test Service Type')

    // Fill DateTimePicker - react-datepicker creates a single input
    const dateTimeInput = page.locator('[data-testid="start-datetime-input"]')
    await dateTimeInput.click()
    await dateTimeInput.fill('31.12.2025 10:00')

    // Submit form
    await page.getByTestId('submit-button').click()

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
    await expect(page.getByTestId('vk-detail-page')).toBeVisible({ timeout: 10000 })

    // Verify VK identifier is displayed
    await expect(page.getByTestId('vk-identifier')).toContainText(identifier, { timeout: 5000 })
  })
})
