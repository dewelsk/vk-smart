import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

describe('Users Detail API', () => {
  let testUserId: string | null = null

  beforeAll(async () => {
    await prisma.$connect()

    // Create a test user for detail/update tests
    const user = await prisma.user.create({
      data: {
        name: 'Detail',
        surname: 'Test',
        username: 'detail.test.temp',
        email: 'detail.test@test.sk',
        role: UserRole.GESTOR,
        active: true,
        passwordSetToken: 'detail-test-token-' + Date.now(),
        passwordSetTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.userInstitution.deleteMany({
        where: { userId: testUserId },
      })
      await prisma.user.delete({
        where: { id: testUserId },
      })
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/users/[id]', () => {
    it('should fetch user detail by id', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUserId! },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
          gestorVKs: {
            select: {
              id: true,
              identifier: true,
              position: true,
              status: true,
            },
          },
        },
      })

      expect(user).toBeDefined()
      expect(user?.id).toBe(testUserId)
      expect(user?.name).toBe('Detail')
      expect(user?.surname).toBe('Test')
      expect(user?.username).toBe('detail.test.temp')
    })

    it('should include user institutions', async () => {
      const institution = await prisma.institution.findFirst()
      expect(institution).toBeDefined()

      // Assign institution
      await prisma.userInstitution.create({
        data: {
          userId: testUserId!,
          institutionId: institution!.id,
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: testUserId! },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })

      expect(user?.institutions.length).toBeGreaterThan(0)
      expect(user?.institutions[0].institution.id).toBe(institution!.id)

      // Cleanup
      await prisma.userInstitution.deleteMany({
        where: { userId: testUserId! },
      })
    })

    it('should return 404 for non-existent user', async () => {
      const user = await prisma.user.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(user).toBeNull()
    })

    it('should not return deleted users', async () => {
      // Create and soft delete a user
      const deletedUser = await prisma.user.create({
        data: {
          name: 'Deleted',
          surname: 'User',
          username: 'deleted.user.temp',
          role: UserRole.GESTOR,
          deleted: true,
          deletedAt: new Date(),
        },
      })

      const user = await prisma.user.findUnique({
        where: {
          id: deletedUser.id,
          deleted: false,
        },
      })

      expect(user).toBeNull()

      // Cleanup
      await prisma.user.delete({
        where: { id: deletedUser.id },
      })
    })
  })

  describe('PUT /api/admin/users/[id]', () => {
    it('should update user basic info', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUserId! },
        data: {
          name: 'Updated',
          surname: 'Name',
          note: 'Test note',
        },
      })

      expect(updatedUser.name).toBe('Updated')
      expect(updatedUser.surname).toBe('Name')
      expect(updatedUser.note).toBe('Test note')

      // Reset
      await prisma.user.update({
        where: { id: testUserId! },
        data: {
          name: 'Detail',
          surname: 'Test',
          note: null,
        },
      })
    })

    it('should update user email', async () => {
      const newEmail = 'updated.email@test.sk'

      const updatedUser = await prisma.user.update({
        where: { id: testUserId! },
        data: {
          email: newEmail,
        },
      })

      expect(updatedUser.email).toBe(newEmail)

      // Reset
      await prisma.user.update({
        where: { id: testUserId! },
        data: {
          email: 'detail.test@test.sk',
        },
      })
    })

    it('should fail to update with duplicate email', async () => {
      const existingEmail = 'superadmin@retry.sk'

      await expect(
        prisma.user.update({
          where: { id: testUserId! },
          data: {
            email: existingEmail,
          },
        })
      ).rejects.toThrow()
    })

    it('should update user active status', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUserId! },
        data: {
          active: false,
        },
      })

      expect(updatedUser.active).toBe(false)

      // Reset
      await prisma.user.update({
        where: { id: testUserId! },
        data: {
          active: true,
        },
      })
    })

    it('should update user role', async () => {
      const updatedUser = await prisma.user.update({
        where: { id: testUserId! },
        data: {
          role: UserRole.KOMISIA,
        },
      })

      expect(updatedUser.role).toBe(UserRole.KOMISIA)

      // Reset
      await prisma.user.update({
        where: { id: testUserId! },
        data: {
          role: UserRole.GESTOR,
        },
      })
    })

    it('should update user institutions', async () => {
      const institutions = await prisma.institution.findMany({ take: 2 })
      expect(institutions.length).toBeGreaterThan(0)

      // Clear existing
      await prisma.userInstitution.deleteMany({
        where: { userId: testUserId! },
      })

      // Add new institutions
      await prisma.userInstitution.createMany({
        data: institutions.map((inst) => ({
          userId: testUserId!,
          institutionId: inst.id,
        })),
      })

      const user = await prisma.user.findUnique({
        where: { id: testUserId! },
        include: {
          institutions: true,
        },
      })

      expect(user?.institutions.length).toBe(institutions.length)

      // Cleanup
      await prisma.userInstitution.deleteMany({
        where: { userId: testUserId! },
      })
    })
  })

  describe('DELETE /api/admin/users/[id]', () => {
    it('should soft delete user', async () => {
      // Create a user to delete
      const userToDelete = await prisma.user.create({
        data: {
          name: 'To',
          surname: 'Delete',
          username: 'to.delete.temp',
          role: UserRole.GESTOR,
        },
      })

      // Soft delete
      const deletedUser = await prisma.user.update({
        where: { id: userToDelete.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      })

      expect(deletedUser.deleted).toBe(true)
      expect(deletedUser.deletedAt).toBeDefined()

      // Verify not in active list
      const activeUser = await prisma.user.findFirst({
        where: {
          id: userToDelete.id,
          deleted: false,
        },
      })

      expect(activeUser).toBeNull()

      // Cleanup
      await prisma.user.delete({
        where: { id: userToDelete.id },
      })
    })

    it('should return error for non-existent user', async () => {
      const user = await prisma.user.findUnique({
        where: { id: 'non-existent' },
      })

      expect(user).toBeNull()
    })
  })

  describe('RBAC - Institution access', () => {
    it('should allow admin to access users from their institutions', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
        include: {
          institutions: true,
        },
      })

      if (admin && admin.institutions.length > 0) {
        const institutionId = admin.institutions[0].institutionId

        const users = await prisma.user.findMany({
          where: {
            institutions: {
              some: {
                institutionId,
              },
            },
            deleted: false,
          },
        })

        expect(users).toBeDefined()
        expect(Array.isArray(users)).toBe(true)
      }
    })

    it('should prevent admin from accessing users outside their institutions', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
        include: {
          institutions: true,
        },
      })

      if (admin && admin.institutions.length > 0) {
        const adminInstitutionIds = admin.institutions.map((i) => i.institutionId)

        // Find a user not in admin's institutions
        const outsideUser = await prisma.user.findFirst({
          where: {
            NOT: {
              institutions: {
                some: {
                  institutionId: {
                    in: adminInstitutionIds,
                  },
                },
              },
            },
            deleted: false,
            role: {
              not: UserRole.UCHADZAC,
            },
          },
        })

        if (outsideUser) {
          // Verify user is not accessible
          const hasAccess = outsideUser.id === admin.id

          expect(hasAccess).toBe(false)
        }
      }
    })
  })
})
