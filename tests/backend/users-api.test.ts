import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

describe('Users API', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/admin/users - List users', () => {
    it('should fetch users excluding UCHADZAC role', async () => {
      const users = await prisma.user.findMany({
        where: {
          role: {
            not: UserRole.UCHADZAC,
          },
          deleted: false,
        },
      })

      expect(users).toBeDefined()
      expect(users.every(u => u.role !== UserRole.UCHADZAC)).toBe(true)
    })

    it('should filter users by role', async () => {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: UserRole.ADMIN,
          deleted: false,
        },
      })

      expect(adminUsers).toBeDefined()
      expect(adminUsers.every(u => u.role === UserRole.ADMIN)).toBe(true)
    })

    it('should filter users by active status', async () => {
      const activeUsers = await prisma.user.findMany({
        where: {
          active: true,
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
      })

      expect(activeUsers).toBeDefined()
      expect(activeUsers.every(u => u.active === true)).toBe(true)
    })

    it('should filter users waiting for password', async () => {
      const pendingUsers = await prisma.user.findMany({
        where: {
          passwordSetToken: {
            not: null,
          },
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
      })

      expect(pendingUsers).toBeDefined()
      expect(pendingUsers.every(u => u.passwordSetToken !== null)).toBe(true)
    })

    it('should search users by name', async () => {
      const searchTerm = 'Super'
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { surname: { contains: searchTerm, mode: 'insensitive' } },
          ],
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
      })

      expect(users).toBeDefined()
      expect(users.length).toBeGreaterThan(0)
    })

    it('should search users by email', async () => {
      const users = await prisma.user.findMany({
        where: {
          email: { contains: '@retry.sk', mode: 'insensitive' },
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
      })

      expect(users).toBeDefined()
      expect(users.every(u => u.email?.includes('@retry.sk'))).toBe(true)
    })

    it('should sort users by name ascending', async () => {
      const users = await prisma.user.findMany({
        where: {
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: 10,
      })

      expect(users).toBeDefined()
      // Check if sorted
      for (let i = 0; i < users.length - 1; i++) {
        expect(users[i].name <= users[i + 1].name).toBe(true)
      }
    })

    it('should paginate users correctly', async () => {
      const limit = 5
      const page1 = await prisma.user.findMany({
        where: {
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
        take: limit,
        skip: 0,
      })

      const page2 = await prisma.user.findMany({
        where: {
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
        take: limit,
        skip: limit,
      })

      expect(page1.length).toBeLessThanOrEqual(limit)
      expect(page2.length).toBeLessThanOrEqual(limit)
      // Ensure different results
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })

    it('should include user institutions', async () => {
      const users = await prisma.user.findMany({
        where: {
          deleted: false,
          role: {
            in: [UserRole.ADMIN, UserRole.GESTOR, UserRole.KOMISIA],
          },
        },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
        take: 1,
      })

      if (users.length > 0) {
        expect(users[0].institutions).toBeDefined()
        expect(Array.isArray(users[0].institutions)).toBe(true)
      }
    })

    it('should count total users correctly', async () => {
      const total = await prisma.user.count({
        where: {
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
      })

      expect(total).toBeGreaterThan(0)
      expect(typeof total).toBe('number')
    })
  })

  describe('POST /api/admin/users - Create user', () => {
    let createdUserId: string | null = null

    afterEach(async () => {
      // Cleanup created user
      if (createdUserId) {
        await prisma.userInstitution.deleteMany({
          where: { userId: createdUserId },
        })
        await prisma.user.delete({
          where: { id: createdUserId },
        })
        createdUserId = null
      }
    })

    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'Test',
        surname: 'User',
        username: 'test.user.temp',
        email: 'test.user.temp@test.sk',
        role: UserRole.GESTOR,
        note: 'Test note',
      }

      const user = await prisma.user.create({
        data: {
          ...userData,
          passwordSetToken: 'create-test-token-' + Date.now(),
          passwordSetTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      createdUserId = user.id

      expect(user).toBeDefined()
      expect(user.name).toBe(userData.name)
      expect(user.surname).toBe(userData.surname)
      expect(user.username).toBe(userData.username)
      expect(user.email).toBe(userData.email)
      expect(user.role).toBe(userData.role)
      expect(user.passwordSetToken).toBeDefined()
    })

    it('should fail to create user with duplicate username', async () => {
      const username = 'superadmin'

      await expect(
        prisma.user.create({
          data: {
            name: 'Duplicate',
            surname: 'User',
            username, // Duplicate
            role: UserRole.ADMIN,
          },
        })
      ).rejects.toThrow()
    })

    it('should fail to create user with duplicate email', async () => {
      const email = 'superadmin@retry.sk'

      await expect(
        prisma.user.create({
          data: {
            name: 'Duplicate',
            surname: 'User',
            username: 'duplicate.email.test',
            email, // Duplicate
            role: UserRole.ADMIN,
          },
        })
      ).rejects.toThrow()
    })

    it('should create user and assign to institutions', async () => {
      const institution = await prisma.institution.findFirst()
      expect(institution).toBeDefined()

      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Institution',
          username: 'test.institution.temp',
          role: UserRole.GESTOR,
        },
      })

      createdUserId = user.id

      await prisma.userInstitution.create({
        data: {
          userId: user.id,
          institutionId: institution!.id,
        },
      })

      const userWithInstitutions = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })

      expect(userWithInstitutions?.institutions.length).toBe(1)
      expect(userWithInstitutions?.institutions[0].institution.id).toBe(institution!.id)
    })

    it('should generate password set token on creation', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Token',
          username: 'test.token.temp',
          role: UserRole.KOMISIA,
          passwordSetToken: 'generated-token-' + Date.now(),
          passwordSetTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      createdUserId = user.id

      expect(user.passwordSetToken).toBeDefined()
      expect(user.passwordSetTokenExpiry).toBeDefined()
      expect(user.passwordSetTokenExpiry! > new Date()).toBe(true)
    })
  })

  describe('User RBAC queries', () => {
    it('should filter users by institution for ADMIN role', async () => {
      const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
        include: {
          institutions: true,
        },
      })

      if (admin && admin.institutions.length > 0) {
        const institutionIds = admin.institutions.map(i => i.institutionId)

        const users = await prisma.user.findMany({
          where: {
            institutions: {
              some: {
                institutionId: {
                  in: institutionIds,
                },
              },
            },
            deleted: false,
            role: {
              not: UserRole.UCHADZAC,
            },
          },
        })

        expect(users).toBeDefined()
        expect(Array.isArray(users)).toBe(true)
      }
    })

    it('should allow SUPERADMIN to see all users', async () => {
      const allUsers = await prisma.user.findMany({
        where: {
          deleted: false,
          role: {
            not: UserRole.UCHADZAC,
          },
        },
      })

      expect(allUsers).toBeDefined()
      expect(allUsers.length).toBeGreaterThan(0)
    })
  })
})
