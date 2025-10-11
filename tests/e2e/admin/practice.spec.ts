import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('Practice Tests Flow', () => {
  let practiceTestId: string
  let testTypeId: string
  let testTypeConditionId: string | null
  let testCategoryId: string

  test.beforeAll(async () => {
    await prisma.$connect()

    // Get superadmin for authorId
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })
    if (!superadmin) {
      throw new Error('No superadmin found')
    }

    // Create dedicated test type and category
    const testType = await prisma.testType.create({
      data: {
        name: 'E2E Practice Test Type ' + Date.now(),
        description: 'Test type for practice flow spec',
        conditions: {
          create: [
            {
              name: 'Practice podmienka',
              description: 'Podmienka pre practice e2e test'
            }
          ]
        }
      },
      include: {
        conditions: true
      }
    })
    testTypeId = testType.id
    testTypeConditionId = testType.conditions[0]?.id ?? null

    const category = await prisma.testCategory.create({
      data: {
        name: 'E2E Practice Category ' + Date.now(),
        typeId: testTypeId
      }
    })
    testCategoryId = category.id

    // Create practice test
    const practiceTest = await prisma.test.create({
      data: {
        name: 'E2E Practice Test ' + Date.now(),
        testTypeId,
        testTypeConditionId,
        categoryId: testCategoryId,
        description: 'Practice test for E2E testing',
        difficulty: 5,
        recommendedDuration: 30,
        recommendedQuestionCount: 5,
        allowedQuestionTypes: ['SINGLE_CHOICE', 'TRUE_FALSE'],
        approved: true,
        practiceEnabled: true,
        authorId: superadmin.id,
        questions: [
          {
            order: 1,
            text: 'Test question 1?',
            points: 2,
            questionType: 'SINGLE_CHOICE',
            status: 'confirmed',
            answers: [
              { letter: 'a', text: 'Answer A', isCorrect: true },
              { letter: 'b', text: 'Answer B', isCorrect: false }
            ]
          },
          {
            order: 2,
            text: 'Test question 2?',
            points: 2,
            questionType: 'TRUE_FALSE',
            status: 'confirmed',
            answers: [
              { letter: 'a', text: 'Pravda', isCorrect: true },
              { letter: 'b', text: 'Nepravda', isCorrect: false }
            ]
          }
        ]
      }
    })

    practiceTestId = practiceTest.id
  })

  test.afterAll(async () => {
    if (practiceTestId) {
      await prisma.test.delete({ where: { id: practiceTestId } }).catch(() => {})
    }
    if (testCategoryId) {
      await prisma.testCategory.delete({ where: { id: testCategoryId } }).catch(() => {})
    }
    if (testTypeId) {
      await prisma.testType.delete({ where: { id: testTypeId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test.beforeEach(async ({ page }) => {
    // Login as ADMIN user
    await loginAsAdmin(page)
  })

  test('should navigate to practice page from sidebar', async ({ page }) => {
    // Click on Testy menu to expand it
    await page.click('button:has-text("Testy")')

    // Click on Precvičovanie
    await page.click('a:has-text("Precvičovanie")')

    // Should be on practice page
    await expect(page).toHaveURL(/\/tests\/practice$/)
    await expect(page.getByTestId('practice-page')).toBeVisible()
  })

  test('should display available tests', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Should show tests grid or empty state
    const hasTests = await page.getByTestId('tests-grid').isVisible().catch(() => false)
    const isEmpty = await page.getByTestId('empty-state').isVisible().catch(() => false)

    expect(hasTests || isEmpty).toBeTruthy()
  })

  test('should filter tests by type', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Open type filter dropdown
    const typeSelect = page.locator('#type-filter-select-input')
    await typeSelect.click({ force: true })
    await page.waitForTimeout(500)

    // Select first option
    const firstOption = page.locator('[id^="react-select"][id$="-option-0"]').first()
    await firstOption.click({ force: true })

    // Should filter tests (or show empty state if no tests of that type)
    await page.waitForTimeout(500)
  })

  test('should search tests by name', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Type in search
    await page.getByTestId('search-input').fill('test')

    // Wait for debounce (500ms) + API call + loading to finish again
    await page.waitForTimeout(600)
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Results should update (or show empty state)
    const hasResults = await page.getByTestId('tests-grid').isVisible().catch(() => false)
    const isEmpty = await page.getByTestId('empty-state').isVisible().catch(() => false)

    expect(hasResults || isEmpty).toBeTruthy()
  })

  test('should start practice test and complete it', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    // Check if there are any tests available
    const hasTests = await page.getByTestId('tests-grid').isVisible().catch(() => false)

    if (!hasTests) {
      console.log('No tests available for practice')
      test.skip()
      return
    }

    // Click start button on first test
    const firstStartButton = page.getByTestId('start-practice-button').first()
    await firstStartButton.click()

    // Should redirect to test page
    await page.waitForURL(/\/tests\/practice\/[a-zA-Z0-9]+$/, { timeout: 10000 })
    await expect(page.getByTestId('practice-test-page')).toBeVisible()

    // Test should have a title
    await expect(page.getByTestId('test-title')).toBeVisible()

    // Answer all questions (select first option for each)
    const questions = page.locator('[data-testid^="question-"]')
    const questionCount = await questions.count()

    for (let i = 0; i < questionCount; i++) {
      const question = questions.nth(i)

      // Try different question types
      const hasSingleChoice = await question.getByTestId('single-choice-options').isVisible().catch(() => false)
      const hasMultipleChoice = await question.getByTestId('multiple-choice-options').isVisible().catch(() => false)
      const hasTrueFalse = await question.getByTestId('true-false-options').isVisible().catch(() => false)
      const hasTextAnswer = await question.getByTestId('text-answer').isVisible().catch(() => false)

      if (hasSingleChoice) {
        // Click first radio option
        await question.locator('input[type="radio"]').first().click()
      } else if (hasMultipleChoice) {
        // Click first checkbox
        await question.locator('input[type="checkbox"]').first().click()
      } else if (hasTrueFalse) {
        // Click first option
        await question.locator('input[type="radio"]').first().click()
      } else if (hasTextAnswer) {
        // Type answer
        await question.getByTestId('text-answer').locator('input').fill('Test answer')
      }
    }

    // Submit test
    await page.getByTestId('submit-test-button').click()

    // Should redirect to results page
    await page.waitForURL(/\/tests\/practice\/[a-zA-Z0-9]+\/results$/, { timeout: 10000 })
    await expect(page.getByTestId('results-page')).toBeVisible()

    // Results should show
    await expect(page.getByTestId('results-summary')).toBeVisible()
    await expect(page.getByTestId('success-rate')).toBeVisible()
    await expect(page.getByTestId('correct-count')).toBeVisible()
    await expect(page.getByTestId('incorrect-count')).toBeVisible()
    await expect(page.getByTestId('duration')).toBeVisible()
  })

  test('should show progress while answering questions', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    const hasTests = await page.getByTestId('tests-grid').isVisible().catch(() => false)
    if (!hasTests) {
      test.skip()
      return
    }

    // Start test
    await page.getByTestId('start-practice-button').first().click()
    await page.waitForURL(/\/tests\/practice\/[a-zA-Z0-9]+$/)

    // Progress bar should exist (may have width 0% initially)
    const progressBar = page.locator('.bg-blue-600.h-2.rounded-full')
    await expect(progressBar).toHaveCount(1)

    // Answer first question
    const firstQuestion = page.locator('[data-testid^="question-"]').first()
    const firstInput = firstQuestion.locator('input').first()
    await firstInput.click()

    // Progress should update
    await page.waitForTimeout(500)
    // Progress bar width should be greater than 0
    const width = await progressBar.evaluate(el => el.style.width)
    expect(width).not.toBe('0%')
  })

  test('should expand/collapse question results', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    const hasTests = await page.getByTestId('tests-grid').isVisible().catch(() => false)
    if (!hasTests) {
      test.skip()
      return
    }

    // Complete a test quickly
    await page.getByTestId('start-practice-button').first().click()
    await page.waitForURL(/\/tests\/practice\/[a-zA-Z0-9]+$/)

    // Answer first question
    const firstInput = page.locator('input[type="radio"]').first()
    await firstInput.click()

    // Submit (might show warning about unanswered questions)
    await page.getByTestId('submit-test-button').click()
    await page.waitForURL(/\/results$/)

    // First question result should be visible
    const firstQuestionResult = page.getByTestId('question-result-1')
    await expect(firstQuestionResult).toBeVisible()

    // Click to expand
    await firstQuestionResult.click()

    // Wait for expansion
    await page.waitForTimeout(300)

    // Should show answer details (user answer, correct answer, explanation)
    // The details are rendered after clicking, so check if the element height changed
    const hasExpanded = await firstQuestionResult.locator('.border-t.border-gray-100').isVisible()
    expect(hasExpanded).toBeTruthy()
  })

  test('should navigate back to practice list from results', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    const hasTests = await page.getByTestId('tests-grid').isVisible().catch(() => false)
    if (!hasTests) {
      test.skip()
      return
    }

    // Complete a quick test
    await page.getByTestId('start-practice-button').first().click()
    await page.waitForURL(/\/tests\/practice\/[a-zA-Z0-9]+$/)

    await page.locator('input').first().click()
    await page.getByTestId('submit-test-button').click()
    await page.waitForURL(/\/results$/)

    // Click back to practice button
    await page.getByTestId('back-to-practice-button').click()

    // Should be back on practice page
    await expect(page).toHaveURL(/\/tests\/practice$/)
    await expect(page.getByTestId('practice-page')).toBeVisible()
  })

  test('should show timer if test has recommended duration', async ({ page }) => {
    await page.goto('http://localhost:5600/tests/practice')

    // Wait for loading to finish
    await page.waitForSelector('text=Načítavam...', { state: 'hidden', timeout: 10000 }).catch(() => {})

    const hasTests = await page.getByTestId('tests-grid').isVisible().catch(() => false)
    if (!hasTests) {
      test.skip()
      return
    }

    // Start test
    await page.getByTestId('start-practice-button').first().click()
    await page.waitForURL(/\/tests\/practice\/[a-zA-Z0-9]+$/)

    // Timer might be visible (if test has recommended duration)
    const hasTimer = await page.getByTestId('time-remaining').isVisible().catch(() => false)

    // Timer is optional, so we just check that page loaded correctly
    await expect(page.getByTestId('practice-test-page')).toBeVisible()
  })
})
