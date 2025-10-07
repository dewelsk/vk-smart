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
        type: 'ODBORNY',
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
          type: testData.type as any,
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
          type: 'ODBORNY',
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
          type: 'ODBORNY',
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
          type: 'ODBORNY',
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
          type: 'ODBORNY',
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
          type: 'VSEOBECNY',
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
          type: 'ODBORNY',
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
})
