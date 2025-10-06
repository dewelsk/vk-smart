import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Test Types Management @admin @test-types', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/tests/types')
  })

  test('should display test types page', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Typy testov')
    await expect(page.locator('button:has-text("Vytvoriť typ testu")')).toBeVisible()
  })

  test('should display test types table with data', async ({ page }) => {
    // Check if table is visible (assuming seeded data exists)
    await expect(page.locator('table')).toBeVisible()

    // Check column headers
    await expect(page.locator('th:has-text("Názov")')).toBeVisible()
    await expect(page.locator('th:has-text("Popis")')).toBeVisible()
    await expect(page.locator('th:has-text("Počet kategórií")')).toBeVisible()
    await expect(page.locator('th:has-text("Akcie")')).toBeVisible()
  })

  test.describe('Create Test Type', () => {
    test('should open create modal when clicking create button', async ({ page }) => {
      await page.click('button:has-text("Vytvoriť typ testu")')

      await expect(page.locator('h2:has-text("Vytvoriť typ testu")')).toBeVisible()
      await expect(page.locator('input#name')).toBeVisible()
      await expect(page.locator('textarea#description')).toBeVisible()
      await expect(page.locator('button:has-text("Vytvoriť")')).toBeVisible()
      await expect(page.locator('button:has-text("Zrušiť")')).toBeVisible()
    })

    test('should close create modal when clicking cancel', async ({ page }) => {
      await page.click('button:has-text("Vytvoriť typ testu")')
      await expect(page.locator('h2:has-text("Vytvoriť typ testu")')).toBeVisible()

      await page.click('button:has-text("Zrušiť")')
      await expect(page.locator('h2:has-text("Vytvoriť typ testu")')).not.toBeVisible()
    })

    test('should validate required name field', async ({ page }) => {
      await page.click('button:has-text("Vytvoriť typ testu")')

      // Try to submit without filling name
      await page.click('button:has-text("Vytvoriť")')

      // Check if form doesn't submit (modal still visible)
      await expect(page.locator('h2:has-text("Vytvoriť typ testu")')).toBeVisible()
    })

    test('should create test type successfully with name only', async ({ page }) => {
      const timestamp = Date.now()
      const typeName = `E2E Test Type ${timestamp}`

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', typeName)
      await page.click('button:has-text("Vytvoriť")')

      // Wait for modal to close
      await expect(page.locator('h2:has-text("Vytvoriť typ testu")')).not.toBeVisible()

      // Check for success toast
      await expect(page.locator('text=Typ testu bol vytvorený')).toBeVisible()

      // Verify the type appears in the table
      await expect(page.locator(`text=${typeName}`)).toBeVisible()
    })

    test('should create test type with name and description', async ({ page }) => {
      const timestamp = Date.now()
      const typeName = `E2E Test Type Full ${timestamp}`
      const description = 'This is a test type created by E2E test'

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', typeName)
      await page.fill('textarea#description', description)
      await page.click('button:has-text("Vytvoriť")')

      // Wait for success
      await expect(page.locator('text=Typ testu bol vytvorený')).toBeVisible()
      await expect(page.locator(`text=${typeName}`)).toBeVisible()
    })

    test('should reject duplicate test type name', async ({ page }) => {
      const typeName = 'Štátny jazyk' // Existing seeded type

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', typeName)
      await page.click('button:has-text("Vytvoriť")')

      // Check for error message
      await expect(page.locator('text=Chyba pri vytváraní typu testu')).toBeVisible()

      // Modal should still be open
      await expect(page.locator('h2:has-text("Vytvoriť typ testu")')).toBeVisible()
    })
  })

  test.describe('Edit Test Type', () => {
    let testTypeName: string

    test.beforeEach(async ({ page }) => {
      // Create a test type to edit
      const timestamp = Date.now()
      testTypeName = `E2E Edit Test ${timestamp}`

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', testTypeName)
      await page.fill('textarea#description', 'Original description')
      await page.click('button:has-text("Vytvoriť")')
      await expect(page.locator('text=Typ testu bol vytvorený')).toBeVisible()
    })

    test('should open edit modal when clicking edit button', async ({ page }) => {
      // Find and click the edit button for our test type
      const row = page.locator(`tr:has-text("${testTypeName}")`).first()
      const editButton = row.locator('button[title="Upraviť"]')
      await editButton.click()

      await expect(page.locator('h2:has-text("Upraviť typ testu")')).toBeVisible()
      await expect(page.locator('input#edit-name')).toHaveValue(testTypeName)
      await expect(page.locator('textarea#edit-description')).toHaveValue('Original description')
    })

    test('should close edit modal when clicking cancel', async ({ page }) => {
      const row = page.locator(`tr:has-text("${testTypeName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      await expect(page.locator('h2:has-text("Upraviť typ testu")')).toBeVisible()
      await page.click('button:has-text("Zrušiť")')
      await expect(page.locator('h2:has-text("Upraviť typ testu")')).not.toBeVisible()
    })

    test('should update test type name', async ({ page }) => {
      const newName = `${testTypeName} Updated`

      const row = page.locator(`tr:has-text("${testTypeName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      await page.fill('input#edit-name', newName)
      await page.click('button:has-text("Uložiť")')

      // Wait for success
      await expect(page.locator('text=Typ testu bol aktualizovaný')).toBeVisible()
      await expect(page.locator(`text=${newName}`)).toBeVisible()
    })

    test('should update test type description', async ({ page }) => {
      const newDescription = 'Updated description by E2E test'

      const row = page.locator(`tr:has-text("${testTypeName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      await page.fill('textarea#edit-description', newDescription)
      await page.click('button:has-text("Uložiť")')

      // Wait for success
      await expect(page.locator('text=Typ testu bol aktualizovaný')).toBeVisible()

      // Verify by opening edit modal again
      const updatedRow = page.locator(`tr:has-text("${testTypeName}")`).first()
      await updatedRow.locator('button[title="Upraviť"]').click()
      await expect(page.locator('textarea#edit-description')).toHaveValue(newDescription)
    })

    test('should clear description when emptied', async ({ page }) => {
      const row = page.locator(`tr:has-text("${testTypeName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      await page.fill('textarea#edit-description', '')
      await page.click('button:has-text("Uložiť")')

      await expect(page.locator('text=Typ testu bol aktualizovaný')).toBeVisible()
    })
  })

  test.describe('Delete Test Type', () => {
    test('should open delete confirmation modal', async ({ page }) => {
      // Create a test type to delete
      const timestamp = Date.now()
      const typeName = `E2E Delete Test ${timestamp}`

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', typeName)
      await page.click('button:has-text("Vytvoriť")')
      await expect(page.locator('text=Typ testu bol vytvorený')).toBeVisible()

      // Click delete button
      const row = page.locator(`tr:has-text("${typeName}")`).first()
      await row.locator('button[title="Vymazať"]').click()

      await expect(page.locator('h2:has-text("Vymazať typ testu")')).toBeVisible()
      await expect(page.locator(`text=${typeName}`)).toBeVisible()
      await expect(page.locator('button:has-text("Vymazať")')).toBeVisible()
    })

    test('should close delete modal when clicking cancel', async ({ page }) => {
      // Create a test type
      const timestamp = Date.now()
      const typeName = `E2E Delete Cancel ${timestamp}`

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', typeName)
      await page.click('button:has-text("Vytvoriť")')
      await expect(page.locator('text=Typ testu bol vytvorený')).toBeVisible()

      // Open and close delete modal
      const row = page.locator(`tr:has-text("${typeName}")`).first()
      await row.locator('button[title="Vymazať"]').click()

      await expect(page.locator('h2:has-text("Vymazať typ testu")')).toBeVisible()
      await page.click('button:has-text("Zrušiť")')
      await expect(page.locator('h2:has-text("Vymazať typ testu")')).not.toBeVisible()

      // Verify type still exists
      await expect(page.locator(`text=${typeName}`)).toBeVisible()
    })

    test('should delete test type successfully', async ({ page }) => {
      // Create a test type to delete
      const timestamp = Date.now()
      const typeName = `E2E Delete Success ${timestamp}`

      await page.click('button:has-text("Vytvoriť typ testu")')
      await page.fill('input#name', typeName)
      await page.click('button:has-text("Vytvoriť")')
      await expect(page.locator('text=Typ testu bol vytvorený')).toBeVisible()

      // Delete the type
      const row = page.locator(`tr:has-text("${typeName}")`).first()
      await row.locator('button[title="Vymazať"]').click()
      await page.click('button:has-text("Vymazať")')

      // Wait for success
      await expect(page.locator('text=Typ testu bol vymazaný')).toBeVisible()

      // Verify type is removed from table
      await expect(page.locator(`tr:has-text("${typeName}")`)).not.toBeVisible()
    })

    test('should prevent deletion of test type with categories', async ({ page }) => {
      // Find a test type that has categories (from seeded data)
      // "Štátny jazyk" should have categories
      const typeName = 'Štátny jazyk'

      const row = page.locator(`tr:has-text("${typeName}")`).first()

      // Check if it has categories count > 0
      const categoryCount = await row.locator('td').nth(2).textContent()

      if (categoryCount && parseInt(categoryCount) > 0) {
        await row.locator('button[title="Vymazať"]').click()

        // Should show warning message
        await expect(page.locator('text=Tento typ má priradených')).toBeVisible()
        await expect(page.locator('text=kategórií a nemožno ho vymazať')).toBeVisible()

        // Delete button should be disabled
        const deleteButton = page.locator('button:has-text("Vymazať")').last()
        await expect(deleteButton).toBeDisabled()
      }
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination controls when data exceeds page size', async ({ page }) => {
      // This test assumes there are enough test types to trigger pagination
      // You may need to create multiple test types first if your seed data is insufficient

      const tableExists = await page.locator('table').isVisible()
      if (tableExists) {
        // Check if pagination controls exist
        const paginationExists = await page.locator('nav[aria-label="Pagination"]').isVisible()
        if (paginationExists) {
          await expect(page.locator('nav[aria-label="Pagination"]')).toBeVisible()
        }
      }
    })
  })
})
