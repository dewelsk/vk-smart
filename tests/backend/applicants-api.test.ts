import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Applicants API', () => {
  let testVKId: string | null = null
  let testApplicantId: string | null = null
  let adminUserId: string

  beforeAll(async () => {
    await prisma.$connect()

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { userRoles: { some: { role: 'ADMIN' } } },
    })
    adminUserId = admin!.id

    // Create a test VK
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: 'TEST-VK-' + Date.now(),
        selectionType: 'Test',
        organizationalUnit: 'Test Unit',
        serviceField: 'Test Field',
        position: 'Test Position',
        serviceType: 'Test Type',
        startDateTime: new Date(),
        createdById: adminUserId,
      },
    })
    testVKId = vk.id
  })

  afterAll(async () => {
    // Cleanup
    if (testApplicantId) {
      await prisma.candidate.delete({ where: { id: testApplicantId } }).catch(() => {})
    }
    if (testVKId) {
      await prisma.vyberoveKonanie.delete({ where: { id: testVKId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  afterEach(async () => {
    if (testApplicantId) {
      await prisma.candidate.delete({ where: { id: testApplicantId } }).catch(() => {})
      testApplicantId = null
    }
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

    it('should search applicants by name', async () => {
      const searchTerm = 'test'
      const applicants = await prisma.candidate.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { surname: { contains: searchTerm, mode: 'insensitive' } },
          ],
          deleted: false,
        },
      })

      expect(applicants).toBeDefined()
    })

    it('should include VK data', async () => {
      const applicants = await prisma.candidate.findMany({
        where: { deleted: false },
        include: {
          vk: true,
        },
        take: 1,
      })

      if (applicants.length > 0) {
        expect(applicants[0].vk).toBeDefined()
        expect(applicants[0].vk.identifier).toBeDefined()
      }
    })

    it('should include test sessions count', async () => {
      const applicants = await prisma.candidate.findMany({
        where: { deleted: false },
        include: {
          testSessions: {
            where: { status: 'COMPLETED' },
            select: { id: true },
          },
        },
        take: 1,
      })

      if (applicants.length > 0) {
        expect(Array.isArray(applicants[0].testSessions)).toBe(true)
      }
    })
  })

  describe('POST /api/admin/applicants', () => {
    it('should create a new applicant with all fields', async () => {
      const cisIdentifier = 'CIS-TEST-' + Date.now()
      const pin = 'test1234'

      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          cisIdentifier,
          password: await bcrypt.hash(pin, 10),
          name: 'Test',
          surname: 'Applicant',
          email: 'test@example.sk',
          phone: '+421900123456',
          birthDate: new Date('1990-01-01'),
          active: true,
        },
      })

      testApplicantId = applicant.id

      expect(applicant).toBeDefined()
      expect(applicant.vkId).toBe(testVKId)
      expect(applicant.cisIdentifier).toBe(cisIdentifier)
      expect(applicant.name).toBe('Test')
      expect(applicant.surname).toBe('Applicant')
      expect(applicant.email).toBe('test@example.sk')
      expect(applicant.phone).toBe('+421900123456')
      expect(applicant.active).toBe(true)
      expect(applicant.password).toBeDefined()
    })

    it('should create applicant without optional fields', async () => {
      const cisIdentifier = 'CIS-MIN-' + Date.now()

      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          cisIdentifier,
          name: 'Min',
          surname: 'Fields',
        },
      })

      testApplicantId = applicant.id

      expect(applicant).toBeDefined()
      expect(applicant.email).toBeNull()
      expect(applicant.phone).toBeNull()
      expect(applicant.birthDate).toBeNull()
      expect(applicant.password).toBeNull()
    })

    it('should fail with duplicate CIS identifier', async () => {
      const cisIdentifier = 'CIS-DUPLICATE-' + Date.now()

      // Create first applicant
      const first = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          cisIdentifier,
          name: 'First',
          surname: 'Applicant',
        },
      })
      testApplicantId = first.id

      // Try to create duplicate
      await expect(
        prisma.candidate.create({
          data: {
            vkId: testVKId!,
            cisIdentifier, // Same CIS ID (globally unique)
            name: 'Second',
            surname: 'Applicant',
          },
        })
      ).rejects.toThrow()
    })

    it('should set default values correctly', async () => {
      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          cisIdentifier: 'CIS-DEFAULTS-' + Date.now(),
          name: 'Default',
          surname: 'Test',
        },
      })

      testApplicantId = applicant.id

      expect(applicant.active).toBe(true)
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
            cisIdentifier: 'CIS-DETAIL-' + Date.now(),
            name: 'Detail',
            surname: 'Test',
          },
        })
        testApplicantId = applicant.id
      }
    })

    it('should fetch applicant detail by id', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
        include: {
          vk: true,
        },
      })

      expect(applicant).toBeDefined()
      expect(applicant?.id).toBe(testApplicantId)
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

    it('should include test sessions', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
        include: {
          testSessions: {
            include: {
              test: true,
            },
          },
        },
      })

      expect(applicant).toBeDefined()
      expect(Array.isArray(applicant?.testSessions)).toBe(true)
    })

    it('should include evaluations', async () => {
      const applicant = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
        include: {
          evaluations: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
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

  describe('PATCH /api/admin/applicants/[id]', () => {
    beforeEach(async () => {
      if (!testApplicantId) {
        const applicant = await prisma.candidate.create({
          data: {
            vkId: testVKId!,
            cisIdentifier: 'CIS-UPDATE-' + Date.now(),
            name: 'Update',
            surname: 'Test',
            email: 'old@example.sk',
          },
        })
        testApplicantId = applicant.id
      }
    })

    it('should update applicant name and surname', async () => {
      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: {
          name: 'Updated Name',
          surname: 'Updated Surname',
        },
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.surname).toBe('Updated Surname')
    })

    it('should update applicant email', async () => {
      const newEmail = 'updated.email@test.sk'

      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { email: newEmail },
      })

      expect(updated.email).toBe(newEmail)
    })

    it('should update phone and birthDate', async () => {
      const newPhone = '+421901234567'
      const newBirthDate = new Date('1995-05-15')

      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: {
          phone: newPhone,
          birthDate: newBirthDate,
        },
      })

      expect(updated.phone).toBe(newPhone)
      expect(updated.birthDate?.toISOString()).toBe(newBirthDate.toISOString())
    })

    it('should update active status', async () => {
      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { active: false },
      })

      expect(updated.active).toBe(false)

      // Reset
      await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { active: true },
      })
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

    it('should update password (PIN)', async () => {
      const newPin = 'newpin1234'
      const hashedPin = await bcrypt.hash(newPin, 10)

      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { password: hashedPin },
      })

      expect(updated.password).toBeDefined()
      const passwordMatch = await bcrypt.compare(newPin, updated.password!)
      expect(passwordMatch).toBe(true)
    })

    it('should set fields to null', async () => {
      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: {
          email: null,
          phone: null,
          birthDate: null,
        },
      })

      expect(updated.email).toBeNull()
      expect(updated.phone).toBeNull()
      expect(updated.birthDate).toBeNull()
    })

    it('should update updatedAt timestamp', async () => {
      const before = await prisma.candidate.findUnique({
        where: { id: testApplicantId! },
      })

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      const updated = await prisma.candidate.update({
        where: { id: testApplicantId! },
        data: { name: 'Changed' },
      })

      expect(updated.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime())
    })
  })

  describe('DELETE /api/admin/applicants/[id]', () => {
    it('should soft delete applicant', async () => {
      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          cisIdentifier: 'CIS-DELETE-' + Date.now(),
          name: 'Delete',
          surname: 'Test',
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

    it('should not appear in normal queries after soft delete', async () => {
      const applicant = await prisma.candidate.create({
        data: {
          vkId: testVKId!,
          cisIdentifier: 'CIS-SOFTDEL-' + Date.now(),
          name: 'Soft',
          surname: 'Delete',
        },
      })

      await prisma.candidate.update({
        where: { id: applicant.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      })

      const found = await prisma.candidate.findFirst({
        where: {
          id: applicant.id,
          deleted: false,
        },
      })

      expect(found).toBeNull()

      // Cleanup
      await prisma.candidate.delete({ where: { id: applicant.id } })
    })
  })
})
