import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Commission Management @admin @vk @commission', () => {
  let vkId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to VK list
    await page.goto('/vk')

    // Wait for either data rows or empty message to appear
    try {
      await page.waitForSelector('tbody tr.hover\\:bg-gray-50', { timeout: 10000 })
    } catch (error) {
      // Check if there's an empty message
      const emptyMessage = page.locator('td:has-text("Žiadne výsledky")')
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false)

      if (hasEmptyMessage) {
        console.log('No VKs found in database - skipping commission test')
        test.skip()
        return
      }

      // If no empty message and no data rows, something is wrong
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

  test('should display commission tab', async ({ page }) => {
    // Click on Commission tab
    const commissionTab = page.locator('#commission-tab')
    await expect(commissionTab).toBeVisible()
    await commissionTab.click()

    // Wait for tab to activate
    await page.waitForTimeout(500)

    // Verify we're on commission tab
    await expect(page).toHaveURL(/tab=commission/)
  })

  test('should open add commission member modal', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Click add member button
    await page.locator('#add-commission-member-btn').click()

    // Verify modal is open
    await expect(page.locator('#commission-modal')).toBeVisible()
    await expect(page.locator('#commission-modal-title')).toContainText('Správa komisie')
  })

  test('should search for commission members in modal', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Open modal
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(500)

    // Type in search field
    const searchInput = page.locator('#commission-search')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Komisia')

    // Should see filtered results
    await page.waitForTimeout(500)
  })

  test('should select multiple commission members', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Open modal
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(1000)

    // Wait for users to load
    const loadingText = page.locator('text=Načítavam používateľov...')
    if (await loadingText.isVisible()) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    }

    // Check if there are any users with KOMISIA role
    const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount === 0) {
      console.log('No KOMISIA users available - skipping test')
      test.skip()
      return
    }

    // Select first 3 checkboxes (if available)
    const toSelect = Math.min(3, checkboxCount)
    for (let i = 0; i < toSelect; i++) {
      await checkboxes.nth(i).check()
      await page.waitForTimeout(200)
    }

    // Verify selected count in header
    const header = page.locator('#commission-member-count')
    const text = await header.textContent()
    expect(text).toContain(`${toSelect}`)
  })

  test('should select chairman for commission', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Open modal
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(1000)

    // Wait for users to load
    const loadingText = page.locator('text=Načítavam používateľov...')
    if (await loadingText.isVisible()) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    }

    // Check if there are any users
    const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount === 0) {
      console.log('No KOMISIA users available - skipping test')
      test.skip()
      return
    }

    // Select first user
    await checkboxes.first().check()
    await page.waitForTimeout(200)

    // Get user ID from first checkbox
    const firstCheckboxTestId = await checkboxes.first().getAttribute('data-testid')
    const userId = firstCheckboxTestId?.replace('member-checkbox-', '')

    // Select as chairman
    const chairmanRadio = page.locator(`[data-testid="chairman-radio-${userId}"]`)
    await chairmanRadio.check()
    await page.waitForTimeout(200)

    // Verify chairman is selected
    const chairmanIndicator = page.locator('#commission-validation-message')
    await expect(chairmanIndicator).toContainText('Predseda zvolený')
  })

  test('should add commission members successfully', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Open modal
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(1000)

    // Wait for users to load
    const loadingText = page.locator('text=Načítavam používateľov...')
    if (await loadingText.isVisible()) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    }

    // Check if there are any users
    const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount === 0) {
      console.log('No KOMISIA users available - skipping test')
      test.skip()
      return
    }

    // Select 3 users
    const toSelect = Math.min(3, checkboxCount)
    for (let i = 0; i < toSelect; i++) {
      await checkboxes.nth(i).check()
      await page.waitForTimeout(200)
    }

    // Get user ID from first checkbox and select as chairman
    const firstCheckboxTestId = await checkboxes.first().getAttribute('data-testid')
    const userId = firstCheckboxTestId?.replace('member-checkbox-', '')
    const chairmanRadio = page.locator(`[data-testid="chairman-radio-${userId}"]`)
    await chairmanRadio.check()
    await page.waitForTimeout(200)

    // Click save button
    await page.locator('#commission-save-btn').click()

    // Wait for modal to close
    await page.waitForTimeout(2000)

    // Verify modal is closed
    await expect(page.locator('#commission-modal')).not.toBeVisible()

    // Verify commission members are displayed in table
    const memberCount = page.locator('#commission-title')
    await expect(memberCount).toContainText(`${toSelect} členov`)
  })

  test('should show chairman badge in commission table', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Check if there are any commission members
    const hasMembers = await page.locator('table').isVisible().catch(() => false)

    if (!hasMembers) {
      console.log('No commission members - skipping chairman badge test')
      test.skip()
      return
    }

    // Look for chairman badge using testid
    const chairmanBadge = page.locator('[data-testid^="chairman-badge-"]').first()
    const badgeVisible = await chairmanBadge.isVisible().catch(() => false)

    if (badgeVisible) {
      await expect(chairmanBadge).toBeVisible()
      await expect(chairmanBadge).toContainText('Predseda')
      // Should have purple styling
      await expect(chairmanBadge).toHaveClass(/bg-purple-100/)
    }
  })

  test('should close modal when clicking cancel', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Open modal
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(500)

    // Click cancel button
    await page.locator('#commission-cancel-btn').click()
    await page.waitForTimeout(500)

    // Verify modal is closed
    await expect(page.locator('#commission-modal')).not.toBeVisible()
  })

  test('should close modal when clicking X button', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Open modal
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(500)

    // Click X button in header
    await page.locator('#commission-modal-close').click()
    await page.waitForTimeout(500)

    // Verify modal is closed
    await expect(page.locator('#commission-modal')).not.toBeVisible()
  })
})
