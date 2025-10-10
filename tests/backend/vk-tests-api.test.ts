import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('VK Tests API', () => {
  let institutionId: string
  let userId: string
  let vkId: string
  let testCategoryId: string
  let test1Id: string
  let test2Id: string
  let vkTest1Id: string

  beforeAll(async () => {
    await prisma.$connect()

    // Get first institution
    const institution = await prisma.institution.findFirst()
    if (!institution) {
      throw new Error('No institution found in DB - run seed first')
    }
    institutionId = institution.id

    // Get first user (for createdBy)
    const user = await prisma.user.findFirst()
    if (!user) {
      throw new Error('No user found in DB - run seed first')
    }
    userId = user.id

    // Create test category
    const category = await prisma.testCategory.create({
      data: {
        name: 'VK Tests Category ' + Date.now(),
        description: 'Test category for VK tests API'
      }
    })
    testCategoryId = category.id

    // Create two tests
    const test1 = await prisma.test.create({
      data: {
        name: 'VK Test 1 ' + Date.now(),
        type: 'ODBORNY',
        categoryId: testCategoryId,
        questions: [
          {
            id: 'q1',
            text: 'Question 1?',
            type: 'SINGLE_CHOICE',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' }
            ],
            correctAnswer: 'a'
          },
          {
            id: 'q2',
            text: 'Question 2?',
            type: 'SINGLE_CHOICE',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' }
            ],
            correctAnswer: 'b'
          },
          {
            id: 'q3',
            text: 'Question 3?',
            type: 'TRUE_FALSE',
            correctAnswer: 'true'
          },
          {
            id: 'q4',
            text: 'Question 4?',
            type: 'TRUE_FALSE',
            correctAnswer: 'false'
          },
          {
            id: 'q5',
            text: 'Question 5?',
            type: 'SINGLE_CHOICE',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' }
            ],
            correctAnswer: 'a'
          }
        ],
        approved: true
      }
    })
    test1Id = test1.id

    const test2 = await prisma.test.create({
      data: {
        name: 'VK Test 2 ' + Date.now(),
        type: 'VSEOBECNY',
        categoryId: testCategoryId,
        questions: [
          {
            id: 'q1',
            text: 'Question 1?',
            type: 'SINGLE_CHOICE',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' }
            ],
            correctAnswer: 'a'
          },
          {
            id: 'q2',
            text: 'Question 2?',
            type: 'SINGLE_CHOICE',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' }
            ],
            correctAnswer: 'b'
          }
        ],
        approved: true
      }
    })
    test2Id = test2.id

    // Create VK
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: 'VK/' + new Date().getFullYear() + '/' + Date.now(),
        institution: {
          connect: { id: institutionId }
        },
        selectionType: 'SIRSIE_VNUTORNE',
        organizationalUnit: 'Test Unit',
        serviceField: 'IT',
        position: 'Test Position',
        serviceType: 'STALA',
        date: new Date(),
        status: 'PRIPRAVA',
        createdBy: {
          connect: { id: userId }
        }
      }
    })
    vkId = vk.id
  })

  afterAll(async () => {
    // Cleanup
    if (vkId) {
      await prisma.vyberoveKonanie.delete({ where: { id: vkId } }).catch(() => {})
    }
    if (test1Id) {
      await prisma.test.delete({ where: { id: test1Id } }).catch(() => {})
    }
    if (test2Id) {
      await prisma.test.delete({ where: { id: test2Id } }).catch(() => {})
    }
    if (testCategoryId) {
      await prisma.testCategory.delete({ where: { id: testCategoryId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Cleanup VKTests after each test
    if (vkTest1Id) {
      await prisma.vKTest.delete({ where: { id: vkTest1Id } }).catch(() => {})
      vkTest1Id = ''
    }
  })

  describe('VKTest CRUD Operations', () => {
    it('should create VKTest successfully', async () => {
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3,
          questionSelectionMode: 'RANDOM'
        },
        include: {
          test: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      })

      expect(vkTest).toBeDefined()
      expect(vkTest.level).toBe(1)
      expect(vkTest.questionCount).toBe(5)
      expect(vkTest.durationMinutes).toBe(10)
      expect(vkTest.scorePerQuestion).toBe(1)
      expect(vkTest.minScore).toBe(3)
      expect(vkTest.questionSelectionMode).toBe('RANDOM')

      vkTest1Id = vkTest.id
    })

    it('should list VKTests ordered by level', async () => {
      // Create level 1
      const vkTest1 = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3,
          questionSelectionMode: 'RANDOM'
        }
      })
      vkTest1Id = vkTest1.id

      // Create level 2
      const vkTest2 = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test2Id,
          level: 2,
          questionCount: 2,
          durationMinutes: 5,
          scorePerQuestion: 0.5,
          minScore: 1,
          questionSelectionMode: 'SEQUENTIAL'
        }
      })

      // Get tests
      const vkTests = await prisma.vKTest.findMany({
        where: { vkId },
        orderBy: { level: 'asc' },
        include: {
          test: {
            select: {
              id: true,
              name: true,
              type: true,
              questions: true
            }
          }
        }
      })

      expect(vkTests).toHaveLength(2)
      expect(vkTests[0].level).toBe(1)
      expect(vkTests[1].level).toBe(2)

      // Cleanup level 2
      await prisma.vKTest.delete({ where: { id: vkTest2.id } })
    })

    it('should update VKTest', async () => {
      // Create VKTest
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3,
          questionSelectionMode: 'RANDOM'
        }
      })
      vkTest1Id = vkTest.id

      // Update questionCount
      const updated = await prisma.vKTest.update({
        where: { id: vkTest1Id },
        data: {
          questionCount: 4,
          durationMinutes: 15
        }
      })

      expect(updated.questionCount).toBe(4)
      expect(updated.durationMinutes).toBe(15)
    })

    it('should delete VKTest', async () => {
      // Create VKTest
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        }
      })

      // Delete
      await prisma.vKTest.delete({
        where: { id: vkTest.id }
      })

      // Verify deleted
      const deleted = await prisma.vKTest.findUnique({
        where: { id: vkTest.id }
      })

      expect(deleted).toBeNull()
    })
  })

  describe('VKTest Validation', () => {
    it('should enforce unique level per VK constraint', async () => {
      // Create level 1
      const vkTest1 = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        }
      })
      vkTest1Id = vkTest1.id

      // Try to create another level 1
      await expect(
        prisma.vKTest.create({
          data: {
            vkId,
            testId: test2Id,
            level: 1,
            questionCount: 2,
            durationMinutes: 5,
            scorePerQuestion: 0.5,
            minScore: 1
          }
        })
      ).rejects.toThrow()
    })

    it('should allow different VK to have same level', async () => {
      // Create another VK
      const vk2 = await prisma.vyberoveKonanie.create({
        data: {
          identifier: 'VK/' + new Date().getFullYear() + '/' + (Date.now() + 1),
          institution: {
          connect: { id: institutionId }
        },
          selectionType: 'SIRSIE_VNUTORNE',
          organizationalUnit: 'Test Unit 2',
          serviceField: 'IT',
          position: 'Test Position 2',
          serviceType: 'STALA',
          date: new Date(),
          status: 'PRIPRAVA'
        }
      })

      // Create level 1 for first VK
      const vkTest1 = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        }
      })
      vkTest1Id = vkTest1.id

      // Create level 1 for second VK - should work
      const vkTest2 = await prisma.vKTest.create({
        data: {
          vkId: vk2.id,
          testId: test2Id,
          level: 1,
          questionCount: 2,
          durationMinutes: 5,
          scorePerQuestion: 0.5,
          minScore: 1
        }
      })

      expect(vkTest2).toBeDefined()
      expect(vkTest2.level).toBe(1)

      // Cleanup
      await prisma.vKTest.delete({ where: { id: vkTest2.id } })
      await prisma.vyberoveKonanie.delete({ where: { id: vk2.id } })
    })

    it('should cascade delete VKTests when VK is deleted', async () => {
      // Create temporary VK
      const tempVk = await prisma.vyberoveKonanie.create({
        data: {
          identifier: 'VK/' + new Date().getFullYear() + '/' + (Date.now() + 2),
          institution: {
          connect: { id: institutionId }
        },
          selectionType: 'SIRSIE_VNUTORNE',
          organizationalUnit: 'Temp Unit',
          serviceField: 'IT',
          position: 'Temp Position',
          serviceType: 'STALA',
          date: new Date(),
          status: 'PRIPRAVA'
        }
      })

      // Create VKTest for temp VK
      const tempVkTest = await prisma.vKTest.create({
        data: {
          vkId: tempVk.id,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        }
      })

      // Delete VK
      await prisma.vyberoveKonanie.delete({
        where: { id: tempVk.id }
      })

      // Verify VKTest is also deleted
      const deletedVkTest = await prisma.vKTest.findUnique({
        where: { id: tempVkTest.id }
      })

      expect(deletedVkTest).toBeNull()
    })
  })

  describe('VKTest Business Logic', () => {
    it('should store scorePerQuestion as decimal (0.5 or 1)', async () => {
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 0.5,
          minScore: 2
        }
      })
      vkTest1Id = vkTest.id

      expect(vkTest.scorePerQuestion).toBe(0.5)
    })

    it('should calculate maxScore correctly (questionCount * scorePerQuestion)', async () => {
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 10,
          durationMinutes: 10,
          scorePerQuestion: 0.5,
          minScore: 3
        }
      })
      vkTest1Id = vkTest.id

      const maxScore = vkTest.questionCount * vkTest.scorePerQuestion
      expect(maxScore).toBe(5)  // 10 * 0.5
    })

    it('should support different question selection modes', async () => {
      const modes = ['RANDOM', 'SEQUENTIAL', 'MANUAL']

      for (let i = 0; i < modes.length; i++) {
        const mode = modes[i]

        // Create temp VK for each mode
        const tempVk = await prisma.vyberoveKonanie.create({
          data: {
            identifier: 'VK/' + new Date().getFullYear() + '/' + (Date.now() + i + 10),
            institution: {
          connect: { id: institutionId }
        },
            selectionType: 'SIRSIE_VNUTORNE',
            organizationalUnit: 'Test Unit',
            serviceField: 'IT',
            position: 'Test Position',
            serviceType: 'STALA',
            date: new Date(),
            status: 'PRIPRAVA'
          }
        })

        const vkTest = await prisma.vKTest.create({
          data: {
            vkId: tempVk.id,
            testId: test1Id,
            level: 1,
            questionCount: 5,
            durationMinutes: 10,
            scorePerQuestion: 1,
            minScore: 3,
            questionSelectionMode: mode
          }
        })

        expect(vkTest.questionSelectionMode).toBe(mode)

        // Cleanup
        await prisma.vyberoveKonanie.delete({ where: { id: tempVk.id } })
      }
    })

    it('should default questionSelectionMode to RANDOM if not specified', async () => {
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        }
      })
      vkTest1Id = vkTest.id

      expect(vkTest.questionSelectionMode).toBe('RANDOM')
    })
  })

  describe('VKTest Relations', () => {
    it('should relate to Test', async () => {
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        },
        include: {
          test: true
        }
      })
      vkTest1Id = vkTest.id

      expect(vkTest.test).toBeDefined()
      expect(vkTest.test.id).toBe(test1Id)
    })

    it('should relate to VK', async () => {
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        },
        include: {
          vk: true
        }
      })
      vkTest1Id = vkTest.id

      expect(vkTest.vk).toBeDefined()
      expect(vkTest.vk.id).toBe(vkId)
    })

    it('should allow querying VK with assigned tests', async () => {
      // Create VKTest
      const vkTest = await prisma.vKTest.create({
        data: {
          vkId,
          testId: test1Id,
          level: 1,
          questionCount: 5,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 3
        }
      })
      vkTest1Id = vkTest.id

      // Query VK with tests
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: vkId },
        include: {
          tests: {
            include: {
              test: true
            }
          }
        }
      })

      expect(vk).toBeDefined()
      expect(vk!.tests).toHaveLength(1)
      expect(vk!.tests[0].testId).toBe(test1Id)
    })
  })
})
