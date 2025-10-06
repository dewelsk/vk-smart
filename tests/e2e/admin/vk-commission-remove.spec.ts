import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Commission - Remove Member @admin @vk @commission', () => {
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

  test('should remove commission member successfully', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Check if there are any commission members
    const hasMembers = await page.locator('table').isVisible().catch(() => false)

    if (!hasMembers) {
      console.log('No commission members - adding members first')

      // Add members first
      await page.locator('#add-commission-member-btn').click()
      await page.waitForTimeout(1000)

      // Wait for users to load
      const loadingText = page.locator('text=Načítavam používateľov...')
      if (await loadingText.isVisible()) {
        await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
      }

      // Select first 3 users
      const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
      const checkboxCount = await checkboxes.count()

      if (checkboxCount === 0) {
        console.log('No KOMISIA users available - skipping test')
        test.skip()
        return
      }

      const toSelect = Math.min(3, checkboxCount)
      for (let i = 0; i < toSelect; i++) {
        await checkboxes.nth(i).check()
        await page.waitForTimeout(200)
      }

      // Select chairman
      const firstCheckboxTestId = await checkboxes.first().getAttribute('data-testid')
      const userId = firstCheckboxTestId?.replace('member-checkbox-', '')
      const chairmanRadio = page.locator(`[data-testid="chairman-radio-${userId}"]`)
      await chairmanRadio.check()
      await page.waitForTimeout(200)

      // Save
      await page.locator('#commission-save-btn').click()
      await page.waitForTimeout(2000)
    }

    // Get initial member count
    const memberCountText = await page.locator('#commission-title').textContent()
    const initialCount = parseInt(memberCountText?.match(/\d+/)?.[0] || '0')

    console.log(`Initial member count: ${initialCount}`)

    if (initialCount === 0) {
      console.log('No members to remove - skipping test')
      test.skip()
      return
    }

    // Find first "Odstrániť" button in table
    const removeButton = page.locator('button:has-text("Odstrániť")').first()
    await expect(removeButton).toBeVisible()

    // Click remove button
    await removeButton.click()
    await page.waitForTimeout(500)

    // Verify ConfirmModal appears
    const confirmModal = page.locator('text=Odstrániť člena komisie')
    await expect(confirmModal).toBeVisible()

    // Verify modal message
    await expect(page.locator('text=Naozaj chcete odstrániť tohto člena z komisie?')).toBeVisible()

    // Click confirm button in modal
    const confirmButton = page.locator('button:has-text("Odstrániť")').last()
    await confirmButton.click()

    // Wait for API call and refresh
    await page.waitForTimeout(2000)

    // Verify member was removed - count should decrease
    const newMemberCountText = await page.locator('#commission-title').textContent()
    const newCount = parseInt(newMemberCountText?.match(/\d+/)?.[0] || '0')

    console.log(`New member count: ${newCount}`)

    expect(newCount).toBe(initialCount - 1)

    // Verify success toast
    await expect(page.locator('text=Člen komisie bol úspešne odstránený')).toBeVisible({ timeout: 3000 })
  })

  test('should cancel member removal when clicking Zrušiť', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Check if there are members
    const hasMembers = await page.locator('table').isVisible().catch(() => false)

    if (!hasMembers) {
      console.log('No commission members - skipping test')
      test.skip()
      return
    }

    // Get initial count
    const memberCountText = await page.locator('#commission-title').textContent()
    const initialCount = parseInt(memberCountText?.match(/\d+/)?.[0] || '0')

    // Click remove button
    const removeButton = page.locator('button:has-text("Odstrániť")').first()
    await removeButton.click()
    await page.waitForTimeout(500)

    // Verify modal appears
    await expect(page.locator('text=Odstrániť člena komisie')).toBeVisible()

    // Click cancel
    const cancelButton = page.locator('button:has-text("Zrušiť")').last()
    await cancelButton.click()
    await page.waitForTimeout(500)

    // Verify modal is closed
    await expect(page.locator('text=Odstrániť člena komisie')).not.toBeVisible()

    // Verify count didn't change
    const newMemberCountText = await page.locator('#commission-title').textContent()
    const newCount = parseInt(newMemberCountText?.match(/\d+/)?.[0] || '0')

    expect(newCount).toBe(initialCount)
  })

  test('should show remove button for each member', async ({ page }) => {
    // Go to Commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)

    // Check if there are members
    const hasMembers = await page.locator('table').isVisible().catch(() => false)

    if (!hasMembers) {
      console.log('No commission members - skipping test')
      test.skip()
      return
    }

    // Count members
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    // Each row should have a remove button
    for (let i = 0; i < rowCount; i++) {
      const removeButton = rows.nth(i).locator('button:has-text("Odstrániť")')
      await expect(removeButton).toBeVisible()
    }
  })
})
