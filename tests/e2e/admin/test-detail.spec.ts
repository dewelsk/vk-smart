import { test, expect } from '@playwright/test'
import { loginAsSuperadmin, loginAsAdmin, loginAsGestor } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('Test Detail Page @admin @test-detail', () => {
  let testId: string
  let testCategoryId: string
  let testTypeId: string

  test.beforeAll(async () => {
    // Create test data in database
    await prisma.$connect()

    // Get superadmin user for authorId
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })
    if (!superadmin) {
      throw new Error('No superadmin found in database')
    }

    // Get or create test type
    const testType = await prisma.testType.findFirst()
    if (!testType) {
      throw new Error('No test type found in database')
    }
    testTypeId = testType.id

    // Get or create test category
    const testCategory = await prisma.testCategory.findFirst({
      where: { typeId: testTypeId }
    })
    if (!testCategory) {
      throw new Error('No test category found in database')
    }
    testCategoryId = testCategory.id

    // Create a test for E2E testing
    const test = await prisma.test.create({
      data: {
        name: 'E2E Test Detail ' + Date.now(),
        type: 'ODBORNY',
        categoryId: testCategoryId,
        description: 'E2E test description',
        difficulty: 5,
        recommendedDuration: 60,
        recommendedQuestionCount: 20,
        recommendedScore: 80,
        allowedQuestionTypes: ['SINGLE_CHOICE'],
        approved: false,
        authorId: superadmin.id,
        questions: [
          {
            order: 1,
            text: 'Test question?',
            points: 2,
            questionType: 'SINGLE_CHOICE',
            status: 'confirmed',
            answers: [
              { letter: 'a', text: 'Answer A', isCorrect: true },
              { letter: 'b', text: 'Answer B', isCorrect: false }
            ]
          }
        ]
      }
    })

    testId = test.id
  })

  test.afterAll(async () => {
    // Cleanup: Delete the test
    if (testId) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test.describe('SUPERADMIN', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should display test detail page with tabs', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Check tabs are visible
      await expect(page.getByTestId('overview-tab')).toBeVisible()
      await expect(page.getByTestId('questions-tab')).toBeVisible()
      await expect(page.getByTestId('vks-tab')).toBeVisible()

      // Overview tab should be active by default
      await expect(page.getByTestId('test-name-input')).toBeVisible()
      await expect(page.getByTestId('test-description-input')).toBeVisible()
      await expect(page.getByTestId('test-difficulty-slider')).toBeVisible()
      await expect(page.getByTestId('save-button')).toBeVisible()
    })

    test('should switch between tabs', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)
      await expect(page.getByTestId('questions-list')).toBeVisible()

      // Switch to VKs tab
      await page.getByTestId('vks-tab').click()
      await page.waitForTimeout(500)

      // Switch back to Overview tab
      await page.getByTestId('overview-tab').click()
      await page.waitForTimeout(500)
      await expect(page.getByTestId('test-name-input')).toBeVisible()
    })

    test('should display allowed question types checkboxes', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Check all 4 question type checkboxes exist
      await expect(page.getByTestId('question-type-single_choice')).toBeVisible()
      await expect(page.getByTestId('question-type-multiple_choice')).toBeVisible()
      await expect(page.getByTestId('question-type-true_false')).toBeVisible()
      await expect(page.getByTestId('question-type-open_ended')).toBeVisible()
    })

    test('should have SINGLE_CHOICE checked by default', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      const singleChoice = page.getByTestId('question-type-single_choice')
      await expect(singleChoice).toBeChecked()
    })

    test('should update test basic info', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Update name and description
      const nameInput = page.getByTestId('test-name-input')
      const descriptionInput = page.getByTestId('test-description-input')

      const timestamp = Date.now()
      const newName = `Updated Test Name ${timestamp}`
      const newDescription = `Updated Description ${timestamp}`

      await nameInput.fill(newName)
      await descriptionInput.fill(newDescription)

      // Save
      await page.getByTestId('save-button').click()

      // Wait for success toast
      await expect(page.locator('text=Test bol úspešne aktualizovaný')).toBeVisible({ timeout: 5000 })

      // Verify changes were saved
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(nameInput).toHaveValue(newName)
      await expect(descriptionInput).toHaveValue(newDescription)
    })

    test('should select and deselect question types', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')

      // Check MULTIPLE_CHOICE
      if (!(await multipleChoice.isChecked())) {
        await multipleChoice.click()
        await page.waitForTimeout(100)
      }
      await expect(multipleChoice).toBeChecked()

      // Check TRUE_FALSE
      if (!(await trueFalse.isChecked())) {
        await trueFalse.click()
        await page.waitForTimeout(100)
      }
      await expect(trueFalse).toBeChecked()

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Test bol úspešne aktualizovaný')).toBeVisible({ timeout: 5000 })

      // Reload and verify
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(multipleChoice).toBeChecked()
      await expect(trueFalse).toBeChecked()

      // Now uncheck TRUE_FALSE
      await trueFalse.click()
      await page.waitForTimeout(100)
      await expect(trueFalse).not.toBeChecked()

      // Save again
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Test bol úspešne aktualizovaný')).toBeVisible({ timeout: 5000 })

      // Verify TRUE_FALSE is unchecked
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(trueFalse).not.toBeChecked()
      await expect(multipleChoice).toBeChecked()
    })

    test('should prevent unchecking the last question type', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Make sure only SINGLE_CHOICE is checked
      const singleChoice = page.getByTestId('question-type-single_choice')
      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')
      const openEnded = page.getByTestId('question-type-open_ended')

      // Uncheck all except SINGLE_CHOICE
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
      await expect(page.locator('text=Test bol úspešne aktualizovaný')).toBeVisible({ timeout: 5000 })

      // Reload
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Verify SINGLE_CHOICE is the only one checked
      await expect(singleChoice).toBeChecked()
      await expect(multipleChoice).not.toBeChecked()
      await expect(trueFalse).not.toBeChecked()
      await expect(openEnded).not.toBeChecked()

      // Try to uncheck SINGLE_CHOICE (should be disabled)
      const isDisabled = await singleChoice.isDisabled()
      expect(isDisabled).toBe(true)
    })

    test('should update difficulty and recommended duration', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Update difficulty via slider
      const difficultySlider = page.getByTestId('test-difficulty-slider')
      await difficultySlider.fill('7')

      // Update recommended duration
      const durationInput = page.getByTestId('test-duration-input')
      await durationInput.fill('90')

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Test bol úspešne aktualizovaný')).toBeVisible({ timeout: 5000 })

      // Verify
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(page.getByTestId('test-difficulty-value')).toHaveText('7')
      await expect(durationInput).toHaveValue('90')
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Clear name
      const nameInput = page.getByTestId('test-name-input')
      await nameInput.fill('')

      // Try to save
      await page.getByTestId('save-button').click()

      // Should show validation error
      await expect(page.locator('text=Názov testu je povinný').or(page.locator('text=required'))).toBeVisible({ timeout: 3000 })
    })

    test('should update test with all four question types', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Check all question types
      const singleChoice = page.getByTestId('question-type-single_choice')
      const multipleChoice = page.getByTestId('question-type-multiple_choice')
      const trueFalse = page.getByTestId('question-type-true_false')
      const openEnded = page.getByTestId('question-type-open_ended')

      if (!(await singleChoice.isChecked())) await singleChoice.click()
      if (!(await multipleChoice.isChecked())) await multipleChoice.click()
      if (!(await trueFalse.isChecked())) await trueFalse.click()
      if (!(await openEnded.isChecked())) await openEnded.click()

      await page.waitForTimeout(200)

      // Save
      await page.getByTestId('save-button').click()
      await expect(page.locator('text=Test bol úspešne aktualizovaný')).toBeVisible({ timeout: 5000 })

      // Verify all are checked
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })
      await expect(singleChoice).toBeChecked()
      await expect(multipleChoice).toBeChecked()
      await expect(trueFalse).toBeChecked()
      await expect(openEnded).toBeChecked()
    })
  })

  test.describe('Questions Display', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should display questions list in Questions tab', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Questions list should be visible
      await expect(page.getByTestId('questions-list')).toBeVisible()
    })

    test('should display question items with correct structure', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // First question should be visible
      const firstQuestion = page.getByTestId('question-item-0')
      await expect(firstQuestion).toBeVisible()

      // Question number
      await expect(page.getByTestId('question-number-0')).toBeVisible()
      await expect(page.getByTestId('question-number-0')).toHaveText('1')

      // Question text
      await expect(page.getByTestId('question-text-0')).toBeVisible()
      await expect(page.getByTestId('question-text-0')).toHaveText('Test question?')

      // Question type badge
      await expect(page.getByTestId('question-type-0')).toBeVisible()
      await expect(page.getByTestId('question-type-0')).toContainText('Jednovýberová')

      // Question points badge
      await expect(page.getByTestId('question-points-0')).toBeVisible()
      await expect(page.getByTestId('question-points-0')).toContainText('2')
    })

    test('should display question answers', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Answers section should be visible
      await expect(page.getByTestId('question-answers-0')).toBeVisible()

      // Check both answers
      await expect(page.getByTestId('answer-0-0')).toBeVisible()
      await expect(page.getByTestId('answer-0-1')).toBeVisible()

      // First answer should be marked as correct
      await expect(page.getByTestId('correct-answer-0')).toBeVisible()
      await expect(page.getByTestId('correct-answer-0')).toContainText('Správna')
    })

    test('should display correct answer with green background', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // First answer is correct, should have green background
      const correctAnswer = page.getByTestId('answer-0-0')
      await expect(correctAnswer).toBeVisible()

      // Check if it has green background classes
      const className = await correctAnswer.getAttribute('class')
      expect(className).toContain('bg-green-50')
    })

    test('should count total questions correctly', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Question count should be visible in Overview tab
      await expect(page.getByTestId('test-question-count')).toHaveText('1')

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Questions section header should show count
      const questionsHeading = page.locator('h3:has-text("Otázky")')
      await expect(questionsHeading).toContainText('(1)')
    })
  })

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should navigate back to tests list', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Click back link
      await page.getByTestId('back-to-list-link').click()

      // Should navigate to tests list
      await page.waitForURL('/tests', { timeout: 5000 })
      await expect(page).toHaveURL('/tests')
    })
  })

  test.describe('Question Editing', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should display edit button for each question', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Edit button should be visible
      await expect(page.getByTestId('edit-question-0-button')).toBeVisible()
    })

    test('should open edit modal when clicking edit button', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Click edit button
      await page.getByTestId('edit-question-0-button').click()

      // Modal should be visible
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()
      await expect(page.getByTestId('modal-title')).toHaveText('Upraviť otázku')
    })

    test('should close modal when clicking cancel', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Click cancel
      await page.getByTestId('cancel-edit-button').click()
      await page.waitForTimeout(300)

      // Modal should be closed
      await expect(page.getByTestId('edit-question-modal')).not.toBeVisible()
    })

    test('should edit question text and save', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Edit question text
      const timestamp = Date.now()
      const newQuestionText = `Updated question text ${timestamp}?`
      await page.getByTestId('edit-question-text').fill(newQuestionText)

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify question text was updated
      await expect(page.getByTestId('question-text-0')).toHaveText(newQuestionText)
    })

    test('should edit answer text and save', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Edit first answer text
      const timestamp = Date.now()
      const newAnswerText = `Updated answer ${timestamp}`
      await page.getByTestId('answer-text-0').fill(newAnswerText)

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify answer text was updated in the question display
      const firstAnswer = page.getByTestId('answer-0-0')
      await expect(firstAnswer).toContainText(newAnswerText)
    })

    test('should change correct answer and save', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Check that first answer is currently correct
      await expect(page.getByTestId('answer-correct-0')).toBeChecked()

      // Change correct answer to second answer
      await page.getByTestId('answer-correct-1').click()
      await page.waitForTimeout(200)

      // Verify first is unchecked, second is checked
      await expect(page.getByTestId('answer-correct-0')).not.toBeChecked()
      await expect(page.getByTestId('answer-correct-1')).toBeChecked()

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify modal is closed
      await expect(page.getByTestId('edit-question-modal')).not.toBeVisible()

      // Verify second answer is now marked as correct in the display
      const secondAnswer = page.getByTestId('answer-0-1')
      const className = await secondAnswer.getAttribute('class')
      expect(className).toContain('bg-green-50')

      // Change it back for other tests
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()
      await page.getByTestId('answer-correct-0').click()
      await page.waitForTimeout(200)
      await page.getByTestId('save-edit-button').click()
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })
    })

    test('should add a new answer', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Should have 2 answers initially
      await expect(page.getByTestId('answer-row-0')).toBeVisible()
      await expect(page.getByTestId('answer-row-1')).toBeVisible()

      // Add new answer
      await page.getByTestId('add-answer-button').click()
      await page.waitForTimeout(200)

      // Should now have 3 answers
      await expect(page.getByTestId('answer-row-2')).toBeVisible()

      // Fill in the new answer
      await page.getByTestId('answer-text-2').fill('New answer C')

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify 3 answers are shown in the display
      await expect(page.getByTestId('answer-0-0')).toBeVisible()
      await expect(page.getByTestId('answer-0-1')).toBeVisible()
      await expect(page.getByTestId('answer-0-2')).toBeVisible()
      await expect(page.getByTestId('answer-0-2')).toContainText('New answer C')
    })

    test('should remove an answer', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Should have 3 answers from previous test
      await expect(page.getByTestId('answer-row-0')).toBeVisible()
      await expect(page.getByTestId('answer-row-1')).toBeVisible()
      await expect(page.getByTestId('answer-row-2')).toBeVisible()

      // Remove the last answer
      await page.getByTestId('remove-answer-2').click()
      await page.waitForTimeout(200)

      // Should now have 2 answers
      await expect(page.getByTestId('answer-row-0')).toBeVisible()
      await expect(page.getByTestId('answer-row-1')).toBeVisible()
      await expect(page.getByTestId('answer-row-2')).not.toBeVisible()

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify only 2 answers are shown in the display
      await expect(page.getByTestId('answer-0-0')).toBeVisible()
      await expect(page.getByTestId('answer-0-1')).toBeVisible()
      await expect(page.getByTestId('answer-0-2')).not.toBeVisible()
    })

    test('should validate empty question text', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Clear question text
      await page.getByTestId('edit-question-text').fill('')

      // Try to save
      await page.getByTestId('save-edit-button').click()
      await page.waitForTimeout(500)

      // Should show validation error
      await expect(page.getByTestId('question-text-error')).toBeVisible()
      await expect(page.getByTestId('question-text-error')).toHaveText('Text otázky je povinný')

      // Modal should still be open
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()
    })

    test('should validate at least one correct answer', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Uncheck the correct answer
      await page.getByTestId('answer-correct-0').click()
      await page.waitForTimeout(200)

      // Try to save
      await page.getByTestId('save-edit-button').click()
      await page.waitForTimeout(500)

      // Should show validation error
      await expect(page.getByTestId('answers-error')).toBeVisible()
      await expect(page.getByTestId('answers-error')).toHaveText('Otázka musí mať práve 1 správnu odpoveď')

      // Modal should still be open
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()
    })

    test('should change question type from SINGLE_CHOICE to TRUE_FALSE', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // First, update test to allow TRUE_FALSE
      const trueFalseCheckbox = page.getByTestId('question-type-true_false')
      if (!(await trueFalseCheckbox.isChecked())) {
        await trueFalseCheckbox.click()
        await page.waitForTimeout(100)
      }
      await page.getByTestId('save-button').click()
      await page.waitForTimeout(3000) // Wait for save

      // Reload to get updated test data
      await page.reload()
      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Current type should be SINGLE_CHOICE
      const typeSelect = page.getByTestId('edit-question-type')
      await expect(typeSelect).toHaveValue('SINGLE_CHOICE')

      // Change to TRUE_FALSE
      await typeSelect.selectOption('TRUE_FALSE')
      await page.waitForTimeout(500)

      // Should automatically have 2 answers now (Pravda/Nepravda)
      await expect(page.getByTestId('answer-row-0')).toBeVisible()
      await expect(page.getByTestId('answer-row-1')).toBeVisible()
      await expect(page.getByTestId('answer-text-0')).toHaveValue('Pravda')
      await expect(page.getByTestId('answer-text-1')).toHaveValue('Nepravda')

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify question type badge changed
      await expect(page.getByTestId('question-type-0')).toContainText('Pravda/Nepravda')
    })

    test('should change question type from TRUE_FALSE back to SINGLE_CHOICE', async ({ page }) => {
      await page.goto(`/tests/${testId}`)

      await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

      // Switch to Questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(500)

      // Open modal
      await page.getByTestId('edit-question-0-button').click()
      await expect(page.getByTestId('edit-question-modal')).toBeVisible()

      // Current type should be TRUE_FALSE
      const typeSelect = page.getByTestId('edit-question-type')
      await expect(typeSelect).toHaveValue('TRUE_FALSE')

      // Change back to SINGLE_CHOICE
      await typeSelect.selectOption('SINGLE_CHOICE')
      await page.waitForTimeout(500)

      // Should keep the 2 answers (minimum required)
      await expect(page.getByTestId('answer-row-0')).toBeVisible()
      await expect(page.getByTestId('answer-row-1')).toBeVisible()

      // Can add more answers now
      await page.getByTestId('add-answer-button').click()
      await page.waitForTimeout(200)
      await expect(page.getByTestId('answer-row-2')).toBeVisible()

      // Fill in the new answer
      await page.getByTestId('answer-text-0').fill('First answer')
      await page.getByTestId('answer-text-1').fill('Second answer')
      await page.getByTestId('answer-text-2').fill('Third answer')

      // Save
      await page.getByTestId('save-edit-button').click()

      // Wait for success toast
      await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

      // Verify question type badge changed back
      await expect(page.getByTestId('question-type-0')).toContainText('Jednovýberová')

      // Verify 3 answers are shown
      await expect(page.getByTestId('answer-0-0')).toBeVisible()
      await expect(page.getByTestId('answer-0-1')).toBeVisible()
      await expect(page.getByTestId('answer-0-2')).toBeVisible()
    })

    // Test with SINGLE allowed question type
    test.describe('Change correct answer - Single allowed type', () => {
      let singleTypeTestId: string

      test.beforeAll(async () => {
        await prisma.$connect()

        const superadmin = await prisma.user.findFirst({
          where: { role: 'SUPERADMIN' }
        })

        const singleTypeTest = await prisma.test.create({
          data: {
            name: 'E2E Single Type Test ' + Date.now(),
            type: 'ODBORNY',
            categoryId: testCategoryId,
            description: 'Test with single allowed question type',
            difficulty: 5,
            recommendedDuration: 60,
            recommendedQuestionCount: 20,
            recommendedScore: 80,
            allowedQuestionTypes: ['SINGLE_CHOICE'], // Only one type allowed
            approved: false,
            authorId: superadmin!.id,
            questions: [
              {
                order: 1,
                text: 'Single type test question?',
                points: 2,
                questionType: 'SINGLE_CHOICE',
                status: 'confirmed',
                answers: [
                  { letter: 'A', text: 'Answer A', isCorrect: true },
                  { letter: 'B', text: 'Answer B', isCorrect: false }
                ]
              }
            ]
          }
        })

        singleTypeTestId = singleTypeTest.id
      })

      test.afterAll(async () => {
        if (singleTypeTestId) {
          await prisma.test.delete({ where: { id: singleTypeTestId } }).catch(() => {})
        }
        await prisma.$disconnect()
      })

      test('should change correct answer and save', async ({ page }) => {
        await page.goto(`/tests/${singleTypeTestId}`)
        await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

        // Switch to Questions tab
        await page.getByTestId('questions-tab').click()
        await page.waitForTimeout(500)

        // Open modal
        await page.getByTestId('edit-question-0-button').click()
        await expect(page.getByTestId('edit-question-modal')).toBeVisible()

        // Check that first answer is currently correct
        await expect(page.getByTestId('answer-correct-0')).toBeChecked()

        // Change correct answer to second answer
        await page.getByTestId('answer-correct-1').click()
        await page.waitForTimeout(200)

        // Verify first is unchecked, second is checked
        await expect(page.getByTestId('answer-correct-0')).not.toBeChecked()
        await expect(page.getByTestId('answer-correct-1')).toBeChecked()

        // Save
        await page.getByTestId('save-edit-button').click()

        // Wait for success toast
        await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

        // Verify modal is closed
        await expect(page.getByTestId('edit-question-modal')).not.toBeVisible()

        // Verify second answer is now marked as correct in the display
        const secondAnswer = page.getByTestId('answer-0-1')
        const className = await secondAnswer.getAttribute('class')
        expect(className).toContain('bg-green-50')
      })
    })

    // Test with MULTIPLE allowed question types
    test.describe('Change correct answer - Multiple allowed types', () => {
      let multiTypeTestId: string

      test.beforeAll(async () => {
        await prisma.$connect()

        const superadmin = await prisma.user.findFirst({
          where: { role: 'SUPERADMIN' }
        })

        const multiTypeTest = await prisma.test.create({
          data: {
            name: 'E2E Multi Type Test ' + Date.now(),
            type: 'ODBORNY',
            categoryId: testCategoryId,
            description: 'Test with multiple allowed question types',
            difficulty: 5,
            recommendedDuration: 60,
            recommendedQuestionCount: 20,
            recommendedScore: 80,
            allowedQuestionTypes: ['SINGLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_CHOICE'], // Multiple types allowed
            approved: false,
            authorId: superadmin!.id,
            questions: [
              {
                order: 1,
                text: 'Multi type test question?',
                points: 2,
                questionType: 'SINGLE_CHOICE',
                status: 'confirmed',
                answers: [
                  { letter: 'A', text: 'Answer A', isCorrect: true },
                  { letter: 'B', text: 'Answer B', isCorrect: false }
                ]
              }
            ]
          }
        })

        multiTypeTestId = multiTypeTest.id
      })

      test.afterAll(async () => {
        if (multiTypeTestId) {
          await prisma.test.delete({ where: { id: multiTypeTestId } }).catch(() => {})
        }
        await prisma.$disconnect()
      })

      test('should change correct answer and save', async ({ page }) => {
        await page.goto(`/tests/${multiTypeTestId}`)
        await expect(page.getByTestId('test-detail-page')).toBeVisible({ timeout: 10000 })

        // Switch to Questions tab
        await page.getByTestId('questions-tab').click()
        await page.waitForTimeout(500)

        // Open modal
        await page.getByTestId('edit-question-0-button').click()
        await expect(page.getByTestId('edit-question-modal')).toBeVisible()

        // Check that first answer is currently correct
        await expect(page.getByTestId('answer-correct-0')).toBeChecked()

        // Change correct answer to second answer
        await page.getByTestId('answer-correct-1').click()
        await page.waitForTimeout(200)

        // Verify first is unchecked, second is checked
        await expect(page.getByTestId('answer-correct-0')).not.toBeChecked()
        await expect(page.getByTestId('answer-correct-1')).toBeChecked()

        // Save
        await page.getByTestId('save-edit-button').click()

        // Wait for success toast
        await expect(page.locator('text=Otázka bola úspešne aktualizovaná')).toBeVisible({ timeout: 5000 })

        // Verify modal is closed
        await expect(page.getByTestId('edit-question-modal')).not.toBeVisible()

        // Verify second answer is now marked as correct in the display
        const secondAnswer = page.getByTestId('answer-0-1')
        const className = await secondAnswer.getAttribute('class')
        expect(className).toContain('bg-green-50')
      })
    })
  })

  // Test Actions: Clone and Delete
  test.describe('Test Actions - Clone and Delete', () => {
    let cloneableTestId: string
    let deletableTestId: string
    let usedInVKTestId: string
    let vkId: string

    test.beforeAll(async () => {
      const superadmin = await prisma.user.findFirst({
        where: { role: 'SUPERADMIN' }
      })

      const institution = await prisma.institution.findFirst()
      if (!institution) {
        throw new Error('No institution found')
      }

      const testCategory = await prisma.testCategory.findFirst()
      if (!testCategory) {
        throw new Error('No test category found')
      }

      // Create test for cloning
      const cloneableTest = await prisma.test.create({
        data: {
          name: 'Test to Clone ' + Date.now(),
          type: 'ODBORNY',
          categoryId: testCategory.id,
          description: 'Test for cloning',
          difficulty: 5,
          recommendedDuration: 60,
          allowedQuestionTypes: ['SINGLE_CHOICE'],
          approved: true,
          authorId: superadmin!.id,
          questions: []
        }
      })
      cloneableTestId = cloneableTest.id

      // Create test for deletion
      const deletableTest = await prisma.test.create({
        data: {
          name: 'Test to Delete ' + Date.now(),
          type: 'ODBORNY',
          categoryId: testCategory.id,
          description: 'Test for deletion',
          difficulty: 5,
          recommendedDuration: 60,
          allowedQuestionTypes: ['SINGLE_CHOICE'],
          approved: false,
          authorId: superadmin!.id,
          questions: []
        }
      })
      deletableTestId = deletableTest.id

      // Create test used in VK (active)
      const usedTest = await prisma.test.create({
        data: {
          name: 'Test Used in VK ' + Date.now(),
          type: 'ODBORNY',
          categoryId: testCategory.id,
          description: 'Test used in active VK',
          difficulty: 5,
          recommendedDuration: 60,
          allowedQuestionTypes: ['SINGLE_CHOICE'],
          approved: true,
          authorId: superadmin!.id,
          questions: []
        }
      })
      usedInVKTestId = usedTest.id

      // Create VK and assign test
      const vk = await prisma.vyberoveKonanie.create({
        data: {
          identifier: 'VK-CLONE-TEST-' + Date.now(),
          selectionType: 'Internal',
          organizationalUnit: 'IT Department',
          serviceField: 'Technology',
          position: 'Software Engineer',
          serviceType: 'Full-time',
          date: new Date(),
          status: 'TESTOVANIE',
          institutionId: institution.id,
          gestorId: superadmin!.id,
          createdById: superadmin!.id
        }
      })
      vkId = vk.id

      // Assign test to VK
      await prisma.vKTest.create({
        data: {
          vkId: vk.id,
          testId: usedTest.id,
          level: 1
        }
      })
    })

    test.afterAll(async () => {
      // Cleanup
      if (vkId) {
        await prisma.vKTest.deleteMany({ where: { vkId } }).catch(() => {})
        await prisma.vyberoveKonanie.delete({ where: { id: vkId } }).catch(() => {})
      }
      if (cloneableTestId) {
        await prisma.test.delete({ where: { id: cloneableTestId } }).catch(() => {})
      }
      if (deletableTestId) {
        await prisma.test.delete({ where: { id: deletableTestId } }).catch(() => {})
      }
      if (usedInVKTestId) {
        await prisma.test.delete({ where: { id: usedInVKTestId } }).catch(() => {})
      }

      // Cleanup any cloned tests
      await prisma.test.deleteMany({
        where: {
          name: {
            contains: '(kópia)'
          }
        }
      }).catch(() => {})
    })

    test.beforeEach(async ({ page }) => {
      await loginAsSuperadmin(page)
    })

    test('should successfully clone a test', async ({ page }) => {
      await page.goto(`/tests/${cloneableTestId}`)
      await expect(page.getByTestId('test-detail-page')).toBeVisible()

      // Click clone button
      await page.getByTestId('clone-test-button').click()

      // Wait for success toast
      await expect(page.locator('text=Kópia testu bola vytvorená')).toBeVisible({ timeout: 5000 })

      // Should redirect to cloned test detail page
      await page.waitForURL(/\/tests\/[a-z0-9]+/, { timeout: 5000 })

      // Verify we're on a different test page
      const newUrl = page.url()
      expect(newUrl).not.toContain(cloneableTestId)

      // Verify test name has "(kópia)" suffix
      const heading = await page.locator('h1').textContent()
      expect(heading).toContain('(kópia)')

      // Verify clone is not approved
      await expect(page.locator('text=Neschválený')).toBeVisible()
    })

    test('should successfully delete unused test', async ({ page }) => {
      await page.goto(`/tests/${deletableTestId}`)
      await expect(page.getByTestId('test-detail-page')).toBeVisible()

      // Delete button should be enabled
      const deleteButton = page.getByTestId('delete-test-button')
      await expect(deleteButton).toBeEnabled()

      // Click delete button - should open confirm modal
      await deleteButton.click()

      // Wait for confirm modal to appear
      await expect(page.locator('h3:has-text("Vymazať test")')).toBeVisible()

      // Click confirm button in modal
      await page.locator('button:has-text("Vymazať")').last().click()

      // Wait for success toast
      await expect(page.locator('text=Test bol úspešne vymazaný')).toBeVisible({ timeout: 5000 })

      // Should redirect to tests list
      await page.waitForURL('/tests', { timeout: 5000 })
    })

    test('should prevent deletion of test used in active VK', async ({ page }) => {
      await page.goto(`/tests/${usedInVKTestId}`)
      await expect(page.getByTestId('test-detail-page')).toBeVisible()

      // Delete button should be disabled
      const deleteButton = page.getByTestId('delete-test-button')
      await expect(deleteButton).toBeDisabled()

      // Verify tooltip shows reason
      const title = await deleteButton.getAttribute('title')
      expect(title).toContain('aktívnom VK')
    })

    test('should show warning and disable editing for test used in VK', async ({ page }) => {
      await page.goto(`/tests/${usedInVKTestId}`)
      await expect(page.getByTestId('test-detail-page')).toBeVisible()

      // Warning should be visible
      await expect(page.getByTestId('usage-warning')).toBeVisible()
      await expect(page.locator('text=🔒 Tento test bol použitý vo výberovom konaní')).toBeVisible()

      // Navigate to overview tab
      await page.getByTestId('overview-tab').click()
      await page.waitForTimeout(300)

      // Edit inputs should be disabled
      const nameInput = page.getByTestId('test-name-input')
      await expect(nameInput).toBeDisabled()

      const descriptionInput = page.getByTestId('test-description-input')
      await expect(descriptionInput).toBeDisabled()

      const categorySelect = page.getByTestId('test-category-select')
      await expect(categorySelect).toBeDisabled()

      // Save button should not be visible (canEdit is false)
      await expect(page.getByTestId('save-button')).not.toBeVisible()

      // Navigate to questions tab
      await page.getByTestId('questions-tab').click()
      await page.waitForTimeout(300)

      // Edit question buttons should not be visible
      await expect(page.getByTestId('edit-question-0-button')).not.toBeVisible()
    })

    test('should allow cloning test that is used in VK', async ({ page }) => {
      await page.goto(`/tests/${usedInVKTestId}`)
      await expect(page.getByTestId('test-detail-page')).toBeVisible()

      // Clone button should be enabled even for used test
      const cloneButton = page.getByTestId('clone-test-button')
      await expect(cloneButton).toBeEnabled()

      // Click clone button
      await cloneButton.click()

      // Wait for success toast
      await expect(page.locator('text=Kópia testu bola vytvorená')).toBeVisible({ timeout: 5000 })

      // Should redirect to cloned test
      await page.waitForURL(/\/tests\/[a-z0-9]+/, { timeout: 5000 })

      // Cloned test should be editable (not used in VK)
      await page.getByTestId('overview-tab').click()
      await page.waitForTimeout(300)

      const nameInput = page.getByTestId('test-name-input')
      await expect(nameInput).toBeEnabled()

      // Warning should not be visible
      await expect(page.getByTestId('usage-warning')).not.toBeVisible()
    })
  })
})
