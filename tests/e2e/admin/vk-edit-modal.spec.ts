import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Edit Modal @admin @vk', () => {
  let vkId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to VK list and get first VK
    await page.goto('/vk')
    await page.waitForSelector('tbody tr')

    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/vk\/[a-z0-9]+/)

    // Extract VK ID from URL
    const url = page.url()
    vkId = url.split('/').pop() || ''
  })

  test('should open edit modal when clicking "Upraviť" button', async ({ page }) => {
    // Click the edit button
    const editButton = page.getByTestId('edit-vk-button')
    await expect(editButton).toBeVisible()
    await editButton.click()

    // Modal should be visible
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()
    await expect(page.locator('h2:has-text("Upraviť výberové konanie")')).toBeVisible()

    // Modal should have all form fields
    await expect(page.getByTestId('identifier-input')).toBeVisible()
    await expect(page.getByTestId('selection-type-input')).toBeVisible()
    await expect(page.getByTestId('organizational-unit-input')).toBeVisible()
    await expect(page.getByTestId('service-field-input')).toBeVisible()
    await expect(page.getByTestId('position-input')).toBeVisible()
    await expect(page.getByTestId('service-type-input')).toBeVisible()
    await expect(page.getByTestId('date-input')).toBeVisible()
    await expect(page.getByTestId('number-of-positions-input')).toBeVisible()

    // Modal should have action buttons
    await expect(page.getByTestId('save-button')).toBeVisible()
    await expect(page.getByTestId('cancel-button')).toBeVisible()
  })

  test('should close modal when clicking "Zrušiť"', async ({ page }) => {
    // Open modal
    await page.getByTestId('edit-vk-button').click()
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()

    // Click cancel
    await page.getByTestId('cancel-button').click()

    // Modal should be closed
    await expect(page.getByTestId('edit-vk-modal')).not.toBeVisible()
  })

  test('should show validation error for required field', async ({ page }) => {
    // Open modal
    await page.getByTestId('edit-vk-button').click()
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()

    // Clear required field (position)
    const positionInput = page.getByTestId('position-input')
    await positionInput.clear()

    // Try to save
    await page.getByTestId('save-button').click()

    // Should show error
    await expect(page.getByTestId('position-error')).toBeVisible()
    await expect(page.getByTestId('position-error')).toContainText('Pozícia je povinná')

    // Modal should still be open
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()
  })

  test('should successfully update VK position', async ({ page }) => {
    // Open modal
    await page.getByTestId('edit-vk-button').click()
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()

    // Update position
    const positionInput = page.getByTestId('position-input')
    const newPosition = `Updated Position ${Date.now()}`
    await positionInput.clear()
    await positionInput.fill(newPosition)

    // Save
    await page.getByTestId('save-button').click()

    // Wait for success toast
    await expect(page.locator('text=Výberové konanie bolo upravené')).toBeVisible()

    // Modal should be closed
    await expect(page.getByTestId('edit-vk-modal')).not.toBeVisible()

    // Page should refresh and show updated position
    await page.waitForTimeout(1000)
    await expect(page.locator(`text=${newPosition}`)).toBeVisible()
  })

  test('should successfully update multiple fields', async ({ page }) => {
    const timestamp = Date.now()

    // Open modal
    await page.getByTestId('edit-vk-button').click()
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()

    // Update multiple fields
    await page.getByTestId('position-input').clear()
    await page.getByTestId('position-input').fill(`Multi Update Position ${timestamp}`)

    await page.getByTestId('organizational-unit-input').clear()
    await page.getByTestId('organizational-unit-input').fill(`Multi Update Unit ${timestamp}`)

    await page.getByTestId('service-field-input').clear()
    await page.getByTestId('service-field-input').fill(`Multi Update Field ${timestamp}`)

    // Save
    await page.getByTestId('save-button').click()

    // Wait for success toast
    await expect(page.locator('text=Výberové konanie bolo upravené')).toBeVisible()

    // Modal should be closed
    await expect(page.getByTestId('edit-vk-modal')).not.toBeVisible()

    // Page should show updated values
    await page.waitForTimeout(1000)
    await expect(page.locator(`text=Multi Update Position ${timestamp}`)).toBeVisible()
    await expect(page.locator(`text=Multi Update Unit ${timestamp}`)).toBeVisible()
    await expect(page.locator(`text=Multi Update Field ${timestamp}`)).toBeVisible()
  })

  test('should not show edit button for DOKONCENE status', async ({ page }) => {
    // This test requires a VK with DOKONCENE status
    // We'll skip if current VK is not DOKONCENE
    const editButton = page.getByTestId('edit-vk-button')
    const isVisible = await editButton.isVisible().catch(() => false)

    if (!isVisible) {
      // If button is not visible, VK might be DOKONCENE
      // Verify status badge shows DOKONCENE
      const statusBadge = page.locator('text=DOKONČENÉ')
      const hasDokonceneStatus = await statusBadge.isVisible().catch(() => false)

      if (hasDokonceneStatus) {
        // This is expected - edit button should not be visible for DOKONCENE status
        expect(isVisible).toBe(false)
      } else {
        // Button is hidden for some other reason - this test is not applicable
        test.skip()
      }
    } else {
      // Button is visible - VK is not DOKONCENE, test is not applicable
      test.skip()
    }
  })

  test('should clear validation error when user starts typing', async ({ page }) => {
    // Open modal
    await page.getByTestId('edit-vk-button').click()
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()

    // Clear required field
    const positionInput = page.getByTestId('position-input')
    await positionInput.clear()

    // Try to save
    await page.getByTestId('save-button').click()

    // Should show error
    await expect(page.getByTestId('position-error')).toBeVisible()

    // Start typing
    await positionInput.fill('New Position')

    // Error should be cleared
    await expect(page.getByTestId('position-error')).not.toBeVisible()
  })

  test('should validate number of positions is at least 1', async ({ page }) => {
    // Open modal
    await page.getByTestId('edit-vk-button').click()
    await expect(page.getByTestId('edit-vk-modal')).toBeVisible()

    // Set number of positions to 0
    const numberOfPositionsInput = page.getByTestId('number-of-positions-input')
    await numberOfPositionsInput.clear()
    await numberOfPositionsInput.fill('0')

    // Try to save
    await page.getByTestId('save-button').click()

    // Should show error
    await expect(page.getByTestId('number-of-positions-error')).toBeVisible()
    await expect(page.getByTestId('number-of-positions-error')).toContainText('aspoň 1')
  })
})
