import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'


describe('Institutions API', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
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
})
