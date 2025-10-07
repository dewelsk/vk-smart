import { test, expect } from '@playwright/test'
import { loginAsSuperadmin, loginAsAdmin } from '../../helpers/auth'

test.describe('Institution Detail Page @admin @institutions-detail', () => {
  let testInstitutionId: string

  test.beforeAll(async ({ browser }) => {
    // Get first institution ID for testing
    const page = await browser.newPage()
    await loginAsSuperadmin(page)
    await page.goto('/institutions')
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    const firstLink = page.locator('[data-testid^="institution-link-"]').first()
    const href = await firstLink.getAttribute('href')
    testInstitutionId = href?.split('/').pop() || ''

    await page.close()
  })

  test.describe('SUPERADMIN', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should display institution detail page', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('institution-name-input')).toBeVisible()
      await expect(page.getByTestId('institution-code-input')).toBeVisible()
      await expect(page.getByTestId('institution-description-input')).toBeVisible()
      await expect(page.getByTestId('institution-active-checkbox')).toBeVisible()
    })

    test('should display question types checkboxes', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('question-types-group')).toBeVisible()

      // Check all 4 question type checkboxes exist
      await expect(page.getByTestId('question-type-single_choice')).toBeVisible()
      await expect(page.getByTestId('question-type-multiple_choice')).toBeVisible()
      await expect(page.getByTestId('question-type-true_false')).toBeVisible()
      await expect(page.getByTestId('question-type-open_ended')).toBeVisible()
    })

    test('should update institution basic info', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Get original name
      const nameInput = page.getByTestId('institution-name-input')
      const originalName = await nameInput.inputValue()

      // Update description
      const descriptionInput = page.getByTestId('institution-description-input')
      const timestamp = Date.now()
      const newDescription = `E2E Test Description ${timestamp}`
      await descriptionInput.fill(newDescription)

      // Save
      await page.getByTestId('save-button').click()

      // Wait for success toast
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify description was saved
      await page.reload()
      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(descriptionInput).toHaveValue(newDescription)
    })

    test('should update allowed question types - add types', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Uncheck all except SINGLE_CHOICE first by clicking
      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')
      const openEnded = page.getByTestId('question-type-open_ended')

      // Click to uncheck if checked (instead of .uncheck())
      if (await multipleChoice.isChecked()) {
        await multipleChoice.click()
        await page.waitForTimeout(100)
      }
      if (await trueFalse.isChecked()) {
        await trueFalse.click()
        await page.waitForTimeout(100)
      }
      if (await openEnded.isChecked()) {
        await openEnded.click()
        await page.waitForTimeout(100)
      }

      // Save with only SINGLE_CHOICE
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Now add TRUE_FALSE and OPEN_ENDED by clicking unchecked checkboxes
      await page.waitForTimeout(500)
      await trueFalse.click()
      await page.waitForTimeout(100)
      await openEnded.click()
      await page.waitForTimeout(500)

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Reload and verify
      await page.reload()
      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      await expect(page.getByTestId('question-type-single_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-multiple_choice')).not.toBeChecked()
      await expect(page.getByTestId('question-type-true_false')).toBeChecked()
      await expect(page.getByTestId('question-type-open_ended')).toBeChecked()
    })

    test('should update allowed question types - remove types', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Check all types first
      const singleChoice = page.getByTestId('question-type-single_choice')
      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')
      const openEnded = page.getByTestId('question-type-open_ended')

      // Click to check all if not already checked
      if (!(await singleChoice.isChecked())) await singleChoice.click()
      await page.waitForTimeout(100)
      if (!(await multipleChoice.isChecked())) await multipleChoice.click()
      await page.waitForTimeout(100)
      if (!(await trueFalse.isChecked())) await trueFalse.click()
      await page.waitForTimeout(100)
      if (!(await openEnded.isChecked())) await openEnded.click()
      await page.waitForTimeout(500)

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Wait for toast to disappear and form to be ready
      await page.waitForTimeout(2000)

      // Now uncheck some by clicking on checked checkboxes
      // Click to uncheck (instead of .uncheck())
      await multipleChoice.click({ force: true })
      await page.waitForTimeout(200)
      await openEnded.click({ force: true })
      await page.waitForTimeout(1000)

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Reload and verify
      await page.reload()
      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      await expect(singleChoice).toBeChecked()
      await expect(multipleChoice).not.toBeChecked()
      await expect(trueFalse).toBeChecked()
      await expect(openEnded).not.toBeChecked()
    })

    test('should not allow unchecking last question type', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Set to only SINGLE_CHOICE
      const singleChoice = page.getByTestId('question-type-single_choice')
      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')
      const openEnded = page.getByTestId('question-type-open_ended')

      // Click to check single_choice if not checked
      if (!(await singleChoice.isChecked())) {
        await singleChoice.click()
        await page.waitForTimeout(100)
      }
      // Click to uncheck others if checked
      if (await multipleChoice.isChecked()) {
        await multipleChoice.click()
        await page.waitForTimeout(100)
      }
      if (await trueFalse.isChecked()) {
        await trueFalse.click()
        await page.waitForTimeout(100)
      }
      if (await openEnded.isChecked()) {
        await openEnded.click()
        await page.waitForTimeout(100)
      }

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Try to uncheck the last one - should be disabled or not uncheck
      await page.waitForTimeout(500)
      const isDisabled = await singleChoice.isDisabled()

      if (!isDisabled) {
        // Try to uncheck
        await singleChoice.click()
        // Should still be checked
        await expect(singleChoice).toBeChecked()
      }
    })

    test('should validate required name field', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Clear name
      const nameInput = page.getByTestId('institution-name-input')
      await nameInput.fill('')

      // Try to save
      await page.getByTestId('save-button').click()

      // Should show error
      await expect(page.getByTestId('institution-name-error')).toBeVisible()
      await expect(page.getByTestId('institution-name-error')).toHaveText('Názov je povinný')

      // Input should have red border
      await expect(nameInput).toHaveAttribute('data-error', 'true')
    })

    test('should validate required code field', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Clear code
      const codeInput = page.getByTestId('institution-code-input')
      await codeInput.fill('')

      // Try to save
      await page.getByTestId('save-button').click()

      // Should show error
      await expect(page.getByTestId('institution-code-error')).toBeVisible()
      await expect(page.getByTestId('institution-code-error')).toHaveText('Kód je povinný')

      // Input should have red border
      await expect(codeInput).toHaveAttribute('data-error', 'true')
    })

    test('should clear error when user types in name field', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Clear name and trigger error
      const nameInput = page.getByTestId('institution-name-input')
      await nameInput.fill('')
      await page.getByTestId('save-button').click()
      await expect(page.getByTestId('institution-name-error')).toBeVisible()

      // Type in field
      await nameInput.fill('New Name')

      // Error should disappear
      await expect(page.getByTestId('institution-name-error')).not.toBeVisible()
    })

    test('should have back to list link', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      const backLink = page.getByTestId('back-to-list-link')
      await expect(backLink).toBeVisible()
      await expect(backLink).toHaveAttribute('href', '/institutions')
    })

    test('should navigate to list when clicking back link', async ({ page }) => {
      await page.goto(`/institutions/${testInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Click back link
      await page.getByTestId('back-to-list-link').click()

      // Should navigate to list
      await page.waitForURL('/institutions')
      await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('ADMIN - Own Institution', () => {
    let adminInstitutionId: string

    test.beforeAll(async ({ browser }) => {
      // Get ADMIN's institution ID
      const page = await browser.newPage()
      await loginAsAdmin(page)
      await page.goto('/institutions')
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // ADMIN should see their own institution(s)
      const firstLink = page.locator('[data-testid^="institution-link-"]').first()
      const href = await firstLink.getAttribute('href')
      adminInstitutionId = href?.split('/').pop() || ''

      await page.close()
    })

    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
    })

    test('should allow ADMIN to view their own institution', async ({ page }) => {
      await page.goto(`/institutions/${adminInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('institution-name-input')).toBeVisible()
      await expect(page.getByTestId('question-types-group')).toBeVisible()
    })

    test('should allow ADMIN to edit their own institution', async ({ page }) => {
      await page.goto(`/institutions/${adminInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Update description
      const descriptionInput = page.getByTestId('institution-description-input')
      const timestamp = Date.now()
      const newDescription = `ADMIN E2E Test ${timestamp}`
      await descriptionInput.fill(newDescription)

      // Save
      await page.getByTestId('save-button').click()

      // Wait for success toast
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify description was saved
      await page.reload()
      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(descriptionInput).toHaveValue(newDescription)
    })

    test('should allow ADMIN to change question types in their institution', async ({ page }) => {
      await page.goto(`/institutions/${adminInstitutionId}`)

      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Add TRUE_FALSE if not checked
      const trueFalse = page.getByTestId('question-type-true_false')
      if (!(await trueFalse.isChecked())) {
        await trueFalse.click()

        // Save
        await page.getByTestId('save-button').click()
        await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

        // Reload and verify
        await page.reload()
        await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
        await expect(trueFalse).toBeChecked()
      }
    })

    test('should prevent ADMIN from accessing other institutions', async ({ page }) => {
      // Try to access the SUPERADMIN test institution (different from ADMIN's)
      if (testInstitutionId !== adminInstitutionId) {
        await page.goto(`/institutions/${testInstitutionId}`)

        // Should either show error page or redirect
        await page.waitForTimeout(2000)

        // Check if we're on error page or got redirected
        const isErrorPage = await page.getByTestId('institution-detail-error').isVisible().catch(() => false)
        const isNotFound = await page.getByTestId('institution-not-found').isVisible().catch(() => false)
        const isStillOnUrl = page.url().includes(testInstitutionId)

        // Either we see an error, or we got redirected away
        expect(isErrorPage || isNotFound || !isStillOnUrl).toBeTruthy()
      }
    })
  })

  test.describe('List Display - Question Types', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should display question types in institutions list', async ({ page }) => {
      await page.goto('/institutions')

      await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

      const hasTable = await page.getByTestId('institutions-table').isVisible().catch(() => false)

      if (hasTable) {
        // Check if table has "Povolené typy" column header
        const table = page.locator('table')
        await expect(table.locator('th:has-text("Povolené typy")')).toBeVisible()

        // Check if at least one institution shows question types
        // (Could be single type name or "[X typy ⓘ]")
        const rows = page.locator('table tbody tr')
        const rowCount = await rows.count()

        if (rowCount > 0) {
          // At least one row should have question type info
          const firstRow = rows.first()
          const hasTypeText = await firstRow.locator('text=/Jednovýberová|Viacvýberová|Pravda\\/Nepravda|Otvorená|typy/').isVisible().catch(() => false)
          expect(hasTypeText).toBeTruthy()
        }
      }
    })

    test('should display tooltip for multiple types', async ({ page }) => {
      // First, set an institution to have multiple types
      await page.goto(`/institutions/${testInstitutionId}`)
      await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })

      // Check multiple types
      // Click to check if not checked
      const sc = page.getByTestId('question-type-single_choice')
      const mc = page.getByTestId('question-type-multiple_choice')
      const tf = page.getByTestId('question-type-true_false')

      if (!(await sc.isChecked())) await sc.click()
      await page.waitForTimeout(100)
      if (!(await mc.isChecked())) await mc.click()
      await page.waitForTimeout(100)
      if (!(await tf.isChecked())) await tf.click()
      await page.waitForTimeout(500)

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Inštitúcia bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Go to list
      await page.goto('/institutions')
      await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

      // Should show "[3 typy ⓘ]" for this institution
      const multipleTypesDisplay = page.getByTestId('question-types-multiple').first()
      if (await multipleTypesDisplay.isVisible()) {
        await expect(multipleTypesDisplay).toContainText('typy')

        // Check tooltip contains type names
        const title = await multipleTypesDisplay.getAttribute('title')
        expect(title).toContain('Jednovýberová')
      }
    })

    test('should link institution name to detail page from list', async ({ page }) => {
      await page.goto('/institutions')

      await expect(page.getByTestId('institutions-page')).toBeVisible({ timeout: 10000 })

      const hasTable = await page.getByTestId('institutions-table').isVisible().catch(() => false)

      if (hasTable) {
        // Click first institution link
        const firstLink = page.locator('[data-testid^="institution-link-"]').first()
        await expect(firstLink).toBeVisible()

        const href = await firstLink.getAttribute('href')
        await firstLink.click()

        // Should navigate to detail page
        await page.waitForURL(href!)
        await expect(page.getByTestId('institution-detail-page')).toBeVisible({ timeout: 10000 })
      }
    })
  })
})
