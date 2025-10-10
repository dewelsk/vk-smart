import { test, expect } from '@playwright/test'
import path from 'path'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Admin - Test Import', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should display test import page', async ({ page }) => {
    await page.goto('/tests/import')

    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('page-title')).toHaveText('Import testov z PDF/DOCX')
  })

  test('should upload and parse DOCX file', async ({ page }) => {
    await page.goto('/tests/import')

    // Get file input
    const fileInput = page.locator('input[type="file"]')

    // Upload test file
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    // Wait for parsing to complete
    await page.waitForTimeout(3000)

    // Check if questions are displayed
    const questionsSection = page.locator('[data-testid="questions-section"]')
    await expect(questionsSection).toBeVisible({ timeout: 10000 })

    // Verify question count
    const questionCards = page.locator('[data-testid^="question-card-"]')
    const count = await questionCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display parsed question details', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(2000)

    // Check first question
    const firstQuestion = page.locator('[data-testid="question-card-0"]').first()
    await expect(firstQuestion).toBeVisible({ timeout: 10000 })

    // Verify question has text
    await expect(firstQuestion.locator('p').first()).not.toBeEmpty()

    // Verify question has answers
    const answers = firstQuestion.locator('[data-testid^="answer-"]')
    await expect(answers.first()).toBeVisible()
  })

  test('should confirm question', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(2000)

    // Find first unconfirmed question
    const firstQuestion = page.locator('[data-testid="question-card-0"]').first()
    await expect(firstQuestion).toBeVisible({ timeout: 10000 })

    // Click confirm button
    const confirmButton = firstQuestion.getByTestId('confirm-question-button')
    if (await confirmButton.isVisible()) {
      await confirmButton.click()

      // Verify question is confirmed
      await expect(firstQuestion.getByTestId('question-confirmed-badge')).toBeVisible()
    }
  })

  test('should enable save button when all questions confirmed', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // After successful parse with all correct answers detected, save button should be enabled
    const saveButton = page.getByTestId('save-test-button')
    await expect(saveButton).toBeEnabled({ timeout: 10000 })

    // All questions should be confirmed automatically (correct answers were detected)
    const confirmedBadges = page.getByTestId('question-confirmed-badge')
    const count = await confirmedBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display statistics', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // Check statistics section
    await expect(page.getByTestId('import-stats')).toBeVisible({ timeout: 10000 })
    // Verify that total questions count is displayed (don't check specific number)
    const countText = await page.getByTestId('total-questions-count').textContent()
    expect(parseInt(countText || '0')).toBeGreaterThan(0)
  })

  test('should select category', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // Select category
    const categorySelect = page.getByTestId('category-select')
    await expect(categorySelect).toBeVisible({ timeout: 10000 })

    // Get available options
    const options = await categorySelect.locator('option').count()
    if (options > 1) {
      // Select first non-empty option
      await categorySelect.selectOption({ index: 1 })

      // Verify selected
      const selectedValue = await categorySelect.inputValue()
      expect(selectedValue).not.toBe('')
    }
  })

  test('should set points per question and calculate total points', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // Wait for questions to load
    await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

    // Change points per question to 2
    const pointsInput = page.getByTestId('points-per-question-input')
    await pointsInput.fill('2')

    // Verify total points updated (should be number of questions * 2)
    const totalPointsDisplay = page.getByTestId('total-points-display')
    const totalPoints = await totalPointsDisplay.inputValue()

    // Should be at least 40 (20 questions * 2 points)
    expect(parseInt(totalPoints)).toBeGreaterThanOrEqual(40)
  })

  test('should edit question', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // Wait for questions
    await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

    // Click edit button on first question
    const editButton = page.getByTestId('edit-question-button').first()
    await editButton.click()

    // Modal should appear
    await expect(page.getByTestId('edit-question-text')).toBeVisible()

    // Edit question text
    const questionTextArea = page.getByTestId('edit-question-text')
    await questionTextArea.fill('Edited question text')

    // Save changes
    await page.getByTestId('save-edit-button').click()

    // Modal should close
    await expect(page.getByTestId('edit-question-text')).not.toBeVisible()

    // Verify question was updated
    const firstQuestion = page.getByTestId('question-card-0')
    await expect(firstQuestion).toContainText('Edited question text')
  })

  test('should delete question', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // Wait for questions
    await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

    // Get initial count
    const questionCards = page.locator('[data-testid^="question-card-"]')
    const initialCount = await questionCards.count()

    // Click delete button on first question
    const deleteButton = page.getByTestId('delete-question-button').first()
    await deleteButton.click()

    // Confirm deletion in modal
    await page.getByRole('button', { name: 'Vymazať' }).click()

    await page.waitForTimeout(500)

    // Verify count decreased
    const newCount = await questionCards.count()
    expect(newCount).toBe(initialCount - 1)

    // Verify total questions count updated
    const totalQuestionsCount = page.getByTestId('total-questions-count')
    const countText = await totalQuestionsCount.textContent()
    expect(parseInt(countText || '0')).toBe(initialCount - 1)
  })

  test('should cancel edit without saving', async ({ page }) => {
    await page.goto('/tests/import')

    const fileInput = page.locator('input[type="file"]')
    const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
    await fileInput.setInputFiles(testFilePath)

    await page.waitForTimeout(3000)

    // Wait for questions
    await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

    // Get original text
    const firstQuestion = page.getByTestId('question-card-0')
    const originalText = await firstQuestion.textContent()

    // Click edit button
    const editButton = page.getByTestId('edit-question-button').first()
    await editButton.click()

    // Edit question text
    const questionTextArea = page.getByTestId('edit-question-text')
    await questionTextArea.fill('This should not be saved')

    // Cancel
    await page.getByTestId('cancel-edit-button').click()

    // Verify question was NOT updated
    const updatedText = await firstQuestion.textContent()
    expect(updatedText).toBe(originalText)
  })

  test.describe('Question Types', () => {
    test('should display question types checkboxes', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Question types group should be visible
      await expect(page.getByTestId('question-types-group')).toBeVisible({ timeout: 10000 })

      // All four checkboxes should be present
      await expect(page.getByTestId('question-type-single_choice')).toBeVisible()
      await expect(page.getByTestId('question-type-multiple_choice')).toBeVisible()
      await expect(page.getByTestId('question-type-true_false')).toBeVisible()
      await expect(page.getByTestId('question-type-open_ended')).toBeVisible()
    })

    test('should have SINGLE_CHOICE selected by default', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // SINGLE_CHOICE should be checked by default
      const singleChoice = page.getByTestId('question-type-single_choice')
      await expect(singleChoice).toBeChecked()

      // Others should not be checked
      await expect(page.getByTestId('question-type-multiple_choice')).not.toBeChecked()
      await expect(page.getByTestId('question-type-true_false')).not.toBeChecked()
      await expect(page.getByTestId('question-type-open_ended')).not.toBeChecked()
    })

    test('should select and deselect question types', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')

      // Select MULTIPLE_CHOICE
      await multipleChoice.click()
      await expect(multipleChoice).toBeChecked()

      // Select TRUE_FALSE
      await trueFalse.click()
      await expect(trueFalse).toBeChecked()

      // Now we have 3 types selected, deselect SINGLE_CHOICE
      const singleChoice = page.getByTestId('question-type-single_choice')
      await singleChoice.click()
      await expect(singleChoice).not.toBeChecked()

      // Still have 2 types selected
      await expect(multipleChoice).toBeChecked()
      await expect(trueFalse).toBeChecked()
    })

    test('should prevent unchecking the last question type', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Only SINGLE_CHOICE is checked by default
      const singleChoice = page.getByTestId('question-type-single_choice')
      await expect(singleChoice).toBeChecked()

      // Checkbox should be disabled when it's the only one selected
      await expect(singleChoice).toBeDisabled()

      // Try to click it (should fail because it's disabled)
      // We verify it stays checked
      await expect(singleChoice).toBeChecked()
    })

    test('should validate at least one question type is required on save', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Fill required fields
      await page.getByTestId('test-name-input').fill('Test Validation ' + Date.now())

      // Select category
      const categorySelect = page.getByTestId('category-select')
      const options = await categorySelect.locator('option').count()
      if (options > 1) {
        await categorySelect.selectOption({ index: 1 })
      }

      // The form should allow save since SINGLE_CHOICE is selected by default
      const saveButton = page.getByTestId('save-test-button')
      await expect(saveButton).toBeEnabled()

      // No error should be shown
      const error = page.getByTestId('question-types-error')
      await expect(error).not.toBeVisible()
    })

    test('should create test with all question types selected', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Fill required fields
      const timestamp = Date.now()
      await page.getByTestId('test-name-input').fill('Test All Types ' + timestamp)

      // Select category
      const categorySelect = page.getByTestId('category-select')
      const options = await categorySelect.locator('option').count()
      if (options > 1) {
        await categorySelect.selectOption({ index: 1 })
      }

      // Select all question types
      await page.getByTestId('question-type-multiple_choice').click()
      await page.getByTestId('question-type-true_false').click()
      await page.getByTestId('question-type-open_ended').click()

      // All should be checked
      await expect(page.getByTestId('question-type-single_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-multiple_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-true_false')).toBeChecked()
      await expect(page.getByTestId('question-type-open_ended')).toBeChecked()

      // Save button should be enabled
      await expect(page.getByTestId('save-test-button')).toBeEnabled()
    })

    test('should create test with only required fields and single question type', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Fill only required fields
      const timestamp = Date.now()
      await page.getByTestId('test-name-input').fill('Minimal Test ' + timestamp)

      // Select category
      const categorySelect = page.getByTestId('category-select')
      const options = await categorySelect.locator('option').count()
      if (options > 1) {
        await categorySelect.selectOption({ index: 1 })
      }

      // SINGLE_CHOICE is already selected by default
      await expect(page.getByTestId('question-type-single_choice')).toBeChecked()

      // Save should be enabled with just one question type
      await expect(page.getByTestId('save-test-button')).toBeEnabled()
    })

    test('should preserve question type selection when editing other fields', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Select multiple types
      await page.getByTestId('question-type-multiple_choice').click()
      await page.getByTestId('question-type-true_false').click()

      await expect(page.getByTestId('question-type-single_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-multiple_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-true_false')).toBeChecked()

      // Change test name
      await page.getByTestId('test-name-input').fill('Test Name Change')

      // Change difficulty
      await page.getByTestId('difficulty-slider').fill('7')

      // Question types should still be selected
      await expect(page.getByTestId('question-type-single_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-multiple_choice')).toBeChecked()
      await expect(page.getByTestId('question-type-true_false')).toBeChecked()
    })
  })

  test.describe('Question-level Question Types', () => {
    test('should display questionType select for each question', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      // Wait for questions to load
      await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

      // Check that first question has questionType select
      const firstQuestionTypeSelect = page.getByTestId('question-type-select-0')
      await expect(firstQuestionTypeSelect).toBeVisible()

      // Should have default value of SINGLE_CHOICE
      const selectedValue = await firstQuestionTypeSelect.inputValue()
      expect(selectedValue).toBe('SINGLE_CHOICE')
    })

    test('should change questionType for a question', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

      // Enable MULTIPLE_CHOICE at test level first
      await page.getByTestId('question-type-multiple_choice').click()

      // Change first question's type to MULTIPLE_CHOICE
      const firstQuestionTypeSelect = page.getByTestId('question-type-select-0')
      await firstQuestionTypeSelect.selectOption('MULTIPLE_CHOICE')

      // Verify it changed
      const selectedValue = await firstQuestionTypeSelect.inputValue()
      expect(selectedValue).toBe('MULTIPLE_CHOICE')
    })

    test('should only show allowed question types in select', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

      // By default, only SINGLE_CHOICE is allowed
      const firstQuestionTypeSelect = page.getByTestId('question-type-select-0')

      // Get all options
      const options = await firstQuestionTypeSelect.locator('option').allTextContents()

      // Should only have 1 option (SINGLE_CHOICE)
      expect(options.length).toBe(1)
      expect(options[0]).toContain('Jednovýberová')

      // Now enable MULTIPLE_CHOICE at test level
      await page.getByTestId('question-type-multiple_choice').click()

      // Should now have 2 options
      const newOptions = await firstQuestionTypeSelect.locator('option').allTextContents()
      expect(newOptions.length).toBe(2)
    })

    test('should preserve questionType when editing question in modal', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

      // Enable MULTIPLE_CHOICE at test level
      await page.getByTestId('question-type-multiple_choice').click()

      // Change first question's type to MULTIPLE_CHOICE
      const firstQuestionTypeSelect = page.getByTestId('question-type-select-0')
      await firstQuestionTypeSelect.selectOption('MULTIPLE_CHOICE')

      // Open edit modal
      const editButton = page.getByTestId('edit-question-button').first()
      await editButton.click()

      // Modal should show MULTIPLE_CHOICE selected
      const modalQuestionTypeSelect = page.getByTestId('edit-question-type')
      await expect(modalQuestionTypeSelect).toBeVisible()
      const modalSelectedValue = await modalQuestionTypeSelect.inputValue()
      expect(modalSelectedValue).toBe('MULTIPLE_CHOICE')

      // Change it to SINGLE_CHOICE in modal
      await modalQuestionTypeSelect.selectOption('SINGLE_CHOICE')

      // Save
      await page.getByTestId('save-edit-button').click()

      // Verify it changed in the list view too
      const updatedValue = await firstQuestionTypeSelect.inputValue()
      expect(updatedValue).toBe('SINGLE_CHOICE')
    })

    test('should filter modal question type options by test allowedQuestionTypes', async ({ page }) => {
      await page.goto('/tests/import')

      const fileInput = page.locator('input[type="file"]')
      const testFilePath = path.join(__dirname, '../../../zadanie/testy/dummy_test_VK_2025.docx')
      await fileInput.setInputFiles(testFilePath)

      await page.waitForTimeout(3000)

      await expect(page.getByTestId('questions-section')).toBeVisible({ timeout: 10000 })

      // Open edit modal with only SINGLE_CHOICE allowed
      const editButton = page.getByTestId('edit-question-button').first()
      await editButton.click()

      // Modal question type select should only show SINGLE_CHOICE
      const modalQuestionTypeSelect = page.getByTestId('edit-question-type')
      const options = await modalQuestionTypeSelect.locator('option').allTextContents()
      expect(options.length).toBe(1)

      // Cancel and close modal
      await page.getByTestId('cancel-edit-button').click()

      // Enable TRUE_FALSE at test level
      await page.getByTestId('question-type-true_false').click()

      // Open modal again
      await editButton.click()

      // Should now have 2 options
      const newOptions = await modalQuestionTypeSelect.locator('option').allTextContents()
      expect(newOptions.length).toBe(2)
    })
  })

})
