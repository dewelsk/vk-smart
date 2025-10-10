import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

describe('User Roles API', () => {
  let testInstitutionId: string
  let testInstitution2Id: string

  beforeAll(async () => {
    await prisma.$connect()

    // Create test institutions
    const institution = await prisma.institution.create({
      data: {
        code: 'TEST-ROLES-' + Date.now(),
        name: 'Test Institution for Roles ' + Date.now(),
        active: true,
      },
    })
    testInstitutionId = institution.id

    const institution2 = await prisma.institution.create({
      data: {
        code: 'TEST-ROLES-2-' + Date.now(),
        name: 'Test Institution 2 ' + Date.now(),
        active: true,
      },
    })
    testInstitution2Id = institution2.id
  })

  afterAll(async () => {
    // Cleanup test institutions
    if (testInstitutionId) {
      await prisma.institution.delete({
        where: { id: testInstitutionId },
      }).catch(() => {})
    }

    if (testInstitution2Id) {
      await prisma.institution.delete({
        where: { id: testInstitution2Id },
      }).catch(() => {})
    }

    await prisma.$disconnect()
  })

  describe('POST /api/admin/users/[id]/roles - Assign role', () => {
    it('should assign role with all fields', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-assign-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: testInstitutionId,
          assignedBy: tempUser.id,
        },
        include: {
          institution: true,
        },
      })

      expect(roleAssignment).toBeDefined()
      expect(roleAssignment.userId).toBe(tempUser.id)
      expect(roleAssignment.role).toBe(UserRole.ADMIN)
      expect(roleAssignment.institutionId).toBe(testInstitutionId)
      expect(roleAssignment.institution?.name).toContain('Test Institution')
      expect(roleAssignment.assignedAt).toBeDefined()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should assign global role without institutionId', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-global-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.KOMISIA,
          institutionId: null,
          assignedBy: tempUser.id,
        },
      })

      expect(roleAssignment.userId).toBe(tempUser.id)
      expect(roleAssignment.role).toBe(UserRole.KOMISIA)
      expect(roleAssignment.institutionId).toBeNull()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should fail to assign duplicate role for same institution', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-dup-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.GESTOR,
          institutionId: testInstitutionId,
        },
      })

      await expect(
        prisma.userRoleAssignment.create({
          data: {
            userId: tempUser.id,
            role: UserRole.GESTOR,
            institutionId: testInstitutionId,
          },
        })
      ).rejects.toThrow()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should allow same role for different institutions', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-diff-inst-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const role1 = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: testInstitutionId,
        },
      })

      const role2 = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: testInstitution2Id,
        },
      })

      expect(role1.role).toBe(UserRole.ADMIN)
      expect(role2.role).toBe(UserRole.ADMIN)
      expect(role1.institutionId).not.toBe(role2.institutionId)

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should validate role enum values', async () => {
      const validRoles = [
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.GESTOR,
        UserRole.KOMISIA,
        UserRole.UCHADZAC,
      ]

      for (const role of validRoles) {
        const tempUser = await prisma.user.create({
          data: {
            username: 'temp-enum-' + role + '-' + Date.now(),
            name: 'Temp',
            surname: 'User',
            password: 'dummy',
            role: UserRole.GESTOR,
          },
        })

        const assignment = await prisma.userRoleAssignment.create({
          data: {
            userId: tempUser.id,
            role,
            institutionId: null,
          },
        })

        expect(assignment.role).toBe(role)

        await prisma.user.delete({ where: { id: tempUser.id } })
      }
    })
  })

  describe('DELETE /api/admin/users/[id]/roles/[roleId] - Remove role', () => {
    it('should successfully delete role assignment', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-del-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.KOMISIA,
          institutionId: testInstitutionId,
        },
      })

      const roleId = roleAssignment.id

      await prisma.userRoleAssignment.delete({
        where: { id: roleId },
      })

      const deleted = await prisma.userRoleAssignment.findUnique({
        where: { id: roleId },
      })

      expect(deleted).toBeNull()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should fail to delete non-existent role', async () => {
      const fakeId = 'non-existent-role-id'

      await expect(
        prisma.userRoleAssignment.delete({
          where: { id: fakeId },
        })
      ).rejects.toThrow()
    })

    it('should cascade delete when user is deleted', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-cascade-user-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: null,
        },
      })

      const roleId = roleAssignment.id

      await prisma.user.delete({
        where: { id: tempUser.id },
      })

      const deletedRole = await prisma.userRoleAssignment.findUnique({
        where: { id: roleId },
      })

      expect(deletedRole).toBeNull()
    })

    it('should cascade delete when institution is deleted', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-cascade-inst-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const tempInstitution = await prisma.institution.create({
        data: {
          code: 'TEMP-CASCADE-' + Date.now(),
          name: 'Temp Institution ' + Date.now(),
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: tempInstitution.id,
        },
      })

      const roleId = roleAssignment.id

      await prisma.institution.delete({
        where: { id: tempInstitution.id },
      })

      const deletedRole = await prisma.userRoleAssignment.findUnique({
        where: { id: roleId },
      })

      expect(deletedRole).toBeNull()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })
  })

  describe('GET /api/admin/users/[id] - Get user with roles', () => {
    it('should return user with all role assignments', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-get-roles-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: testInstitutionId,
        },
      })

      await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.GESTOR,
          institutionId: null,
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: tempUser.id },
        include: {
          userRoles: {
            include: {
              institution: true,
            },
            orderBy: {
              assignedAt: 'desc',
            },
          },
        },
      })

      expect(user).toBeDefined()
      expect(user!.userRoles.length).toBe(2)

      const adminRole = user!.userRoles.find((r) => r.role === UserRole.ADMIN)
      expect(adminRole).toBeDefined()
      expect(adminRole!.institutionId).toBe(testInstitutionId)
      expect(adminRole!.institution?.name).toContain('Test Institution')

      const gestorRole = user!.userRoles.find((r) => r.role === UserRole.GESTOR)
      expect(gestorRole).toBeDefined()
      expect(gestorRole!.institutionId).toBeNull()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should order roles by assignedAt desc', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-order-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const role1 = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.KOMISIA,
          institutionId: null,
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 10))

      const role2 = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: testInstitutionId,
        },
      })

      const user = await prisma.user.findUnique({
        where: { id: tempUser.id },
        include: {
          userRoles: {
            orderBy: {
              assignedAt: 'desc',
            },
          },
        },
      })

      expect(user!.userRoles[0].id).toBe(role2.id)
      expect(user!.userRoles[0].assignedAt.getTime()).toBeGreaterThanOrEqual(
        user!.userRoles[1].assignedAt.getTime()
      )

      await prisma.user.delete({ where: { id: tempUser.id } })
    })
  })

  describe('Unique constraint validation', () => {
    it('should allow global role and institutional role of same type', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-unique-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const globalRole = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: null,
        },
      })

      const institutionalRole = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: testInstitutionId,
        },
      })

      expect(globalRole.institutionId).toBeNull()
      expect(institutionalRole.institutionId).toBe(testInstitutionId)

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should enforce unique constraint on userId + role + institutionId', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-constraint-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleData = {
        userId: tempUser.id,
        role: UserRole.GESTOR,
        institutionId: testInstitutionId,
      }

      await prisma.userRoleAssignment.create({
        data: roleData,
      })

      await expect(
        prisma.userRoleAssignment.create({
          data: roleData,
        })
      ).rejects.toThrow()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })
  })

  describe('AssignedBy tracking', () => {
    it('should store assignedBy user ID', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-assignedby-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.KOMISIA,
          institutionId: null,
          assignedBy: tempUser.id,
        },
      })

      expect(roleAssignment.assignedBy).toBe(tempUser.id)

      await prisma.user.delete({ where: { id: tempUser.id } })
    })

    it('should allow null assignedBy for system assignments', async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp-null-assignedby-' + Date.now(),
          name: 'Temp',
          surname: 'User',
          password: 'dummy',
          role: UserRole.GESTOR,
        },
      })

      const roleAssignment = await prisma.userRoleAssignment.create({
        data: {
          userId: tempUser.id,
          role: UserRole.ADMIN,
          institutionId: null,
          assignedBy: null,
        },
      })

      expect(roleAssignment.assignedBy).toBeNull()

      await prisma.user.delete({ where: { id: tempUser.id } })
    })
  })
})
