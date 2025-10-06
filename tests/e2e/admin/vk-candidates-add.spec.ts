import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Candidates - Add @admin @vk @candidates', () => {
  let vkId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to VK list
    await page.goto('/vk')

    // Wait for data rows
    try {
      await page.waitForSelector('tbody tr.hover\\:bg-gray-50', { timeout: 10000 })
    } catch (error) {
      const emptyMessage = page.locator('td:has-text("Žiadne výsledky")')
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false)

      if (hasEmptyMessage) {
        console.log('No VKs found - skipping test')
        test.skip()
        return
      }
      throw error
    }

    const firstRow = page.locator('tbody tr.hover\\:bg-gray-50').first()
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/vk\/[a-z0-9]+/, { timeout: 10000 })

    // Extract VK ID from URL
    const url = page.url()
    vkId = url.split('/').pop()?.split('?')[0] || ''

    console.log(`Testing VK ID: ${vkId}`)
  })

  test('should add candidate successfully', async ({ page }) => {
    // Go to Candidates tab
    await page.locator('#candidates-tab').click()
    await page.waitForTimeout(500)

    // Get initial candidate count
    const candidateCountText = await page.locator('#candidates-title').textContent()
    const initialCount = parseInt(candidateCountText?.match(/\d+/)?.[0] || '0')

    console.log(`Initial candidate count: ${initialCount}`)

    // Click add candidate button
    await page.locator('button:has-text("Pridať uchádzača")').click()
    await page.waitForTimeout(1000)

    // Wait for users to load
    const loadingText = page.locator('text=Načítavam používateľov...')
    if (await loadingText.isVisible()) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    }

    // Check if there are available users
    const checkboxes = page.locator('input[type="checkbox"]').filter({ hasNot: page.locator('[disabled]') })
    const checkboxCount = await checkboxes.count()

    console.log(`Available users: ${checkboxCount}`)

    if (checkboxCount === 0) {
      console.log('No UCHADZAC users available - skipping test')
      test.skip()
      return
    }

    // Select first user
    await checkboxes.first().check()
    await page.waitForTimeout(500)

    // Click save button
    const saveButton = page.locator('button:has-text("Pridať")')
    await saveButton.click()

    // Wait for API call
    await page.waitForTimeout(2000)

    // Verify success toast
    const successToast = page.locator('text=Pridali ste')
    await expect(successToast).toBeVisible({ timeout: 5000 })

    console.log('Success toast shown')

    // Verify candidate count increased
    const newCandidateCountText = await page.locator('#candidates-title').textContent()
    const newCount = parseInt(newCandidateCountText?.match(/\d+/)?.[0] || '0')

    console.log(`New candidate count: ${newCount}`)

    expect(newCount).toBe(initialCount + 1)
  })
})
