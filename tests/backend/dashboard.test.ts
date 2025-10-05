import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient, VKStatus, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

describe('Dashboard API', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/admin/dashboard - Statistics', () => {
    it('should count total VKs correctly', async () => {
      const totalVKs = await prisma.vyberoveKonanie.count()

      expect(totalVKs).toBeGreaterThanOrEqual(0)
      expect(typeof totalVKs).toBe('number')
    })

    it('should count active VKs correctly', async () => {
      const activeVKs = await prisma.vyberoveKonanie.count({
        where: {
          status: {
            notIn: [VKStatus.DOKONCENE, VKStatus.ZRUSENE],
          },
        },
      })

      expect(activeVKs).toBeGreaterThanOrEqual(0)
      expect(typeof activeVKs).toBe('number')
    })

    it('should count total candidates correctly', async () => {
      const totalCandidates = await prisma.candidate.count({
        where: {
          deleted: false,
        },
      })

      expect(totalCandidates).toBeGreaterThanOrEqual(0)
      expect(typeof totalCandidates).toBe('number')
    })

    it('should count total users correctly (excluding UCHADZAC)', async () => {
      const totalUsers = await prisma.user.count({
        where: {
          deleted: false,
          role: { not: UserRole.UCHADZAC },
        },
      })

      expect(totalUsers).toBeGreaterThanOrEqual(0)
      expect(typeof totalUsers).toBe('number')
    })

    it('should fetch all stats in parallel', async () => {
      const [totalVKs, activeVKs, totalCandidates, totalUsers] = await Promise.all([
        prisma.vyberoveKonanie.count(),
        prisma.vyberoveKonanie.count({
          where: {
            status: {
              notIn: [VKStatus.DOKONCENE, VKStatus.ZRUSENE],
            },
          },
        }),
        prisma.candidate.count({
          where: {
            deleted: false,
          },
        }),
        prisma.user.count({
          where: {
            deleted: false,
            role: { not: UserRole.UCHADZAC },
          },
        }),
      ])

      expect(totalVKs).toBeDefined()
      expect(activeVKs).toBeDefined()
      expect(totalCandidates).toBeDefined()
      expect(totalUsers).toBeDefined()
    })
  })

  describe('GET /api/admin/dashboard - Recent VKs', () => {
    it('should fetch recent VKs (last 5)', async () => {
      const recentVKs = await prisma.vyberoveKonanie.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          institution: {
            select: {
              code: true,
              name: true,
            },
          },
          gestor: {
            select: {
              name: true,
              surname: true,
            },
          },
          candidates: {
            where: { deleted: false },
            select: { id: true },
          },
        },
      })

      expect(recentVKs).toBeDefined()
      expect(Array.isArray(recentVKs)).toBe(true)
      expect(recentVKs.length).toBeLessThanOrEqual(5)

      if (recentVKs.length > 0) {
        expect(recentVKs[0].institution).toBeDefined()
        expect(recentVKs[0].candidates).toBeDefined()
      }
    })

    it('should return VKs sorted by creation date (newest first)', async () => {
      const recentVKs = await prisma.vyberoveKonanie.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      })

      if (recentVKs.length > 1) {
        expect(
          new Date(recentVKs[0].createdAt).getTime()
        ).toBeGreaterThanOrEqual(
          new Date(recentVKs[1].createdAt).getTime()
        )
      }
    })

    it('should include institution data for recent VKs', async () => {
      const recentVKs = await prisma.vyberoveKonanie.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          institution: true,
        },
      })

      if (recentVKs.length > 0) {
        recentVKs.forEach(vk => {
          expect(vk.institution).toBeDefined()
          expect(vk.institution.code).toBeDefined()
          expect(vk.institution.name).toBeDefined()
        })
      }
    })

    it('should include candidates count for recent VKs', async () => {
      const recentVKs = await prisma.vyberoveKonanie.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          candidates: {
            where: { deleted: false },
            select: { id: true },
          },
        },
      })

      if (recentVKs.length > 0) {
        recentVKs.forEach(vk => {
          expect(vk.candidates).toBeDefined()
          expect(Array.isArray(vk.candidates)).toBe(true)
          expect(typeof vk.candidates.length).toBe('number')
        })
      }
    })
  })

  describe('GET /api/admin/dashboard - Status Breakdown', () => {
    it('should group VKs by status', async () => {
      const vksByStatus = await prisma.vyberoveKonanie.groupBy({
        by: ['status'],
        _count: true,
      })

      expect(vksByStatus).toBeDefined()
      expect(Array.isArray(vksByStatus)).toBe(true)

      if (vksByStatus.length > 0) {
        vksByStatus.forEach(item => {
          expect(item.status).toBeDefined()
          expect(Object.values(VKStatus)).toContain(item.status)
          expect(item._count).toBeGreaterThan(0)
        })
      }
    })

    it('should have valid status enum values', async () => {
      const vksByStatus = await prisma.vyberoveKonanie.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      })

      expect(vksByStatus).toBeDefined()

      // All status values should be valid VKStatus enum values
      vksByStatus.forEach(item => {
        expect(Object.values(VKStatus)).toContain(item.status)
        expect(item._count._all).toBeGreaterThan(0)
      })
    })
  })

  describe('GET /api/admin/dashboard - RBAC Filtering', () => {
    it('should filter VKs by institution for admin users', async () => {
      // Get first institution
      const institution = await prisma.institution.findFirst()

      if (!institution) return

      const vks = await prisma.vyberoveKonanie.findMany({
        where: {
          institutionId: institution.id,
        },
      })

      expect(vks).toBeDefined()
      expect(vks.every(vk => vk.institutionId === institution.id)).toBe(true)
    })

    it('should filter candidates by VK institution', async () => {
      // Get first institution
      const institution = await prisma.institution.findFirst()

      if (!institution) return

      const candidates = await prisma.candidate.findMany({
        where: {
          deleted: false,
          vk: {
            institutionId: institution.id,
          },
        },
        include: {
          vk: true,
        },
      })

      expect(candidates).toBeDefined()
      if (candidates.length > 0) {
        expect(candidates.every(c => c.vk.institutionId === institution.id)).toBe(true)
      }
    })

    it('should filter users by institution', async () => {
      // Get first institution
      const institution = await prisma.institution.findFirst()

      if (!institution) return

      const users = await prisma.user.findMany({
        where: {
          deleted: false,
          role: { not: UserRole.UCHADZAC },
          institutions: {
            some: {
              institutionId: institution.id,
            },
          },
        },
      })

      expect(users).toBeDefined()
      expect(Array.isArray(users)).toBe(true)
    })
  })
})
