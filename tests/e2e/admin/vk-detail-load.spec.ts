import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Detail Load @admin @vk', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should load existing VK detail page', async ({ page }) => {
    // Use known VK ID from database
    const vkId = 'cmge896yc0008ezge9hglzyly'
    const expectedIdentifier = 'VK/2025/1759700517775'

    // Navigate to VK detail
    await page.goto(`/vk/${vkId}`)

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Take screenshot
    await page.screenshot({ path: 'vk-detail-screenshot.png', fullPage: true })

    // Check if VK detail loaded correctly by verifying VK identifier is displayed
    const vkIdentifier = page.getByTestId('vk-identifier')
    await expect(vkIdentifier).toBeVisible({ timeout: 5000 })
    await expect(vkIdentifier).toHaveText(expectedIdentifier)

    // Should NOT show error message
    const pageText = await page.textContent('body')
    expect(pageText).not.toContain('VK nenájdené')

    console.log('✅ VK detail loaded successfully!')
    console.log(`✅ VK identifier: ${expectedIdentifier}`)
    console.log('📸 Screenshot saved to: vk-detail-screenshot.png')
  })
})
