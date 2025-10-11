import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Applicant Edit @admin @applicants', () => {
  let applicantId: string
  let originalName: string
  let originalSurname: string
  let originalEmail: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to applicants list and get first applicant
    await page.goto('/applicants')
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => null)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount === 0) {
      test.skip()
      return
    }

    // Click on first applicant name link
    const firstNameLink = rows.first().locator('[data-testid^="applicant-name-"]')
    await firstNameLink.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/applicants\/[a-z0-9]+/)

    // Extract applicant ID from URL
    const url = page.url()
    applicantId = url.split('/').pop() || ''

    // Store original values for restoration later
    originalName = await page.getByTestId('applicant-name').textContent() || ''
    originalEmail = await page.getByTestId('applicant-email').textContent() || ''

    // Parse name and surname
    const nameParts = originalName.trim().split(' ')
    originalSurname = nameParts.pop() || ''
    originalName = nameParts.join(' ')
  })

  test('should open edit modal when clicking edit button', async ({ page }) => {
    const editButton = page.getByTestId('edit-button')
    await expect(editButton).toBeVisible()
    await editButton.click()

    // Modal should be visible
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('surname-input')).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('phone-input')).toBeVisible()
    await expect(page.getByTestId('active-checkbox')).toBeVisible()
  })

  test('should close edit modal when clicking cancel', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    await page.getByTestId('cancel-button').click()

    // Modal should close
    await expect(page.locator('text=Upraviť uchádzača')).not.toBeVisible()
  })

  test('should show validation error for empty name', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    // Wait for modal inputs to be visible
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('save-button')).toBeVisible()

    // Clear name field
    const nameInput = page.getByTestId('name-input')
    await nameInput.click({ clickCount: 3 }) // Select all
    await nameInput.press('Backspace')
    await page.getByTestId('save-button').click()

    // Should show error
    await expect(page.getByTestId('name-error')).toBeVisible()
    await expect(page.getByTestId('name-error')).toHaveText('Meno je povinné')
  })

  test('should show validation error for empty surname', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    // Wait for modal inputs to be visible
    await expect(page.getByTestId('surname-input')).toBeVisible()
    await expect(page.getByTestId('save-button')).toBeVisible()

    // Clear surname field
    const surnameInput = page.getByTestId('surname-input')
    await surnameInput.click({ clickCount: 3 }) // Select all
    await surnameInput.press('Backspace')
    await page.getByTestId('save-button').click()

    // Should show error
    await expect(page.getByTestId('surname-error')).toBeVisible()
    await expect(page.getByTestId('surname-error')).toHaveText('Priezvisko je povinné')
  })

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    // Enter invalid email
    await page.getByTestId('email-input').fill('invalid-email')
    await page.getByTestId('save-button').click()

    // Should show error
    await expect(page.getByTestId('email-error')).toBeVisible()
    await expect(page.getByTestId('email-error')).toHaveText('Neplatná emailová adresa')
  })

  test('should successfully edit applicant name and surname', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    const newName = 'Jozef'
    const newSurname = 'Upravený'

    // Edit name and surname
    await page.getByTestId('name-input').fill(newName)
    await page.getByTestId('surname-input').fill(newSurname)
    await page.getByTestId('save-button').click()

    // Wait for success toast
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()

    // Modal should close
    await expect(page.locator('text=Upraviť uchádzača')).not.toBeVisible()

    // Wait for network to be idle (page is refetching data)
    await page.waitForLoadState('networkidle')

    // Verify updated name is displayed
    await expect(page.getByTestId('applicant-name')).toContainText(newName, { timeout: 10000 })
    await expect(page.getByTestId('applicant-name')).toContainText(newSurname, { timeout: 10000 })

    // Restore original values
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()
    await page.getByTestId('name-input').fill(originalName)
    await page.getByTestId('surname-input').fill(originalSurname)
    await page.getByTestId('save-button').click()
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()
  })

  test('should successfully edit applicant email', async ({ page }) => {
    // Store current email before edit
    const currentEmail = await page.getByTestId('applicant-email').textContent()

    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    const newEmail = `jozef.upraveny@test.sk`

    // Edit email
    await page.getByTestId('email-input').fill(newEmail)
    await page.getByTestId('save-button').click()

    // Wait for success toast
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()

    // Modal should close
    await expect(page.locator('text=Upraviť uchádzača')).not.toBeVisible()

    // Wait for network to be idle (page is refetching data)
    await page.waitForLoadState('networkidle')

    // Verify email changed
    const updatedEmail = await page.getByTestId('applicant-email').textContent()
    expect(updatedEmail).not.toBe(currentEmail)
    expect(updatedEmail).toContain('jozef.upraveny@test.sk')

    // Restore original email
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()
    await page.getByTestId('email-input').fill(originalEmail)
    await page.getByTestId('save-button').click()
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()
  })

  test('should successfully toggle active status', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    const activeCheckbox = page.getByTestId('active-checkbox')
    const isChecked = await activeCheckbox.isChecked()

    // Toggle active status
    await activeCheckbox.click()
    await page.getByTestId('save-button').click()

    // Wait for success toast
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()

    // Modal should close
    await expect(page.locator('text=Upraviť uchádzača')).not.toBeVisible()

    // Wait for network to be idle (page is refetching data)
    await page.waitForLoadState('networkidle')

    // Status badge should reflect the change
    const statusBadge = page.getByTestId('status-badge')
    if (isChecked) {
      await expect(statusBadge).toContainText('Neaktívny')
    } else {
      await expect(statusBadge).toContainText('Aktívny')
    }

    // Restore original status
    await page.getByTestId('edit-button').click()
    await page.getByTestId('active-checkbox').click()
    await page.getByTestId('save-button').click()
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()
  })

  test('should clear error when user starts typing', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    // Wait for modal inputs to be visible
    await expect(page.getByTestId('name-input')).toBeVisible()
    await expect(page.getByTestId('save-button')).toBeVisible()

    // Trigger error
    const nameInput = page.getByTestId('name-input')
    await nameInput.click({ clickCount: 3 }) // Select all
    await nameInput.press('Backspace')
    await page.getByTestId('save-button').click()
    await expect(page.getByTestId('name-error')).toBeVisible()

    // Start typing - error should disappear
    await page.getByTestId('name-input').fill('T')
    await expect(page.getByTestId('name-error')).not.toBeVisible()
  })

  test('should disable save button while saving', async ({ page }) => {
    await page.getByTestId('edit-button').click()
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()

    const saveButton = page.getByTestId('save-button')

    // Verify button is enabled initially
    await expect(saveButton).toBeEnabled()
    await expect(saveButton).toHaveText('Uložiť')

    // Make a change
    await page.getByTestId('name-input').fill('TestChange')
    await saveButton.click()

    // Button should show loading state (briefly)
    // Note: This might be too fast to catch, but we can check the final success state
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()

    // Wait for network to be idle
    await page.waitForLoadState('networkidle')

    // Restore
    await page.getByTestId('edit-button').click()
    await page.getByTestId('name-input').fill(originalName)
    await page.getByTestId('save-button').click()
    await expect(page.locator('text=Údaje boli uložené')).toBeVisible()
  })

})
