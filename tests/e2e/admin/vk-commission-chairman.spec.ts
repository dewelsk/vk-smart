import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Commission Chairman Toggle @admin @vk @commission', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to VK list
    await page.goto('/vk')
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 })

    // Click on first VK
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Wait for VK detail page
    await page.waitForURL(/\/vk\/[a-z0-9]+/)
    await page.waitForSelector('#vk-detail-title')

    // Go to commission tab
    await page.locator('#commission-tab').click()
    await page.waitForTimeout(500)
  })

  test('should toggle chairman status', async ({ page }) => {
    // Check if commission exists
    const hasTable = await page.locator('table').isVisible().catch(() => false)

    if (!hasTable) {
      console.log('No commission - creating one first')

      // Create commission with 3 members
      await page.locator('#add-commission-member-btn').click()
      await page.waitForTimeout(500)

      const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
      const count = await checkboxes.count()

      if (count < 3) {
        test.skip()
        return
      }

      // Select 3 members
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()
      await checkboxes.nth(2).check()

      // Set first as chairman
      const firstCheckboxTestId = await checkboxes.nth(0).getAttribute('data-testid')
      const userId = firstCheckboxTestId?.replace('member-checkbox-', '')
      await page.locator(`[data-testid="chairman-radio-${userId}"]`).check()

      // Save
      await page.locator('#commission-save-btn').click()
      await page.waitForTimeout(2000)
    }

    // Now test chairman toggle
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount < 2) {
      console.log('Need at least 2 members to test chairman toggle')
      test.skip()
      return
    }

    // Find current chairman
    const chairmanBadge = page.locator('[data-testid^="chairman-badge-"]').first()
    const hasChairman = await chairmanBadge.isVisible().catch(() => false)

    if (!hasChairman) {
      // Set first member as chairman
      const firstRow = rows.first()
      const setChairmanBtn = firstRow.locator('button:has-text("Nastaviť ako predsedu")')

      await setChairmanBtn.click()
      await page.waitForTimeout(1000)

      // Verify chairman badge appears
      await expect(chairmanBadge).toBeVisible()
    }

    // Now toggle to second member
    const secondRow = rows.nth(1)
    const setChairmanBtn = secondRow.locator('button:has-text("Nastaviť ako predsedu")')

    await setChairmanBtn.click()
    await page.waitForTimeout(1000)

    // Verify second member has chairman badge
    const secondRowBadge = secondRow.locator('[data-testid^="chairman-badge-"]')
    await expect(secondRowBadge).toBeVisible()

    // Verify first member no longer has chairman badge
    const firstRowBadge = rows.first().locator('[data-testid^="chairman-badge-"]')
    await expect(firstRowBadge).not.toBeVisible()
  })

  test('should remove chairman status with "Odobrat predsedu" button', async ({ page }) => {
    // Check if commission exists
    const hasTable = await page.locator('table').isVisible().catch(() => false)

    if (!hasTable) {
      console.log('No commission - creating one first')

      // Create commission with 2 members
      await page.locator('#add-commission-member-btn').click()
      await page.waitForTimeout(500)

      const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
      const count = await checkboxes.count()

      if (count < 2) {
        test.skip()
        return
      }

      // Select 2 members
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Set first as chairman
      const firstCheckboxTestId = await checkboxes.nth(0).getAttribute('data-testid')
      const userId = firstCheckboxTestId?.replace('member-checkbox-', '')
      await page.locator(`[data-testid="chairman-radio-${userId}"]`).check()

      // Save
      await page.locator('#commission-save-btn').click()
      await page.waitForTimeout(2000)
    }

    // Verify there is a chairman
    const chairmanBadge = page.locator('[data-testid^="chairman-badge-"]').first()
    const hasChairman = await chairmanBadge.isVisible().catch(() => false)

    if (!hasChairman) {
      console.log('No chairman - setting one first')
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('button:has-text("Nastaviť ako predsedu")').click()
      await page.waitForTimeout(1000)
    }

    // Verify chairman badge is visible
    await expect(chairmanBadge).toBeVisible()

    console.log('Chairman badge found')

    // Find and click "Odobrat predsedu" button
    const removeChairmanButton = page.locator('button:has-text("Odobrat predsedu")').first()
    await expect(removeChairmanButton).toBeVisible()

    console.log('Clicking "Odobrat predsedu" button')

    await removeChairmanButton.click()
    await page.waitForTimeout(2000)

    // Verify chairman badge is gone
    const chairmanBadgeAfter = page.locator('[data-testid^="chairman-badge-"]')
    await expect(chairmanBadgeAfter).not.toBeVisible()

    console.log('Chairman badge removed')

    // Verify success toast
    await expect(page.locator('text=Používateľ už nie je predseda')).toBeVisible({ timeout: 3000 })

    console.log('Success toast shown')
  })

  test('should show existing members as checked when opening modal', async ({ page }) => {
    // Check if commission exists
    const hasTable = await page.locator('table').isVisible().catch(() => false)

    if (!hasTable) {
      console.log('No commission - creating one first')

      // Create commission with 2 members
      await page.locator('#add-commission-member-btn').click()
      await page.waitForTimeout(500)

      const checkboxes = page.locator('[data-testid^="member-checkbox-"]')
      const count = await checkboxes.count()

      if (count < 2) {
        test.skip()
        return
      }

      // Select 2 members
      await checkboxes.nth(0).check()
      await checkboxes.nth(1).check()

      // Set first as chairman
      const firstCheckboxTestId = await checkboxes.nth(0).getAttribute('data-testid')
      const userId = firstCheckboxTestId?.replace('member-checkbox-', '')
      await page.locator(`[data-testid="chairman-radio-${userId}"]`).check()

      // Save
      await page.locator('#commission-save-btn').click()
      await page.waitForTimeout(2000)
    }

    // Get current member count
    const rows = page.locator('tbody tr')
    const memberCount = await rows.count()

    if (memberCount === 0) {
      test.skip()
      return
    }

    // Open modal again
    await page.locator('#add-commission-member-btn').click()
    await page.waitForTimeout(500)

    // Wait for users to load
    const loadingText = page.locator('text=Načítavam používateľov...')
    if (await loadingText.isVisible()) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 })
    }

    // Count checked checkboxes
    const checkedCheckboxes = page.locator('[data-testid^="member-checkbox-"]:checked')
    const checkedCount = await checkedCheckboxes.count()

    console.log(`Members in commission: ${memberCount}, Checked in modal: ${checkedCount}`)

    // Verify that checked count matches member count
    expect(checkedCount).toBe(memberCount)

    // Verify member count display
    const memberCountDisplay = page.locator('#commission-member-count')
    await expect(memberCountDisplay).toContainText(`${memberCount}`)
  })
})
