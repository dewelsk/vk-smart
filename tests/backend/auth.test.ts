import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Authentication Backend Tests', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'TestPassword123'
      const hashed = await bcrypt.hash(password, 10)

      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
    })

    it('should verify correct password', async () => {
      const password = 'TestPassword123'
      const hashed = await bcrypt.hash(password, 10)
      const isValid = await bcrypt.compare(password, hashed)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123'
      const hashed = await bcrypt.hash(password, 10)
      const isValid = await bcrypt.compare('WrongPassword', hashed)

      expect(isValid).toBe(false)
    })
  })

  describe('User Authentication Queries', () => {
    it('should find user by email', async () => {
      const user = await prisma.user.findFirst({
        where: {
          email: 'superadmin@retry.sk',
          deleted: false,
          active: true,
        },
      })

      expect(user).toBeDefined()
      expect(user?.username).toBe('superadmin')
    })

    it('should find user by username', async () => {
      const user = await prisma.user.findFirst({
        where: {
          username: 'superadmin',
          deleted: false,
          active: true,
        },
      })

      expect(user).toBeDefined()
      expect(user?.email).toBe('superadmin@retry.sk')
    })

    it('should find user by email OR username', async () => {
      const userByEmail = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'superadmin@retry.sk' },
            { username: 'superadmin@retry.sk' },
          ],
          deleted: false,
          active: true,
        },
      })

      const userByUsername = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'superadmin' },
            { username: 'superadmin' },
          ],
          deleted: false,
          active: true,
        },
      })

      expect(userByEmail).toBeDefined()
      expect(userByUsername).toBeDefined()
      expect(userByEmail?.id).toBe(userByUsername?.id)
    })

    it('should not find deleted users', async () => {
      // Create and delete a test user
      const testUser = await prisma.user.create({
        data: {
          username: 'test.deleted',
          email: 'test.deleted@test.sk',
          password: await bcrypt.hash('Test1234', 10),
          name: 'Test',
          surname: 'Deleted',
          role: UserRole.ADMIN,
        },
      })

      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
          deletedEmail: testUser.email,
          email: null,
        },
      })

      const foundUser = await prisma.user.findFirst({
        where: {
          username: 'test.deleted',
          deleted: false,
          active: true,
        },
      })

      expect(foundUser).toBeNull()

      // Cleanup
      await prisma.user.delete({
        where: { id: testUser.id },
      })
    })

    it('should not find inactive users', async () => {
      // Create an inactive test user
      const testUser = await prisma.user.create({
        data: {
          username: 'test.inactive',
          email: 'test.inactive@test.sk',
          password: await bcrypt.hash('Test1234', 10),
          name: 'Test',
          surname: 'Inactive',
          role: UserRole.ADMIN,
          active: false,
        },
      })

      const foundUser = await prisma.user.findFirst({
        where: {
          username: 'test.inactive',
          deleted: false,
          active: true,
        },
      })

      expect(foundUser).toBeNull()

      // Cleanup
      await prisma.user.delete({
        where: { id: testUser.id },
      })
    })

    it('should include user institutions in auth query', async () => {
      const user = await prisma.user.findFirst({
        where: {
          username: 'admin.mv',
          deleted: false,
          active: true,
        },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })

      expect(user).toBeDefined()
      expect(user?.institutions).toBeDefined()
      expect(user?.institutions.length).toBeGreaterThan(0)
      expect(user?.institutions[0].institution).toBeDefined()
      expect(user?.institutions[0].institution.code).toBe('MV')
    })
  })

  describe('Login Simulation', () => {
    it('should successfully authenticate superadmin with correct credentials', async () => {
      const login = 'superadmin@retry.sk'
      const password = 'Hackaton25'

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: login },
            { username: login },
          ],
          deleted: false,
          active: true,
        },
        include: {
          institutions: {
            include: {
              institution: true,
            },
          },
        },
      })

      expect(user).toBeDefined()
      expect(user?.password).toBeDefined()

      const isPasswordValid = await bcrypt.compare(password, user!.password!)
      expect(isPasswordValid).toBe(true)
    })

    it('should fail authentication with wrong password', async () => {
      const login = 'superadmin@retry.sk'
      const wrongPassword = 'WrongPassword123'

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: login },
            { username: login },
          ],
          deleted: false,
          active: true,
        },
      })

      expect(user).toBeDefined()
      expect(user?.password).toBeDefined()

      const isPasswordValid = await bcrypt.compare(wrongPassword, user!.password!)
      expect(isPasswordValid).toBe(false)
    })

    it('should fail authentication for non-existent user', async () => {
      const login = 'nonexistent@test.sk'

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: login },
            { username: login },
          ],
          deleted: false,
          active: true,
        },
      })

      expect(user).toBeNull()
    })
  })

  describe('Last Login Tracking', () => {
    it('should update lastLoginAt timestamp', async () => {
      const user = await prisma.user.findUnique({
        where: { username: 'admin.mv' },
      })

      expect(user).toBeDefined()

      const beforeLogin = user!.lastLoginAt

      // Simulate login
      await prisma.user.update({
        where: { id: user!.id },
        data: { lastLoginAt: new Date() },
      })

      const afterLogin = await prisma.user.findUnique({
        where: { id: user!.id },
      })

      expect(afterLogin?.lastLoginAt).toBeDefined()
      if (beforeLogin) {
        expect(afterLogin!.lastLoginAt!.getTime()).toBeGreaterThan(beforeLogin.getTime())
      }
    })
  })

  describe('Role-Based Access Control', () => {
    it('should have superadmin role', async () => {
      const user = await prisma.user.findUnique({
        where: { username: 'superadmin' },
      })

      expect(user?.role).toBe(UserRole.SUPERADMIN)
    })

    it('should have admin role', async () => {
      const user = await prisma.user.findUnique({
        where: { username: 'admin.mv' },
      })

      expect(user?.role).toBe(UserRole.ADMIN)
    })

    it('should have gestor role', async () => {
      const user = await prisma.user.findUnique({
        where: { username: 'gestor.mv' },
      })

      expect(user?.role).toBe(UserRole.GESTOR)
    })

    it('should have komisia role', async () => {
      const user = await prisma.user.findUnique({
        where: { username: 'komisia.mv' },
      })

      expect(user?.role).toBe(UserRole.KOMISIA)
    })
  })
})
