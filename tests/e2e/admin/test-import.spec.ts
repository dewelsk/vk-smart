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

})
