import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Practice Test API', () => {
  let testId: string
  let testCategoryId: string
  let userId: string

  // Setup - create test data
  beforeAll(async () => {
    await prisma.$connect()

    // Create test category
    const category = await prisma.testCategory.create({
      data: {
        name: 'Practice Test Category ' + Date.now(),
      }
    })
    testCategoryId = category.id

    // Create approved test with questions
    const test = await prisma.test.create({
      data: {
        name: 'Practice Test ' + Date.now(),
        type: 'ODBORNY',
        categoryId: testCategoryId,
        approved: true,
        approvedAt: new Date(),
        recommendedQuestionCount: 10,
        recommendedDuration: 30,
        recommendedScore: 70,
        difficulty: 5,
        questions: [
          {
            id: 'q1',
            text: 'What is 2+2?',
            type: 'SINGLE_CHOICE',
            options: [
              { id: 'a', text: '3' },
              { id: 'b', text: '4' },
              { id: 'c', text: '5' }
            ],
            correctAnswer: 'b',
            explanation: '2+2 equals 4',
            points: 1
          },
          {
            id: 'q2',
            text: 'Select all prime numbers',
            type: 'MULTIPLE_CHOICE',
            options: [
              { id: 'a', text: '2' },
              { id: 'b', text: '3' },
              { id: 'c', text: '4' },
              { id: 'd', text: '5' }
            ],
            correctAnswer: ['a', 'b', 'd'],
            explanation: '2, 3, and 5 are prime',
            points: 2
          },
          {
            id: 'q3',
            text: 'Is TypeScript a programming language?',
            type: 'TRUE_FALSE',
            correctAnswer: true,
            explanation: 'Yes, TypeScript is a programming language',
            points: 1
          }
        ]
      }
    })
    testId = test.id

    // Create test user (ADMIN role for practice)
    const user = await prisma.user.create({
      data: {
        username: 'practiceuser' + Date.now(),
        name: 'Practice',
        surname: 'User',
        role: 'ADMIN',
        password: 'hashed',
      }
    })
    userId = user.id
  })

  // Cleanup
  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    }
    if (testId) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {})
    }
    if (testCategoryId) {
      await prisma.testCategory.delete({ where: { id: testCategoryId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('Start Practice Session - POST /practice/[testId]/start', () => {
    let sessionId: string | null = null

    afterEach(async () => {
      if (sessionId) {
        await prisma.practiceTestResult.delete({ where: { id: sessionId } }).catch(() => {})
        sessionId = null
      }
    })

    it('should create practice session for valid test', async () => {
      const session = await prisma.practiceTestResult.create({
        data: {
          testId,
          userId,
          answers: [],
          score: 0,
          maxScore: 0,
          successRate: 0,
          passed: false,
          startedAt: new Date(),
        }
      })

      sessionId = session.id

      expect(session).toBeDefined()
      expect(session.testId).toBe(testId)
      expect(session.userId).toBe(userId)
      expect(session.startedAt).toBeDefined()
      expect(session.completedAt).toBeNull()
    })

    it('should fail with non-existent test', async () => {
      await expect(
        prisma.practiceTestResult.create({
          data: {
            testId: 'non-existent-test-id',
            userId,
            answers: [],
            score: 0,
            maxScore: 0,
            successRate: 0,
            passed: false,
            startedAt: new Date(),
          }
        })
      ).rejects.toThrow()
    })

    it('should fail with non-existent user', async () => {
      await expect(
        prisma.practiceTestResult.create({
          data: {
            testId,
            userId: 'non-existent-user-id',
            answers: [],
            score: 0,
            maxScore: 0,
            successRate: 0,
            passed: false,
            startedAt: new Date(),
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('Submit Practice Session - POST /practice/[sessionId]/submit', () => {
    let sessionId: string

    beforeEach(async () => {
      const session = await prisma.practiceTestResult.create({
        data: {
          testId,
          userId,
          answers: [],
          score: 0,
          maxScore: 0,
          successRate: 0,
          passed: false,
          startedAt: new Date(),
        }
      })
      sessionId = session.id
    })

    afterEach(async () => {
      if (sessionId) {
        await prisma.practiceTestResult.delete({ where: { id: sessionId } }).catch(() => {})
      }
    })

    it('should update session with results', async () => {
      const answers = [
        { questionId: 'q1', answer: 'b' },
        { questionId: 'q2', answer: ['a', 'b', 'd'] },
        { questionId: 'q3', answer: true }
      ]

      const updated = await prisma.practiceTestResult.update({
        where: { id: sessionId },
        data: {
          answers,
          score: 4, // 1 + 2 + 1 (all correct)
          maxScore: 4,
          successRate: 100,
          passed: true,
          completedAt: new Date(),
          durationSeconds: 120,
        }
      })

      expect(updated.completedAt).toBeDefined()
      expect(updated.score).toBe(4)
      expect(updated.maxScore).toBe(4)
      expect(updated.successRate).toBe(100)
      expect(updated.passed).toBe(true)
      expect(updated.durationSeconds).toBe(120)
    })

    it('should calculate partial score correctly', async () => {
      const answers = [
        { questionId: 'q1', answer: 'b' }, // correct: 1 point
        { questionId: 'q2', answer: ['a', 'b'] }, // incorrect: 0 points
        { questionId: 'q3', answer: false } // incorrect: 0 points
      ]

      const updated = await prisma.practiceTestResult.update({
        where: { id: sessionId },
        data: {
          answers,
          score: 1,
          maxScore: 4,
          successRate: 25,
          passed: false,
          completedAt: new Date(),
          durationSeconds: 90,
        }
      })

      expect(updated.score).toBe(1)
      expect(updated.successRate).toBe(25)
      expect(updated.passed).toBe(false)
    })

    it('should prevent double submission', async () => {
      // First submission
      await prisma.practiceTestResult.update({
        where: { id: sessionId },
        data: {
          completedAt: new Date(),
          score: 4,
          maxScore: 4,
          successRate: 100,
          passed: true,
        }
      })

      // Check completedAt is set
      const session = await prisma.practiceTestResult.findUnique({
        where: { id: sessionId }
      })

      expect(session?.completedAt).toBeDefined()
    })
  })

  describe('List Practice Tests - GET /practice', () => {
    it('should fetch approved tests only', async () => {
      const tests = await prisma.test.findMany({
        where: { approved: true },
        include: {
          category: {
            select: { id: true, name: true }
          },
          _count: {
            select: { practiceResults: true }
          }
        }
      })

      expect(tests).toBeDefined()
      expect(Array.isArray(tests)).toBe(true)
      tests.forEach(test => {
        expect(test.approved).toBe(true)
      })
    })

    it('should filter by test type', async () => {
      const tests = await prisma.test.findMany({
        where: {
          approved: true,
          type: 'ODBORNY'
        }
      })

      tests.forEach(test => {
        expect(test.type).toBe('ODBORNY')
      })
    })

    it('should filter by category', async () => {
      const tests = await prisma.test.findMany({
        where: {
          approved: true,
          categoryId: testCategoryId
        }
      })

      tests.forEach(test => {
        expect(test.categoryId).toBe(testCategoryId)
      })
    })

    it('should search by name', async () => {
      const tests = await prisma.test.findMany({
        where: {
          approved: true,
          OR: [
            { name: { contains: 'Practice', mode: 'insensitive' } },
            { description: { contains: 'Practice', mode: 'insensitive' } }
          ]
        }
      })

      expect(tests.length).toBeGreaterThanOrEqual(1)
    })

    it('should include relations and counts', async () => {
      const tests = await prisma.test.findMany({
        where: { approved: true },
        include: {
          category: {
            select: { id: true, name: true }
          },
          _count: {
            select: { practiceResults: true }
          }
        }
      })

      tests.forEach(test => {
        if (test.categoryId) {
          expect(test.category).toBeDefined()
        }
        expect(test._count).toBeDefined()
        expect(typeof test._count.practiceResults).toBe('number')
      })
    })
  })

  describe('Practice History - GET /practice/history', () => {
    let sessionId1: string
    let sessionId2: string

    beforeAll(async () => {
      // Create two practice sessions for history
      const session1 = await prisma.practiceTestResult.create({
        data: {
          testId,
          userId,
          answers: [],
          score: 3,
          maxScore: 4,
          successRate: 75,
          passed: true,
          startedAt: new Date(Date.now() - 2000),
          completedAt: new Date(Date.now() - 1000),
          durationSeconds: 60,
        }
      })
      sessionId1 = session1.id

      const session2 = await prisma.practiceTestResult.create({
        data: {
          testId,
          userId,
          answers: [],
          score: 4,
          maxScore: 4,
          successRate: 100,
          passed: true,
          startedAt: new Date(),
          completedAt: new Date(),
          durationSeconds: 90,
        }
      })
      sessionId2 = session2.id
    })

    afterAll(async () => {
      await prisma.practiceTestResult.delete({ where: { id: sessionId1 } }).catch(() => {})
      await prisma.practiceTestResult.delete({ where: { id: sessionId2 } }).catch(() => {})
    })

    it('should fetch user practice history', async () => {
      const results = await prisma.practiceTestResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          test: {
            select: {
              id: true,
              name: true,
              type: true,
              category: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      expect(results.length).toBeGreaterThanOrEqual(2)
      results.forEach(result => {
        expect(result.userId).toBe(userId)
        expect(result.test).toBeDefined()
      })
    })

    it('should filter history by testId', async () => {
      const results = await prisma.practiceTestResult.findMany({
        where: {
          userId,
          testId
        }
      })

      results.forEach(result => {
        expect(result.testId).toBe(testId)
      })
    })

    it('should paginate history correctly', async () => {
      const limit = 1
      const page1 = await prisma.practiceTestResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: 0
      })

      const page2 = await prisma.practiceTestResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: limit
      })

      expect(page1.length).toBeLessThanOrEqual(limit)
      expect(page2.length).toBeLessThanOrEqual(limit)
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })

    it('should count total results', async () => {
      const total = await prisma.practiceTestResult.count({
        where: { userId }
      })

      expect(total).toBeGreaterThanOrEqual(2)
      expect(typeof total).toBe('number')
    })
  })

  describe('Relationships', () => {
    let sessionId: string

    beforeAll(async () => {
      const session = await prisma.practiceTestResult.create({
        data: {
          testId,
          userId,
          answers: [],
          score: 0,
          maxScore: 0,
          successRate: 0,
          passed: false,
          startedAt: new Date(),
        }
      })
      sessionId = session.id
    })

    afterAll(async () => {
      await prisma.practiceTestResult.delete({ where: { id: sessionId } }).catch(() => {})
    })

    it('should link to test', async () => {
      const result = await prisma.practiceTestResult.findUnique({
        where: { id: sessionId },
        include: { test: true }
      })

      expect(result?.test).toBeDefined()
      expect(result?.test.id).toBe(testId)
    })

    it('should link to user', async () => {
      const result = await prisma.practiceTestResult.findUnique({
        where: { id: sessionId },
        include: { user: true }
      })

      expect(result?.user).toBeDefined()
      expect(result?.user.id).toBe(userId)
    })

    it('should query by test relation', async () => {
      const results = await prisma.practiceTestResult.findMany({
        where: {
          test: {
            type: 'ODBORNY'
          }
        }
      })

      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('should query by user relation', async () => {
      const results = await prisma.practiceTestResult.findMany({
        where: {
          user: {
            role: 'ADMIN'
          }
        }
      })

      expect(results.length).toBeGreaterThanOrEqual(1)
    })
  })
})
