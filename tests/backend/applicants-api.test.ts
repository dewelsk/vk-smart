import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

describe('Applicants API', () => {
  let testVKId: string | null = null
  let testUserId: string | null = null
  let testApplicantId: string | null = null

  beforeAll(async () => {
    await prisma.$connect()

    // Create a test VK
    const institution = await prisma.institution.findFirst()
    const superadmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPERADMIN },
    })

    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: 'TEST-VK-' + Date.now(),
        institutionId: institution!.id,
        selectionType: 'Test',
        organizationalUnit: 'Test Unit',
        serviceField: 'Test Field',
        position: 'Test Position',
        serviceType: 'Test Type',
        date: new Date(),
        createdById: superadmin!.id,
      },
    })
    testVKId = vk.id

    // Create a test UCHADZAC user
    const user = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'Applicant',
        username: 'test.applicant.' + Date.now(),
        role: UserRole.UCHADZAC,
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Cleanup
    if (testApplicantId) {
      await prisma.candidate.delete({ where: { id: testApplicantId } })
    }
    if (testVKId) {
      await prisma.vyberoveKonanie.delete({ where: { id: testVKId } })
    }
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } })
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/applicants', () => {
    it('should fetch applicants list', async () => {
      const applicants = await prisma.candidate.findMany({
        where: { deleted: false },
        take: 10,
      })

      expect(applicants).toBeDefined()
      expect(Array.isArray(applicants)).toBe(true)
    })

    it('should exclude deleted applicants', async () => {
      const applicants = await prisma.candidate.findMany({
        where: { deleted: false },
      })

      expect(applicants.every(a => a.deleted === false)).toBe(true)
    })

    it('should filter applicants by VK', async () => {
      if (!testVKId) return

      const applicants = await prisma.candidate.findMany({
        where: {
          vkId: testVKId,
          deleted: false,
        },
      })

      expect(applicants).toBeDefined()
      expect(applicants.every(a => a.vkId === testVKId)).toBe(true)
    })

    it('should filter applicants by archived status', async () => {
      const archived = await prisma.candidate.findMany({
        where: {
          isArchived: true,
          deleted: false,
        },
      })

      expect(archived).toBeDefined()
      expect(archived.every(a => a.isArchived === true)).toBe(true)
    })

    it('should search applicants by CIS identifier', async () => {
      const searchTerm = 'TEST'
      const applicants = await prisma.candidate.findMany({
        where: {
          cisIdentifier: { contains: searchTerm, mode: 'insensitive' },
          deleted: false,
        },
      })

      expect(applicants).toBeDefined()
    })

    it('should include applicant user data', async () => {
      const applicants = await prisma.candidate.findMany({
        where: { deleted: false },
        include: {
          user: true,
        },
        take: 1,
      })

      if (applicants.length > 0) {
        expect(applicants[0].user).toBeDefined()
        expect(applicants[0].user.name).toBeDefined()
      }
    })

    it('should include VK data', async () => {
      const applicants = await prisma.candidate.findMany({
        where: { deleted: false },
        include: {
          vk: {
            include: {
              institution: true,
            },
          },
        },
        take: 1,
      })

      if (applicants.length > 0) {
        expect(applicants[0].vk).toBeDefined()
        expect(applicants[0].vk.institution).toBeDefined()
      }
    })
  })

  describe('POST /api/admin/applicants', () => {
    afterEach(async () => {
      if (testApplicantId) {
        await prisma.candidate.delete({ where: { id: testApplicantId } })
        testApplicantId = null
      }
    })

    it('should create a new applicant', async () => {
      const cisIdentifier = 'CIS-TEST-' + Date.now()

      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          userId: testUserId!,
          cisIdentifier,
        },
      })

      testApplicantId = applicant.id

      expect(applicant).toBeDefined()
      expect(applicant.vkId).toBe(testVKId)
      expect(applicant.userId).toBe(testUserId)
      expect(applicant.cisIdentifier).toBe(cisIdentifier)
    })

    it('should fail with duplicate CIS identifier for same VK', async () => {
      const cisIdentifier = 'CIS-DUPLICATE-' + Date.now()

      // Create first applicant
      const first = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          userId: testUserId!,
          cisIdentifier,
        },
      })
      testApplicantId = first.id

      // Try to create duplicate
      await expect(
        prisma.candidate.create({
          data: {
            vkId: testVKId!,
            userId: testUserId!,
            cisIdentifier, // Same CIS ID, same VK
          },
        })
      ).rejects.toThrow()
    })

    it('should set default values correctly', async () => {
      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          userId: testUserId!,
          cisIdentifier: 'CIS-DEFAULTS-' + Date.now(),
        },
      })

      testApplicantId = applicant.id

      expect(applicant.isArchived).toBe(false)
      expect(applicant.deleted).toBe(false)
      expect(applicant.registeredAt).toBeDefined()
    })
  })

  describe('GET /api/admin/applicants/[id]', () => {
    beforeEach(async () => {
      if (!testApplicantId) {
        const applicant = await prisma.candidate.create({
          data: {
            vkId: testVKId!,
            userId: testUserId!,
            cisIdentifier: 'CIS-DETAIL-' + Date.now(),
          },
        })
        testApplicantId = applicant.id
      }
    })

    it('should fetch applicant detail by id', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
        include: {
          user: true,
          vk: {
            include: {
              institution: true,
            },
          },
        },
      })

      expect(applicant).toBeDefined()
      expect(applicant?.id).toBe(testApplicantId)
      expect(applicant?.user).toBeDefined()
      expect(applicant?.vk).toBeDefined()
    })

    it('should include test results', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
        include: {
          testResults: {
            include: {
              test: true,
            },
          },
        },
      })

      expect(applicant).toBeDefined()
      expect(Array.isArray(applicant?.testResults)).toBe(true)
    })

    it('should include evaluations', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
        include: {
          evaluations: {
            include: {
              user: true,
              member: true,
            },
          },
        },
      })

      expect(applicant).toBeDefined()
      expect(Array.isArray(applicant?.evaluations)).toBe(true)
    })

    it('should return null for non-existent id', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(applicant).toBeNull()
    })
  })

  describe('PUT /api/admin/applicants/[id]', () => {
    beforeEach(async () => {
      if (!testApplicantId) {
        const applicant = await prisma.candidate.create({
          data: {
            vkId: testVKId!,
            userId: testUserId!,
            cisIdentifier: 'CIS-UPDATE-' + Date.now(),
          },
        })
        testApplicantId = applicant.id
      }
    })

    it('should update applicant email', async () => {
      const newEmail = 'updated.email@test.sk'

      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { email: newEmail },
      })

      expect(updated.email).toBe(newEmail)
    })

    it('should update isArchived status', async () => {
      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { isArchived: true },
      })

      expect(updated.isArchived).toBe(true)

      // Reset
      await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { isArchived: false },
      })
    })
  })

  describe('DELETE /api/admin/applicants/[id]', () => {
    it('should soft delete applicant', async () => {
      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          userId: testUserId!,
          cisIdentifier: 'CIS-DELETE-' + Date.now(),
          email: 'delete.test@test.sk',
        },
      })

      // Soft delete
      const deleted = await prisma.candidate.update({
        where: { id: applicant.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedEmail: applicant.email,
        },
      })

      expect(deleted.deleted).toBe(true)
      expect(deleted.deletedAt).toBeDefined()
      expect(deleted.deletedEmail).toBe('delete.test@test.sk')

      // Cleanup
      await prisma.candidate.delete({ where: { id: applicant.id } })
    })
  })
})
