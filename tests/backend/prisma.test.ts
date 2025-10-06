import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { UserRole  } from '@prisma/client'
import { prisma } from '@/lib/prisma'


describe('Database Connection', () => {
  beforeAll(async () => {
    // Ensure we can connect
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to the database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`
    expect(result).toBeDefined()
  })

  it('should execute raw query successfully', async () => {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].now).toBeInstanceOf(Date)
  })
})

describe('Seed Data Verification', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Institutions', () => {
    it('should have at least 3 institutions seeded', async () => {
      const institutions = await prisma.institution.findMany()
      expect(institutions.length).toBeGreaterThanOrEqual(3)
    })

    it('should have MV institution with correct data', async () => {
      const mv = await prisma.institution.findUnique({
        where: { code: 'MV' },
      })
      expect(mv).toBeDefined()
      expect(mv?.name).toBe('Ministerstvo vnútra SR')
      expect(mv?.active).toBe(true)
    })

    it('should have MZVEZ institution with correct data', async () => {
      const mzvez = await prisma.institution.findUnique({
        where: { code: 'MZVEZ' },
      })
      expect(mzvez).toBeDefined()
      expect(mzvez?.name).toBe('Ministerstvo zahraničných vecí a európskych záležitostí SR')
      expect(mzvez?.active).toBe(true)
    })

    it('should have MF institution with correct data', async () => {
      const mf = await prisma.institution.findUnique({
        where: { code: 'MF' },
      })
      expect(mf).toBeDefined()
      expect(mf?.name).toBe('Ministerstvo financií SR')
      expect(mf?.active).toBe(true)
    })
  })

  describe('Users', () => {
    it('should have at least 4 users seeded', async () => {
      const users = await prisma.user.findMany()
      expect(users.length).toBeGreaterThanOrEqual(4)
    })

    it('should have superadmin user with correct data', async () => {
      const superadmin = await prisma.user.findUnique({
        where: { username: 'superadmin' },
      })
      expect(superadmin).toBeDefined()
      expect(superadmin?.email).toBe('superadmin@retry.sk')
      expect(superadmin?.role).toBe(UserRole.SUPERADMIN)
      expect(superadmin?.active).toBe(true)
      expect(superadmin?.password).toBeDefined()
      expect(superadmin?.password).not.toBe('Hackaton25') // Should be hashed
    })

    it('should have admin user for MV', async () => {
      const admin = await prisma.user.findUnique({
        where: { username: 'admin.mv' },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })
      expect(admin).toBeDefined()
      expect(admin?.email).toBe('admin.mv@retry.sk')
      expect(admin?.role).toBe(UserRole.ADMIN)
      expect(admin?.institutions).toHaveLength(1)
      expect(admin?.institutions[0].institution.code).toBe('MV')
    })

    it('should have gestor user for MV', async () => {
      const gestor = await prisma.user.findUnique({
        where: { username: 'gestor.mv' },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })
      expect(gestor).toBeDefined()
      expect(gestor?.email).toBe('gestor.mv@retry.sk')
      expect(gestor?.role).toBe(UserRole.GESTOR)
      expect(gestor?.institutions).toHaveLength(1)
      expect(gestor?.institutions[0].institution.code).toBe('MV')
    })

    it('should have commission member for MV', async () => {
      const komisia = await prisma.user.findUnique({
        where: { username: 'komisia.mv' },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })
      expect(komisia).toBeDefined()
      expect(komisia?.email).toBe('komisia.mv@retry.sk')
      expect(komisia?.role).toBe(UserRole.KOMISIA)
      expect(komisia?.institutions).toHaveLength(1)
      expect(komisia?.institutions[0].institution.code).toBe('MV')
    })

    it('should have all user passwords hashed', async () => {
      const users = await prisma.user.findMany({
        select: {
          password: true,
        },
      })

      users.forEach((user) => {
        if (user.password) {
          // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
          expect(user.password).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
        }
      })
    })
  })

  describe('User-Institution Relationships', () => {
    it('should have correct user-institution assignments', async () => {
      const assignments = await prisma.userInstitution.findMany({
        include: {
          user: true,
          institution: true,
        },
      })

      // Should have at least 3 assignments (admin.mv, gestor.mv, komisia.mv to MV)
      expect(assignments.length).toBeGreaterThanOrEqual(3)

      // At least 3 should be assigned to MV
      const mvAssignments = assignments.filter(a => a.institution.code === 'MV')
      expect(mvAssignments.length).toBeGreaterThanOrEqual(3)
    })

    it('should have assignedBy field populated', async () => {
      const assignments = await prisma.userInstitution.findMany({
        where: {
          assignedBy: { not: null },
        },
      })

      expect(assignments.length).toBeGreaterThan(0)
      assignments.forEach((assignment) => {
        expect(assignment.assignedBy).toBeDefined()
      })
    })
  })

  describe('Database Constraints', () => {
    it('should enforce unique username constraint', async () => {
      await expect(
        prisma.user.create({
          data: {
            username: 'superadmin', // Duplicate username
            email: 'test@test.sk',
            name: 'Test',
            surname: 'User',
            role: UserRole.ADMIN,
          },
        })
      ).rejects.toThrow()
    })

    it('should enforce unique institution code constraint', async () => {
      await expect(
        prisma.institution.create({
          data: {
            code: 'MV', // Duplicate code
            name: 'Test Institution',
          },
        })
      ).rejects.toThrow()
    })

    it('should enforce unique user-institution assignment', async () => {
      const admin = await prisma.user.findUnique({
        where: { username: 'admin.mv' },
      })
      const mv = await prisma.institution.findUnique({
        where: { code: 'MV' },
      })

      expect(admin).toBeDefined()
      expect(mv).toBeDefined()

      await expect(
        prisma.userInstitution.create({
          data: {
            userId: admin!.id,
            institutionId: mv!.id,
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Soft Delete Pattern', () => {
    it('should have users with deleted field set to false by default', async () => {
      const users = await prisma.user.findMany()
      users.forEach((user) => {
        expect(user.deleted).toBe(false)
        expect(user.deletedAt).toBeNull()
      })
    })

    it('should allow soft deleting a user', async () => {
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          username: 'test.delete',
          email: 'test.delete@test.sk',
          name: 'Test',
          surname: 'Delete',
          role: UserRole.ADMIN,
        },
      })

      // Soft delete
      const deletedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedEmail: testUser.email,
          email: null,
        },
      })

      expect(deletedUser.deleted).toBe(true)
      expect(deletedUser.deletedAt).toBeDefined()
      expect(deletedUser.deletedEmail).toBe('test.delete@test.sk')
      expect(deletedUser.email).toBeNull()

      // Cleanup
      await prisma.user.delete({
        where: { id: testUser.id },
      })
    })
  })
})
