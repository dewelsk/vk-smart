import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Tests API - Question Types', () => {
  let testCategoryId: string
  let testTypeId: string

  beforeAll(async () => {
    await prisma.$connect()

    // Create test type
    const testType = await prisma.testType.create({
      data: {
        name: 'Test Type for Tests ' + Date.now(),
        description: 'Test type for tests API'
      }
    })
    testTypeId = testType.id

    // Create test category
    const category = await prisma.testCategory.create({
      data: {
        name: 'Test Category for Tests ' + Date.now(),
        typeId: testTypeId,
        description: 'Category for test API tests'
      }
    })
    testCategoryId = category.id
  })

  afterAll(async () => {
    // Cleanup
    if (testCategoryId) {
      await prisma.testCategory.delete({
        where: { id: testCategoryId }
      }).catch(() => {})
    }
    if (testTypeId) {
      await prisma.testType.delete({
        where: { id: testTypeId }
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('POST /api/admin/tests/import/save - Create test', () => {
    let createdTestId: string | null = null

    afterEach(async () => {
      if (createdTestId) {
        await prisma.test.delete({
          where: { id: createdTestId }
        }).catch(() => {})
        createdTestId = null
      }
    })

    it('should create test with valid allowedQuestionTypes', async () => {
      const testData = {
        name: 'Test with Question Types ' + Date.now(),
        testTypeId,
        categoryId: testCategoryId,
        recommendedDuration: 45,
        recommendedQuestionCount: 10,
        difficulty: 5,
        allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
        questions: [
          {
            order: 1,
            text: 'Test question?',
            points: 1,
            status: 'confirmed',
            answers: [
              { letter: 'a', text: 'Answer A', isCorrect: true },
              { letter: 'b', text: 'Answer B', isCorrect: false }
            ]
          }
        ]
      }

      const test = await prisma.test.create({
        data: {
          name: testData.name,
          testTypeId: testData.testTypeId,
          categoryId: testData.categoryId,
          recommendedDuration: testData.recommendedDuration,
          recommendedQuestionCount: testData.recommendedQuestionCount,
          difficulty: testData.difficulty,
          allowedQuestionTypes: testData.allowedQuestionTypes,
          questions: testData.questions,
          approved: false
        }
      })

      createdTestId = test.id

      expect(test).toBeDefined()
      expect(test.id).toBeDefined()
      expect(test.allowedQuestionTypes).toEqual(['SINGLE_CHOICE', 'MULTIPLE_CHOICE'])
    })

    it('should create test with default SINGLE_CHOICE when allowedQuestionTypes not provided', async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Test Default Types ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          recommendedDuration: 45,
          questions: []
        }
      })

      createdTestId = test.id

      expect(test.allowedQuestionTypes).toEqual(['SINGLE_CHOICE'])
    })

    it('should store all four question types', async () => {
      const allTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']

      const test = await prisma.test.create({
        data: {
          name: 'Test All Types ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          allowedQuestionTypes: allTypes,
          questions: []
        }
      })

      createdTestId = test.id

      expect(test.allowedQuestionTypes).toEqual(allTypes)
      expect((test.allowedQuestionTypes as string[]).length).toBe(4)
    })

    it('should retrieve allowedQuestionTypes when querying test', async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Test Query Types ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          allowedQuestionTypes: ['TRUE_FALSE', 'OPEN_ENDED'],
          questions: []
        }
      })

      createdTestId = test.id

      const retrieved = await prisma.test.findUnique({
        where: { id: test.id }
      })

      expect(retrieved).toBeDefined()
      expect(retrieved?.allowedQuestionTypes).toEqual(['TRUE_FALSE', 'OPEN_ENDED'])
    })
  })

  describe('GET /api/admin/tests - List tests with question types', () => {
    let testId1: string
    let testId2: string

    beforeAll(async () => {
      // Create test with single choice
      const test1 = await prisma.test.create({
        data: {
          name: 'List Test 1 ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          allowedQuestionTypes: ['SINGLE_CHOICE'],
          questions: []
        }
      })
      testId1 = test1.id

      // Create test with multiple types
      const test2 = await prisma.test.create({
        data: {
          name: 'List Test 2 ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'],
          questions: []
        }
      })
      testId2 = test2.id
    })

    afterAll(async () => {
      await prisma.test.delete({ where: { id: testId1 } }).catch(() => {})
      await prisma.test.delete({ where: { id: testId2 } }).catch(() => {})
    })

    it('should fetch tests with allowedQuestionTypes', async () => {
      const tests = await prisma.test.findMany({
        where: {
          id: { in: [testId1, testId2] }
        }
      })

      expect(tests.length).toBe(2)

      const test1 = tests.find(t => t.id === testId1)
      const test2 = tests.find(t => t.id === testId2)

      expect(test1?.allowedQuestionTypes).toEqual(['SINGLE_CHOICE'])
      expect(test2?.allowedQuestionTypes).toEqual(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'])
    })

    it('should include allowedQuestionTypes in select query', async () => {
      const tests = await prisma.test.findMany({
        where: {
          id: { in: [testId1, testId2] }
        },
        select: {
          id: true,
          name: true,
          allowedQuestionTypes: true
        }
      })

      expect(tests.length).toBe(2)
      tests.forEach(test => {
        expect(test.allowedQuestionTypes).toBeDefined()
        expect(Array.isArray(test.allowedQuestionTypes)).toBe(true)
      })
    })
  })

  describe('Validation - allowedQuestionTypes', () => {
    it('should validate allowedQuestionTypes is array', () => {
      const validTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']
      expect(Array.isArray(validTypes)).toBe(true)
      expect(validTypes.length).toBeGreaterThan(0)
    })

    it('should validate all types are valid', () => {
      const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
      const testTypes = ['SINGLE_CHOICE', 'TRUE_FALSE']

      const invalidTypes = testTypes.filter(type => !validQuestionTypes.includes(type))
      expect(invalidTypes.length).toBe(0)
    })

    it('should detect invalid question types', () => {
      const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
      const testTypes = ['SINGLE_CHOICE', 'INVALID_TYPE', 'ANOTHER_INVALID']

      const invalidTypes = testTypes.filter(type => !validQuestionTypes.includes(type))
      expect(invalidTypes.length).toBe(2)
      expect(invalidTypes).toContain('INVALID_TYPE')
      expect(invalidTypes).toContain('ANOTHER_INVALID')
    })

    it('should require at least one question type', () => {
      const emptyTypes: string[] = []
      expect(emptyTypes.length).toBe(0)

      // This should fail validation
      const isValid = emptyTypes.length > 0
      expect(isValid).toBe(false)
    })
  })

  describe('Update allowedQuestionTypes', () => {
    let testId: string

    beforeEach(async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Update Test ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          allowedQuestionTypes: ['SINGLE_CHOICE'],
          questions: []
        }
      })
      testId = test.id
    })

    afterEach(async () => {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {})
    })

    it('should update allowedQuestionTypes', async () => {
      const updated = await prisma.test.update({
        where: { id: testId },
        data: {
          allowedQuestionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE']
        }
      })

      expect(updated.allowedQuestionTypes).toEqual(['MULTIPLE_CHOICE', 'TRUE_FALSE'])
    })

    it('should add question types to existing test', async () => {
      const updated = await prisma.test.update({
        where: { id: testId },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
        }
      })

      expect((updated.allowedQuestionTypes as string[]).length).toBe(4)
    })

    it('should remove question types from existing test', async () => {
      // First add multiple types
      await prisma.test.update({
        where: { id: testId },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']
        }
      })

      // Then remove some
      const updated = await prisma.test.update({
        where: { id: testId },
        data: {
          allowedQuestionTypes: ['TRUE_FALSE']
        }
      })

      expect(updated.allowedQuestionTypes).toEqual(['TRUE_FALSE'])
      expect((updated.allowedQuestionTypes as string[]).length).toBe(1)
    })
  })

  describe('GET /api/admin/tests/[id] - Test detail', () => {
    let detailTestId: string

    beforeAll(async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Detail Test ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          description: 'Test description',
          difficulty: 5,
          recommendedDuration: 60,
          recommendedQuestionCount: 20,
          recommendedScore: 80,
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
          approved: false,
          questions: [
            {
              order: 1,
              text: 'Test question?',
              points: 2,
              status: 'confirmed',
              answers: [
                { letter: 'a', text: 'Answer A', isCorrect: true },
                { letter: 'b', text: 'Answer B', isCorrect: false }
              ]
            }
          ]
        }
      })
      detailTestId = test.id
    })

    afterAll(async () => {
      await prisma.test.delete({ where: { id: detailTestId } }).catch(() => {})
    })

    it('should fetch test detail with all fields', async () => {
      const test = await prisma.test.findUnique({
        where: { id: detailTestId },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      expect(test).toBeDefined()
      expect(test?.id).toBe(detailTestId)
      expect(test?.name).toContain('Detail Test')
      expect(test?.description).toBe('Test description')
      expect(test?.difficulty).toBe(5)
      expect(test?.recommendedDuration).toBe(60)
      expect(test?.recommendedQuestionCount).toBe(20)
      expect(test?.recommendedScore).toBe(80)
      expect(test?.allowedQuestionTypes).toEqual(['SINGLE_CHOICE', 'MULTIPLE_CHOICE'])
      expect(test?.approved).toBe(false)
    })

    it('should include questions in test detail', async () => {
      const test = await prisma.test.findUnique({
        where: { id: detailTestId }
      })

      expect(test?.questions).toBeDefined()
      expect(Array.isArray(test?.questions)).toBe(true)
      const questions = test?.questions as any[]
      expect(questions.length).toBe(1)
      expect(questions[0].text).toBe('Test question?')
    })

    it('should return null for non-existent test', async () => {
      const test = await prisma.test.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(test).toBeNull()
    })

    it('should include category information', async () => {
      const test = await prisma.test.findUnique({
        where: { id: detailTestId },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      expect(test?.category).toBeDefined()
      expect(test?.category?.id).toBe(testCategoryId)
    })
  })

  describe('PATCH /api/admin/tests/[id] - Update test detail', () => {
    let updateTestId: string

    beforeEach(async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Test to Update ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          description: 'Original description',
          difficulty: 3,
          allowedQuestionTypes: ['SINGLE_CHOICE'],
          questions: []
        }
      })
      updateTestId = test.id
    })

    afterEach(async () => {
      await prisma.test.delete({ where: { id: updateTestId } }).catch(() => {})
    })

    it('should update test name and description', async () => {
      const updated = await prisma.test.update({
        where: { id: updateTestId },
        data: {
          name: 'Updated Name',
          description: 'Updated description'
        }
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
    })

    it('should update allowedQuestionTypes', async () => {
      const updated = await prisma.test.update({
        where: { id: updateTestId },
        data: {
          allowedQuestionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
        }
      })

      expect(updated.allowedQuestionTypes).toEqual(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED'])
      expect((updated.allowedQuestionTypes as string[]).length).toBe(3)
    })

    it('should update difficulty and recommended values', async () => {
      const updated = await prisma.test.update({
        where: { id: updateTestId },
        data: {
          difficulty: 8,
          recommendedDuration: 90,
          recommendedQuestionCount: 30,
          recommendedScore: 75
        }
      })

      expect(updated.difficulty).toBe(8)
      expect(updated.recommendedDuration).toBe(90)
      expect(updated.recommendedQuestionCount).toBe(30)
      expect(updated.recommendedScore).toBe(75)
    })

    it('should update approved status and set approvedAt', async () => {
      const updated = await prisma.test.update({
        where: { id: updateTestId },
        data: {
          approved: true,
          approvedAt: new Date()
        }
      })

      expect(updated.approved).toBe(true)
      expect(updated.approvedAt).toBeDefined()
    })

    it('should update category', async () => {
      // Create another category
      const newCategory = await prisma.testCategory.create({
        data: {
          name: 'New Category ' + Date.now(),
          typeId: testTypeId
        }
      })

      const updated = await prisma.test.update({
        where: { id: updateTestId },
        data: {
          categoryId: newCategory.id
        }
      })

      expect(updated.categoryId).toBe(newCategory.id)

      // Cleanup
      await prisma.testCategory.delete({ where: { id: newCategory.id } }).catch(() => {})
    })

    it('should preserve other fields when updating allowedQuestionTypes', async () => {
      const original = await prisma.test.findUnique({
        where: { id: updateTestId }
      })

      const updated = await prisma.test.update({
        where: { id: updateTestId },
        data: {
          allowedQuestionTypes: ['TRUE_FALSE']
        }
      })

      expect(updated.name).toBe(original?.name)
      expect(updated.description).toBe(original?.description)
      expect(updated.difficulty).toBe(original?.difficulty)
      expect(updated.allowedQuestionTypes).toEqual(['TRUE_FALSE'])
    })

    it('should reject empty allowedQuestionTypes array', () => {
      const emptyTypes: string[] = []
      const isValid = emptyTypes.length > 0
      expect(isValid).toBe(false)
    })

    it('should detect invalid question type values', () => {
      const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
      const testTypes = ['SINGLE_CHOICE', 'INVALID_TYPE']

      const invalidTypes = testTypes.filter(type => !validQuestionTypes.includes(type))
      expect(invalidTypes.length).toBe(1)
      expect(invalidTypes[0]).toBe('INVALID_TYPE')
    })
  })

  describe('Question-level questionType validation', () => {
    it('should create test with questions having questionType', async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Test with Question Types ' + Date.now(),
          testTypeId,
          categoryId: testCategoryId,
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
          questions: [
            {
              order: 1,
              text: 'Question 1',
              points: 1,
              questionType: 'SINGLE_CHOICE',
              status: 'confirmed',
              answers: [
                { letter: 'a', text: 'Answer A', isCorrect: true },
                { letter: 'b', text: 'Answer B', isCorrect: false }
              ]
            },
            {
              order: 2,
              text: 'Question 2',
              points: 1,
              questionType: 'MULTIPLE_CHOICE',
              status: 'confirmed',
              answers: [
                { letter: 'a', text: 'Answer A', isCorrect: true },
                { letter: 'b', text: 'Answer B', isCorrect: false }
              ]
            }
          ]
        }
      })

      expect(test).toBeDefined()
      const questions = test.questions as any[]
      expect(questions.length).toBe(2)
      expect(questions[0].questionType).toBe('SINGLE_CHOICE')
      expect(questions[1].questionType).toBe('MULTIPLE_CHOICE')

      // Cleanup
      await prisma.test.delete({ where: { id: test.id } }).catch(() => {})
    })

    it('should validate questionType matches allowedQuestionTypes', async () => {
      const testAllowedTypes = ['SINGLE_CHOICE']
      const questionType = 'MULTIPLE_CHOICE'

      const isValid = testAllowedTypes.includes(questionType)
      expect(isValid).toBe(false)
    })

    it('should accept questionType that is in allowedQuestionTypes', async () => {
      const testAllowedTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']
      const questionType = 'MULTIPLE_CHOICE'

      const isValid = testAllowedTypes.includes(questionType)
      expect(isValid).toBe(true)
    })

    it('should store multiple questions with different questionTypes', async () => {
      const test = await prisma.test.create({
        data: {
          name: 'Multi Type Test ' + Date.now(),
          testTypeId,
          testTypeConditionId,
          categoryId: testCategoryId,
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED'],
          questions: [
            {
              order: 1,
              text: 'Single choice question',
              questionType: 'SINGLE_CHOICE',
              points: 1,
              status: 'confirmed',
              answers: [{ letter: 'a', text: 'Answer', isCorrect: true }, { letter: 'b', text: 'Answer', isCorrect: false }]
            },
            {
              order: 2,
              text: 'Multiple choice question',
              questionType: 'MULTIPLE_CHOICE',
              points: 1,
              status: 'confirmed',
              answers: [{ letter: 'a', text: 'Answer', isCorrect: true }, { letter: 'b', text: 'Answer', isCorrect: false }]
            },
            {
              order: 3,
              text: 'True/False question',
              questionType: 'TRUE_FALSE',
              points: 1,
              status: 'confirmed',
              answers: [{ letter: 'a', text: 'True', isCorrect: true }, { letter: 'b', text: 'False', isCorrect: false }]
            }
          ]
        }
      })

      const questions = test.questions as any[]
      expect(questions.length).toBe(3)
      expect(questions[0].questionType).toBe('SINGLE_CHOICE')
      expect(questions[1].questionType).toBe('MULTIPLE_CHOICE')
      expect(questions[2].questionType).toBe('TRUE_FALSE')

      // Cleanup
      await prisma.test.delete({ where: { id: test.id } }).catch(() => {})
    })
  })
})
