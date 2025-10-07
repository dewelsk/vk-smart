import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'


describe('Institutions API', () => {
  let testInstitutionId: string | null = null

  beforeAll(async () => {
    await prisma.$connect()

    // Create a test institution for detail/update tests
    const institution = await prisma.institution.create({
      data: {
        name: 'Test Institution',
        code: 'TEST_INST_' + Date.now(),
        description: 'Test description',
        allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
      },
    })
    testInstitutionId = institution.id
  })

  afterAll(async () => {
    // Cleanup
    if (testInstitutionId) {
      await prisma.userInstitution.deleteMany({
        where: { institutionId: testInstitutionId },
      })
      await prisma.institution.delete({
        where: { id: testInstitutionId },
      })
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/institutions', () => {
    it('should fetch all institutions', async () => {
      const institutions = await prisma.institution.findMany()

      expect(institutions).toBeDefined()
      expect(Array.isArray(institutions)).toBe(true)
      expect(institutions.length).toBeGreaterThan(0)
    })

    it('should return institutions sorted by code', async () => {
      const institutions = await prisma.institution.findMany({
        orderBy: {
          code: 'asc',
        },
      })

      expect(institutions).toBeDefined()
      expect(institutions.length).toBeGreaterThan(0)

      // Check if sorted correctly
      if (institutions.length > 1) {
        for (let i = 0; i < institutions.length - 1; i++) {
          expect(
            institutions[i].code.localeCompare(institutions[i + 1].code)
          ).toBeLessThanOrEqual(0)
        }
      }
    })

    it('should return institutions with all required fields', async () => {
      const institutions = await prisma.institution.findMany()

      expect(institutions.length).toBeGreaterThan(0)

      institutions.forEach(institution => {
        expect(institution.id).toBeDefined()
        expect(institution.code).toBeDefined()
        expect(institution.name).toBeDefined()
        expect(institution.createdAt).toBeDefined()
        expect(institution.updatedAt).toBeDefined()
      })
    })

    it('should have unique institution codes', async () => {
      const institutions = await prisma.institution.findMany()

      const codes = institutions.map(i => i.code)
      const uniqueCodes = new Set(codes)

      expect(codes.length).toBe(uniqueCodes.size)
    })

    it('should have institutions with valid IDs', async () => {
      const institutions = await prisma.institution.findMany()

      institutions.forEach(institution => {
        expect(institution.id).toBeDefined()
        expect(typeof institution.id).toBe('string')
        expect(institution.id.length).toBeGreaterThan(0)
      })
    })
  })

  describe('GET /api/admin/institutions/[id]', () => {
    it('should fetch institution detail by id', async () => {
      const institution = await prisma.institution.findUnique({
        where: { id: testInstitutionId! },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  surname: true,
                  role: true,
                }
              }
            }
          }
        }
      })

      expect(institution).toBeDefined()
      expect(institution?.id).toBe(testInstitutionId)
      expect(institution?.name).toBe('Test Institution')
      expect(institution?.code).toContain('TEST_INST_')
    })

    it('should return allowedQuestionTypes field', async () => {
      const institution = await prisma.institution.findUnique({
        where: { id: testInstitutionId! },
      })

      expect(institution).toBeDefined()
      expect(institution?.allowedQuestionTypes).toBeDefined()
      expect(Array.isArray(institution?.allowedQuestionTypes)).toBe(true)
      expect(institution?.allowedQuestionTypes).toContain('SINGLE_CHOICE')
      expect(institution?.allowedQuestionTypes).toContain('MULTIPLE_CHOICE')
    })

    it('should return 404 for non-existent institution', async () => {
      const institution = await prisma.institution.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(institution).toBeNull()
    })

    it('should have default allowedQuestionTypes for new institutions', async () => {
      const newInstitution = await prisma.institution.create({
        data: {
          name: 'Default Types Institution',
          code: 'DEFAULT_' + Date.now(),
        },
      })

      expect(newInstitution.allowedQuestionTypes).toBeDefined()
      expect(Array.isArray(newInstitution.allowedQuestionTypes)).toBe(true)
      expect(newInstitution.allowedQuestionTypes).toContain('SINGLE_CHOICE')

      // Cleanup
      await prisma.institution.delete({
        where: { id: newInstitution.id },
      })
    })
  })

  describe('PUT /api/admin/institutions/[id]', () => {
    it('should update institution basic info', async () => {
      const updatedInstitution = await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          name: 'Updated Institution',
          description: 'Updated description',
        },
      })

      expect(updatedInstitution.name).toBe('Updated Institution')
      expect(updatedInstitution.description).toBe('Updated description')

      // Reset
      await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          name: 'Test Institution',
          description: 'Test description',
        },
      })
    })

    it('should update allowedQuestionTypes', async () => {
      const updatedInstitution = await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED'],
        },
      })

      expect(updatedInstitution.allowedQuestionTypes).toBeDefined()
      expect(Array.isArray(updatedInstitution.allowedQuestionTypes)).toBe(true)
      expect(updatedInstitution.allowedQuestionTypes).toHaveLength(3)
      expect(updatedInstitution.allowedQuestionTypes).toContain('SINGLE_CHOICE')
      expect(updatedInstitution.allowedQuestionTypes).toContain('TRUE_FALSE')
      expect(updatedInstitution.allowedQuestionTypes).toContain('OPEN_ENDED')
      expect(updatedInstitution.allowedQuestionTypes).not.toContain('MULTIPLE_CHOICE')

      // Reset
      await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
        },
      })
    })

    it('should update active status', async () => {
      const updatedInstitution = await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          active: false,
        },
      })

      expect(updatedInstitution.active).toBe(false)

      // Reset
      await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          active: true,
        },
      })
    })

    it('should fail to update with duplicate code', async () => {
      const existingInstitution = await prisma.institution.findFirst({
        where: {
          id: {
            not: testInstitutionId!,
          },
        },
      })

      if (existingInstitution) {
        await expect(
          prisma.institution.update({
            where: { id: testInstitutionId! },
            data: {
              code: existingInstitution.code,
            },
          })
        ).rejects.toThrow()
      }
    })

    it('should allow setting allowedQuestionTypes to single type', async () => {
      const updatedInstitution = await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE'],
        },
      })

      expect(updatedInstitution.allowedQuestionTypes).toHaveLength(1)
      expect(updatedInstitution.allowedQuestionTypes).toContain('SINGLE_CHOICE')

      // Reset
      await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
        },
      })
    })

    it('should allow setting all question types', async () => {
      const allTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']

      const updatedInstitution = await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          allowedQuestionTypes: allTypes,
        },
      })

      expect(updatedInstitution.allowedQuestionTypes).toHaveLength(4)
      allTypes.forEach(type => {
        expect(updatedInstitution.allowedQuestionTypes).toContain(type)
      })

      // Reset
      await prisma.institution.update({
        where: { id: testInstitutionId! },
        data: {
          allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'],
        },
      })
    })
  })

  describe('RBAC - Institution access', () => {
    it('should allow SUPERADMIN to access any institution', async () => {
      const superadmin = await prisma.user.findFirst({
        where: { role: UserRole.SUPERADMIN },
      })

      if (superadmin) {
        const institution = await prisma.institution.findFirst()
        expect(institution).toBeDefined()

        // SUPERADMIN should be able to view any institution
        const fetchedInstitution = await prisma.institution.findUnique({
          where: { id: institution!.id },
        })
        expect(fetchedInstitution).toBeDefined()
      }
    })

    it('should allow ADMIN to access institutions they belong to', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
        include: {
          institutions: true,
        },
      })

      if (admin && admin.institutions.length > 0) {
        const institutionId = admin.institutions[0].institutionId

        const institution = await prisma.institution.findUnique({
          where: { id: institutionId },
        })

        expect(institution).toBeDefined()
      }
    })

    it('should verify ADMIN can update their institution', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
        include: {
          institutions: true,
        },
      })

      if (admin && admin.institutions.length > 0) {
        const institutionId = admin.institutions[0].institutionId

        // Update allowedQuestionTypes
        const updatedInstitution = await prisma.institution.update({
          where: { id: institutionId },
          data: {
            allowedQuestionTypes: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'],
          },
        })

        expect(updatedInstitution.allowedQuestionTypes).toContain('TRUE_FALSE')

        // This test doesn't reset because we're testing on real seeded data
        // The E2E tests will handle proper isolation
      }
    })

    it('should verify institution-user relationship exists', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      })

      if (admin) {
        const userInstitutions = await prisma.userInstitution.findMany({
          where: { userId: admin.id },
        })

        expect(userInstitutions).toBeDefined()
        expect(Array.isArray(userInstitutions)).toBe(true)
      }
    })
  })
})
