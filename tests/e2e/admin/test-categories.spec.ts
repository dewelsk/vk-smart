import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Test Categories Management @admin @test-categories', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/tests/categories')
  })

  test('should display test categories page', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Kategórie testov')
    await expect(page.locator('button:has-text("Pridať kategóriu")')).toBeVisible()
  })

  test('should display back link to tests page', async ({ page }) => {
    const backLink = page.locator('a:has-text("← Späť na Testy")')
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/tests')
  })

  test('should display search and filter controls', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Hľadať kategóriu"]')).toBeVisible()

    // Check for type filter dropdown (react-select)
    await expect(page.locator('text=Všetky typy')).toBeVisible()
  })

  test('should display categories table with data', async ({ page }) => {
    // Check if table is visible (assuming seeded data exists)
    const tableExists = await page.locator('table').isVisible()
    if (tableExists) {
      // Check column headers
      await expect(page.locator('th:has-text("Názov")')).toBeVisible()
      await expect(page.locator('th:has-text("Typ testu")')).toBeVisible()
      await expect(page.locator('th:has-text("Popis")')).toBeVisible()
      await expect(page.locator('th:has-text("Počet testov")')).toBeVisible()
      await expect(page.locator('th:has-text("Akcie")')).toBeVisible()
    }
  })

  test.describe('Search and Filter', () => {
    test('should search categories by name', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Hľadať kategóriu"]')
      await searchInput.fill('jazyk')

      // Wait for debounce (500ms)
      await page.waitForTimeout(700)

      // Results should be filtered (if any categories exist with "jazyk")
      // This is a basic check - actual results depend on seed data
    })

    test('should filter categories by test type', async ({ page }) => {
      // Click on the type filter dropdown
      const typeFilter = page.locator('text=Všetky typy').first()
      await typeFilter.click()

      // Wait for options to appear
      await page.waitForTimeout(300)

      // Select first option if available
      const firstOption = page.locator('[class*="option"]').first()
      const optionExists = await firstOption.isVisible().catch(() => false)

      if (optionExists) {
        await firstOption.click()
        await page.waitForTimeout(500)
        // Categories should be filtered by selected type
      }
    })
  })

  test.describe('Create Category', () => {
    test('should open create modal when clicking create button', async ({ page }) => {
      await page.click('button:has-text("Pridať kategóriu")')

      await expect(page.locator('h3:has-text("Pridať kategóriu")')).toBeVisible()
      await expect(page.locator('label:has-text("Názov kategórie")')).toBeVisible()
      await expect(page.locator('label:has-text("Typ testu")')).toBeVisible()
      await expect(page.locator('label:has-text("Popis")')).toBeVisible()
      await expect(page.locator('button:has-text("Uložiť kategóriu")')).toBeVisible()
      await expect(page.locator('button:has-text("Zrušiť")')).toBeVisible()
    })

    test('should close create modal when clicking cancel', async ({ page }) => {
      await page.click('button:has-text("Pridať kategóriu")')
      await expect(page.locator('h3:has-text("Pridať kategóriu")')).toBeVisible()

      await page.click('button:has-text("Zrušiť")')
      await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
    })

    test('should validate required name field', async ({ page }) => {
      await page.click('button:has-text("Pridať kategóriu")')

      // Try to submit without filling name
      await page.click('button:has-text("Uložiť kategóriu")')

      // Modal should still be visible (validation failed)
      await expect(page.locator('h3:has-text("Pridať kategóriu")')).toBeVisible()
    })

    test('should create category with name only', async ({ page }) => {
      const timestamp = Date.now()
      const categoryName = `E2E Test Category ${timestamp}`

      await page.click('button:has-text("Pridať kategóriu")')

      // Fill only the name
      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(categoryName)

      await page.click('button:has-text("Uložiť kategóriu")')

      // Wait for success toast
      await expect(page.locator('text=Kategória bola úspešne vytvorená')).toBeVisible()

      // Verify category appears in table
      await expect(page.locator(`text=${categoryName}`)).toBeVisible()
    })

    test('should create category with all fields', async ({ page }) => {
      const timestamp = Date.now()
      const categoryName = `E2E Full Category ${timestamp}`
      const description = 'E2E test category description'

      await page.click('button:has-text("Pridať kategóriu")')

      // Fill name
      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(categoryName)

      // Select test type (if available)
      const typeSelect = page.locator('text=Vyberte typ testu').first()
      await typeSelect.click()
      await page.waitForTimeout(300)

      const firstTypeOption = page.locator('[class*="option"]').first()
      const typeOptionExists = await firstTypeOption.isVisible().catch(() => false)

      if (typeOptionExists) {
        await firstTypeOption.click()
      }

      // Fill description
      const descriptionTextarea = page.locator('textarea').first()
      await descriptionTextarea.fill(description)

      await page.click('button:has-text("Uložiť kategóriu")')

      // Wait for success
      await expect(page.locator('text=Kategória bola úspešne vytvorená')).toBeVisible()
      await expect(page.locator(`text=${categoryName}`)).toBeVisible()
    })

    test('should reject duplicate category name', async ({ page }) => {
      // Try to create a category with existing name
      const existingName = 'A1' // From seeded data

      await page.click('button:has-text("Pridať kategóriu")')

      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(existingName)

      await page.click('button:has-text("Uložiť kategóriu")')

      // Should show error
      await expect(page.locator('text=Nepodarilo sa uložiť kategóriu')).toBeVisible()
    })
  })

  test.describe('Edit Category', () => {
    let testCategoryName: string

    test.beforeEach(async ({ page }) => {
      // Create a test category to edit
      const timestamp = Date.now()
      testCategoryName = `E2E Edit Category ${timestamp}`

      await page.click('button:has-text("Pridať kategóriu")')
      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(testCategoryName)

      const descriptionTextarea = page.locator('textarea').first()
      await descriptionTextarea.fill('Original description')

      await page.click('button:has-text("Uložiť kategóriu")')
      await expect(page.locator('text=Kategória bola úspešne vytvorená')).toBeVisible()
    })

    test('should open edit modal when clicking edit button', async ({ page }) => {
      // Find and click edit button for our test category
      const row = page.locator(`tr:has-text("${testCategoryName}")`).first()
      const editButton = row.locator('button[title="Upraviť"]')
      await editButton.click()

      await expect(page.locator('h3:has-text("Upraviť kategóriu")')).toBeVisible()

      // Check if form is pre-filled
      const nameInput = page.locator('input[type="text"]').first()
      await expect(nameInput).toHaveValue(testCategoryName)
    })

    test('should close edit modal when clicking cancel', async ({ page }) => {
      const row = page.locator(`tr:has-text("${testCategoryName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      await expect(page.locator('h3:has-text("Upraviť kategóriu")')).toBeVisible()
      await page.click('button:has-text("Zrušiť")')
      await expect(page.locator('h3:has-text("Upraviť kategóriu")')).not.toBeVisible()
    })

    test('should update category name', async ({ page }) => {
      const newName = `${testCategoryName} Updated`

      const row = page.locator(`tr:has-text("${testCategoryName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(newName)

      await page.click('button:has-text("Uložiť kategóriu")')

      // Wait for success
      await expect(page.locator('text=Kategória bola úspešne aktualizovaná')).toBeVisible()
      await expect(page.locator(`text=${newName}`)).toBeVisible()
    })

    test('should update category description', async ({ page }) => {
      const newDescription = 'Updated description by E2E'

      const row = page.locator(`tr:has-text("${testCategoryName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      const descriptionTextarea = page.locator('textarea').first()
      await descriptionTextarea.fill(newDescription)

      await page.click('button:has-text("Uložiť kategóriu")')

      await expect(page.locator('text=Kategória bola úspešne aktualizovaná')).toBeVisible()
    })

    test('should change category test type', async ({ page }) => {
      const row = page.locator(`tr:has-text("${testCategoryName}")`).first()
      await row.locator('button[title="Upraviť"]').click()

      // Click on type select
      const typeSelect = page.locator('[class*="react-select"]').first()
      await typeSelect.click()
      await page.waitForTimeout(300)

      // Select an option if available
      const firstOption = page.locator('[class*="option"]').first()
      const optionExists = await firstOption.isVisible().catch(() => false)

      if (optionExists) {
        await firstOption.click()
        await page.click('button:has-text("Uložiť kategóriu")')
        await expect(page.locator('text=Kategória bola úspešne aktualizovaná')).toBeVisible()
      }
    })
  })

  test.describe('Delete Category', () => {
    test('should show confirmation and delete category without tests', async ({ page }) => {
      // Create a test category to delete
      const timestamp = Date.now()
      const categoryName = `E2E Delete Test ${timestamp}`

      await page.click('button:has-text("Pridať kategóriu")')
      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(categoryName)
      await page.click('button:has-text("Uložiť kategóriu")')
      await expect(page.locator('text=Kategória bola úspešne vytvorená')).toBeVisible()

      // Delete the category
      const row = page.locator(`tr:has-text("${categoryName}")`).first()
      const deleteButton = row.locator('button[title="Zmazať"]')

      // Set up dialog handler for confirm dialog
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain(`Naozaj chcete zmazať kategóriu "${categoryName}"?`)
        dialog.accept()
      })

      await deleteButton.click()

      // Wait for success
      await expect(page.locator('text=Kategória bola úspešne zmazaná')).toBeVisible()

      // Verify category is removed
      await expect(page.locator(`tr:has-text("${categoryName}")`)).not.toBeVisible()
    })

    test('should prevent deletion of category with tests', async ({ page }) => {
      // This test assumes there's a category with tests in the seeded data
      // We need to find a category that has testCount > 0

      // Wait for table to load
      await page.waitForTimeout(500)

      // Look for any row with test count > 0
      const rows = page.locator('table tbody tr')
      const rowCount = await rows.count()

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const testCountCell = row.locator('td').nth(3) // Počet testov column
        const testCountText = await testCountCell.textContent()

        if (testCountText && parseInt(testCountText) > 0) {
          // Found a category with tests
          const deleteButton = row.locator('button[title="Zmazať"]')

          // Button should be disabled
          await expect(deleteButton).toBeDisabled()

          // Try to click (should not trigger dialog)
          await deleteButton.click({ force: true })

          // Should show error toast
          await expect(page.locator('text=Kategóriu nemožno zmazať - obsahuje testy')).toBeVisible()

          break
        }
      }
    })

    test('should cancel delete operation', async ({ page }) => {
      // Create a test category
      const timestamp = Date.now()
      const categoryName = `E2E Delete Cancel ${timestamp}`

      await page.click('button:has-text("Pridať kategóriu")')
      const nameInput = page.locator('input[type="text"]').first()
      await nameInput.fill(categoryName)
      await page.click('button:has-text("Uložiť kategóriu")')
      await expect(page.locator('text=Kategória bola úspešne vytvorená')).toBeVisible()

      // Try to delete but cancel
      const row = page.locator(`tr:has-text("${categoryName}")`).first()
      const deleteButton = row.locator('button[title="Zmazať"]')

      // Set up dialog handler to dismiss
      page.once('dialog', dialog => dialog.dismiss())

      await deleteButton.click()

      // Category should still exist
      await expect(page.locator(`tr:has-text("${categoryName}")`)).toBeVisible()
    })
  })

  test.describe('Empty State', () => {
    test('should show empty state when no categories match filters', async ({ page }) => {
      // Search for something that doesn't exist
      const searchInput = page.locator('input[placeholder*="Hľadať kategóriu"]')
      await searchInput.fill('xyznonexistentcategory123')
      await page.waitForTimeout(700)

      // Should show empty state
      await expect(page.locator('text=Žiadne kategórie')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should navigate back to tests page', async ({ page }) => {
      await page.click('a:has-text("← Späť na Testy")')
      await page.waitForURL('/tests')
      await expect(page.locator('main h1')).toContainText('Testy')
    })
  })
})
