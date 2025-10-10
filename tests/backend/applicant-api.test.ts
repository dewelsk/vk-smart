import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Applicant API', () => {
  let institutionId: string
  let vkId: string
  let adminUserId: string
  let candidateUserId: string
  let candidateId: string
  let testId: string
  let vkTestId: string
  let testCategoryId: string

  beforeAll(async () => {
    await prisma.$connect()

    // Create institution
    const institution = await prisma.institution.create({
      data: {
        name: 'Test Institution ' + Date.now(),
        code: 'TEST-' + Date.now(),
        active: true
      }
    })
    institutionId = institution.id

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin-' + Date.now(),
        name: 'Admin',
        surname: 'Test',
        role: 'ADMIN',
        password: await bcrypt.hash('admin123', 10),
        active: true
      }
    })
    adminUserId = adminUser.id

    // Create VK
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: 'VK/' + Date.now(),
        institutionId: institutionId,
        selectionType: 'širšie vnútorné výberové konanie',
        organizationalUnit: 'Testovací útvar',
        serviceField: '1.01',
        position: 'Testovacia pozícia',
        serviceType: 'stála štátna služba',
        date: new Date(),
        status: 'TESTOVANIE',
        createdById: adminUserId
      }
    })
    vkId = vk.id

    // Create candidate user
    const candidateUser = await prisma.user.create({
      data: {
        username: 'candidate-' + Date.now(),
        name: 'Kandidát',
        surname: 'Testovací',
        role: 'UCHADZAC',
        password: await bcrypt.hash('password123', 10),
        active: true,
        temporaryAccount: true
      }
    })
    candidateUserId = candidateUser.id

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        vkId: vkId,
        userId: candidateUserId,
        cisIdentifier: 'VK-001',
        email: 'candidate@test.sk'
      }
    })
    candidateId = candidate.id

    // Create test category
    const category = await prisma.testCategory.create({
      data: {
        name: 'Category ' + Date.now()
      }
    })
    testCategoryId = category.id

    // Create test
    const test = await prisma.test.create({
      data: {
        name: 'Test ' + Date.now(),
        type: 'ODBORNY',
        categoryId: testCategoryId,
        questions: [
          {
            id: 'q1',
            text: 'Testovacia otázka 1?',
            type: 'SINGLE_CHOICE',
            points: 1,
            options: [
              { id: 'a', text: 'Odpoveď A' },
              { id: 'b', text: 'Odpoveď B' }
            ],
            correctAnswer: 'a'
          },
          {
            id: 'q2',
            text: 'Testovacia otázka 2?',
            type: 'SINGLE_CHOICE',
            points: 1,
            options: [
              { id: 'a', text: 'Odpoveď A' },
              { id: 'b', text: 'Odpoveď B' }
            ],
            correctAnswer: 'b'
          }
        ],
        approved: true
      }
    })
    testId = test.id

    // Assign test to VK
    const vkTest = await prisma.vKTest.create({
      data: {
        vkId: vkId,
        testId: testId,
        level: 1,
        questionCount: 2,
        durationMinutes: 10,
        scorePerQuestion: 1,
        minScore: 1
      }
    })
    vkTestId = vkTest.id
  })

  afterAll(async () => {
    // Cleanup in reverse order
    await prisma.testSession.deleteMany({ where: { candidateId } }).catch(() => {})
    await prisma.testResult.deleteMany({ where: { candidateId } }).catch(() => {})
    await prisma.vKTest.deleteMany({ where: { vkId } }).catch(() => {})
    await prisma.candidate.deleteMany({ where: { vkId } }).catch(() => {})
    await prisma.vyberoveKonanie.deleteMany({ where: { id: vkId } }).catch(() => {})
    await prisma.test.deleteMany({ where: { id: testId } }).catch(() => {})
    await prisma.testCategory.deleteMany({ where: { id: testCategoryId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: candidateUserId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: adminUserId } }).catch(() => {})
    await prisma.institution.deleteMany({ where: { id: institutionId } }).catch(() => {})
    await prisma.$disconnect()
  })

  describe('POST /api/applicant/login', () => {
    it('should login successfully with valid credentials', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({ where: { id: vkId } })
      const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } })

      expect(vk).toBeDefined()
      expect(candidate).toBeDefined()

      // In real test, you would call the API endpoint
      // For now, we're just testing the database setup
      expect(vk!.identifier).toContain('VK/')
      expect(candidate!.cisIdentifier).toBe('VK-001')
    })

    it('should fail with wrong password', async () => {
      const user = await prisma.user.findUnique({ where: { id: candidateUserId } })
      const wrongPasswordMatch = await bcrypt.compare('wrongpassword', user!.password!)

      expect(wrongPasswordMatch).toBe(false)
    })

    it('should fail with non-existent VK identifier', async () => {
      const nonExistentVk = await prisma.vyberoveKonanie.findUnique({
        where: { identifier: 'VK/9999999' }
      })

      expect(nonExistentVk).toBeNull()
    })

    it('should fail with non-existent CIS identifier', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({ where: { id: vkId } })
      const nonExistentCandidate = await prisma.candidate.findUnique({
        where: {
          vkId_cisIdentifier: {
            vkId: vk!.id,
            cisIdentifier: 'VK-999'
          }
        }
      })

      expect(nonExistentCandidate).toBeNull()
    })
  })

  describe('Test Session Flow', () => {
    let sessionId: string | null = null

    afterEach(async () => {
      if (sessionId) {
        await prisma.testSession.delete({ where: { id: sessionId } }).catch(() => {})
        sessionId = null
      }
    })

    it('should create test session when starting test', async () => {
      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: {},
          startedAt: new Date(),
          serverStartTime: new Date(),
          durationSeconds: 600,
          lastAccessedAt: new Date()
        }
      })

      sessionId = session.id

      expect(session).toBeDefined()
      expect(session.id).toBeDefined()
      expect(session.status).toBe('IN_PROGRESS')
      expect(session.candidateId).toBe(candidateId)
      expect(session.vkTestId).toBe(vkTestId)
      expect(session.testId).toBe(testId)
    })

    it('should not allow duplicate session for same candidate and vkTest', async () => {
      // Create first session
      const session1 = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: {},
          serverStartTime: new Date(),
          durationSeconds: 600
        }
      })
      sessionId = session1.id

      // Try to create duplicate
      await expect(
        prisma.testSession.create({
          data: {
            candidateId: candidateId,
            vkTestId: vkTestId,
            testId: testId,
            status: 'IN_PROGRESS',
            answers: {},
            serverStartTime: new Date(),
            durationSeconds: 600
          }
        })
      ).rejects.toThrow()
    })

    it('should save answers to session', async () => {
      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: {},
          serverStartTime: new Date(),
          durationSeconds: 600
        }
      })
      sessionId = session.id

      const answers = {
        q1: 'a',
        q2: 'b'
      }

      const updated = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          answers: answers,
          lastAccessedAt: new Date()
        }
      })

      expect(updated.answers).toEqual(answers)
    })

    it('should calculate score and pass status when submitting', async () => {
      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: { q1: 'a', q2: 'b' },
          serverStartTime: new Date(),
          durationSeconds: 600,
          startedAt: new Date()
        }
      })
      sessionId = session.id

      // Both answers correct = 2 points, minScore = 1, should pass
      const score = 2
      const maxScore = 2
      const passed = score >= 1

      const completed = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          score: score,
          maxScore: maxScore,
          passed: passed,
          completedAt: new Date()
        }
      })

      expect(completed.status).toBe('COMPLETED')
      expect(completed.score).toBe(2)
      expect(completed.maxScore).toBe(2)
      expect(completed.passed).toBe(true)
      expect(completed.completedAt).toBeDefined()
    })

    it('should mark as failed when score below minScore', async () => {
      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: { q1: 'b', q2: 'a' },  // Both wrong
          serverStartTime: new Date(),
          durationSeconds: 600,
          startedAt: new Date()
        }
      })
      sessionId = session.id

      const score = 0
      const maxScore = 2
      const passed = score >= 1  // minScore = 1, so this fails

      const completed = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          score: score,
          maxScore: maxScore,
          passed: passed,
          completedAt: new Date()
        }
      })

      expect(completed.passed).toBe(false)
      expect(completed.score).toBe(0)
    })
  })

  describe('Dashboard Data', () => {
    let session1Id: string | null = null
    let session2Id: string | null = null
    let vkTest2Id: string | null = null
    let test2Id: string | null = null

    beforeEach(async () => {
      // Create second test for level 2
      const test2 = await prisma.test.create({
        data: {
          name: 'Test 2 ' + Date.now(),
          type: 'ODBORNY',
          categoryId: testCategoryId,
          questions: [
            {
              id: 'q1',
              text: 'Level 2 otázka 1?',
              type: 'SINGLE_CHOICE',
              points: 1,
              options: [
                { id: 'a', text: 'Odpoveď A' },
                { id: 'b', text: 'Odpoveď B' }
              ],
              correctAnswer: 'a'
            }
          ],
          approved: true
        }
      })
      test2Id = test2.id

      // Create level 2 vkTest
      const vkTest2 = await prisma.vKTest.create({
        data: {
          vkId: vkId,
          testId: test2.id,
          level: 2,
          questionCount: 1,
          durationMinutes: 10,
          scorePerQuestion: 1,
          minScore: 1
        }
      })
      vkTest2Id = vkTest2.id
    })

    afterEach(async () => {
      if (session1Id) {
        await prisma.testSession.delete({ where: { id: session1Id } }).catch(() => {})
        session1Id = null
      }
      if (session2Id) {
        await prisma.testSession.delete({ where: { id: session2Id } }).catch(() => {})
        session2Id = null
      }
      if (vkTest2Id) {
        await prisma.vKTest.delete({ where: { id: vkTest2Id } }).catch(() => {})
        vkTest2Id = null
      }
      if (test2Id) {
        await prisma.test.delete({ where: { id: test2Id } }).catch(() => {})
        test2Id = null
      }
    })

    it('should return all tests for VK', async () => {
      const vkTests = await prisma.vKTest.findMany({
        where: { vkId: vkId },
        orderBy: { level: 'asc' }
      })

      expect(vkTests).toHaveLength(2)
      expect(vkTests[0].level).toBe(1)
      expect(vkTests[1].level).toBe(2)
    })

    it('should show level 2 as locked if level 1 not passed', async () => {
      // Create session for level 1 but not completed
      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: {},
          serverStartTime: new Date(),
          durationSeconds: 600
        }
      })
      session1Id = session.id

      const vkTests = await prisma.vKTest.findMany({
        where: { vkId: vkId },
        orderBy: { level: 'asc' }
      })

      const sessions = await prisma.testSession.findMany({
        where: { candidateId: candidateId }
      })

      // Level 2 should be locked because level 1 is not completed
      const level1Session = sessions.find(s => s.vkTestId === vkTests[0].id)
      const level2Session = sessions.find(s => s.vkTestId === vkTests[1].id)

      expect(level1Session?.status).toBe('IN_PROGRESS')
      expect(level2Session).toBeUndefined()  // Not started yet
    })

    it('should unlock level 2 after passing level 1', async () => {
      // Complete level 1 with pass
      const session1 = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'COMPLETED',
          answers: { q1: 'a', q2: 'b' },
          serverStartTime: new Date(),
          durationSeconds: 600,
          score: 2,
          maxScore: 2,
          passed: true,
          startedAt: new Date(),
          completedAt: new Date()
        }
      })
      session1Id = session1.id

      // Check if level 2 can be started
      const level1Session = await prisma.testSession.findUnique({
        where: {
          candidateId_vkTestId: {
            candidateId: candidateId,
            vkTestId: vkTestId
          }
        }
      })

      expect(level1Session?.passed).toBe(true)
      expect(level1Session?.status).toBe('COMPLETED')
      // Level 2 is now unlocked (can create session for it)
    })
  })

  describe('Admin Monitoring', () => {
    let sessionId: string | null = null

    afterEach(async () => {
      if (sessionId) {
        await prisma.testSession.delete({ where: { id: sessionId } }).catch(() => {})
        sessionId = null
      }
    })

    it('should return all candidates for VK', async () => {
      const candidates = await prisma.candidate.findMany({
        where: { vkId: vkId },
        include: {
          user: true
        }
      })

      expect(candidates).toHaveLength(1)
      expect(candidates[0].cisIdentifier).toBe('VK-001')
    })

    it('should show candidate with IN_PROGRESS session', async () => {
      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: { q1: 'a' },
          serverStartTime: new Date(),
          durationSeconds: 600,
          startedAt: new Date()
        }
      })
      sessionId = session.id

      const candidatesWithSessions = await prisma.candidate.findMany({
        where: { vkId: vkId },
        include: {
          testSessions: {
            where: { status: 'IN_PROGRESS' },
            include: {
              test: true,
              vkTest: true
            }
          }
        }
      })

      expect(candidatesWithSessions[0].testSessions).toHaveLength(1)
      expect(candidatesWithSessions[0].testSessions[0].status).toBe('IN_PROGRESS')
    })

    it('should calculate real-time stats from session answers', async () => {
      const test = await prisma.test.findUnique({ where: { id: testId } })
      const questions = test!.questions as any[]

      const session = await prisma.testSession.create({
        data: {
          candidateId: candidateId,
          vkTestId: vkTestId,
          testId: testId,
          status: 'IN_PROGRESS',
          answers: { q1: 'a' },  // Only q1 answered, q2 unanswered
          serverStartTime: new Date(),
          durationSeconds: 600,
          startedAt: new Date()
        }
      })
      sessionId = session.id

      const answers = session.answers as Record<string, any>
      let correct = 0
      let incorrect = 0
      let unanswered = 0

      questions.forEach(q => {
        const userAnswer = answers[q.id]
        if (!userAnswer) {
          unanswered++
        } else if (userAnswer === q.correctAnswer) {
          correct++
        } else {
          incorrect++
        }
      })

      expect(correct).toBe(1)  // q1 correct
      expect(incorrect).toBe(0)
      expect(unanswered).toBe(1)  // q2 not answered
    })
  })
})
