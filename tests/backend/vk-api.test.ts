import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { PrismaClient, UserRole, VKStatus } from '@prisma/client'

const prisma = new PrismaClient()

describe('VK API', () => {
  let testInstitutionId: string | null = null
  let testSuperadminId: string | null = null
  let testVKId: string | null = null

  beforeAll(async () => {
    await prisma.$connect()

    // Get test institution
    const institution = await prisma.institution.findFirst()
    testInstitutionId = institution!.id

    // Get superadmin user
    const superadmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPERADMIN },
    })
    testSuperadminId = superadmin!.id
  })

  afterAll(async () => {
    // Cleanup
    if (testVKId) {
      await prisma.vyberoveKonanie.delete({ where: { id: testVKId } })
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/vk', () => {
    it('should fetch VK list', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        take: 10,
      })

      expect(vks).toBeDefined()
      expect(Array.isArray(vks)).toBe(true)
    })

    it('should filter VK by status', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        where: {
          status: VKStatus.PRIPRAVA,
        },
      })

      expect(vks).toBeDefined()
      expect(vks.every(vk => vk.status === VKStatus.PRIPRAVA)).toBe(true)
    })

    it('should filter VK by institution', async () => {
      if (!testInstitutionId) return

      const vks = await prisma.vyberoveKonanie.findMany({
        where: {
          institutionId: testInstitutionId,
        },
      })

      expect(vks).toBeDefined()
      expect(vks.every(vk => vk.institutionId === testInstitutionId)).toBe(true)
    })

    it('should search VK by identifier', async () => {
      const searchTerm = 'VK'
      const vks = await prisma.vyberoveKonanie.findMany({
        where: {
          identifier: { contains: searchTerm, mode: 'insensitive' },
        },
      })

      expect(vks).toBeDefined()
    })

    it('should search VK by position', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        where: {
          position: { contains: 'a', mode: 'insensitive' },
        },
      })

      expect(vks).toBeDefined()
    })

    it('should include institution data', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        include: {
          institution: true,
        },
        take: 1,
      })

      if (vks.length > 0) {
        expect(vks[0].institution).toBeDefined()
        expect(vks[0].institution.name).toBeDefined()
        expect(vks[0].institution.code).toBeDefined()
      }
    })

    it('should include gestor data', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        include: {
          gestor: true,
        },
        take: 10,
      })

      if (vks.length > 0) {
        const vkWithGestor = vks.find(vk => vk.gestor !== null)
        if (vkWithGestor) {
          expect(vkWithGestor.gestor).toBeDefined()
          expect(vkWithGestor.gestor!.name).toBeDefined()
        }
      }
    })

    it('should include candidates count', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        include: {
          candidates: {
            select: { id: true },
          },
        },
        take: 1,
      })

      if (vks.length > 0) {
        expect(vks[0].candidates).toBeDefined()
        expect(Array.isArray(vks[0].candidates)).toBe(true)
      }
    })

    it('should support pagination', async () => {
      const page1 = await prisma.vyberoveKonanie.findMany({
        skip: 0,
        take: 5,
      })

      const page2 = await prisma.vyberoveKonanie.findMany({
        skip: 5,
        take: 5,
      })

      expect(page1).toBeDefined()
      expect(page2).toBeDefined()

      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })

    it('should support sorting by identifier', async () => {
      const vksAsc = await prisma.vyberoveKonanie.findMany({
        orderBy: { identifier: 'asc' },
        take: 5,
      })

      const vksDesc = await prisma.vyberoveKonanie.findMany({
        orderBy: { identifier: 'desc' },
        take: 5,
      })

      expect(vksAsc).toBeDefined()
      expect(vksDesc).toBeDefined()

      if (vksAsc.length > 1) {
        expect(vksAsc[0].identifier.localeCompare(vksAsc[1].identifier)).toBeLessThanOrEqual(0)
      }
    })

    it('should support sorting by date', async () => {
      const vks = await prisma.vyberoveKonanie.findMany({
        orderBy: { date: 'desc' },
        take: 5,
      })

      expect(vks).toBeDefined()

      if (vks.length > 1) {
        expect(new Date(vks[0].date).getTime()).toBeGreaterThanOrEqual(
          new Date(vks[1].date).getTime()
        )
      }
    })
  })

  describe('POST /api/admin/vk', () => {
    afterEach(async () => {
      if (testVKId) {
        await prisma.vyberoveKonanie.delete({ where: { id: testVKId } })
        testVKId = null
      }
    })

    it('should create a new VK', async () => {
      const identifier = 'TEST-VK-' + Date.now()

      const vk = await prisma.vyberoveKonanie.create({
        data: {
          identifier,
          institutionId: testInstitutionId!,
          selectionType: 'Výberové konanie',
          organizationalUnit: 'Test Unit',
          serviceField: 'Test Field',
          position: 'Test Position',
          serviceType: 'Test Type',
          date: new Date(),
          numberOfPositions: 1,
          createdById: testSuperadminId!,
        },
      })

      testVKId = vk.id

      expect(vk).toBeDefined()
      expect(vk.identifier).toBe(identifier)
      expect(vk.institutionId).toBe(testInstitutionId)
      expect(vk.status).toBe(VKStatus.PRIPRAVA)
    })

    it('should fail with duplicate identifier', async () => {
      const identifier = 'DUPLICATE-VK-' + Date.now()

      // Create first VK
      const first = await prisma.vyberoveKonanie.create({
        data: {
          identifier,
          institutionId: testInstitutionId!,
          selectionType: 'Výberové konanie',
          organizationalUnit: 'Test Unit',
          serviceField: 'Test Field',
          position: 'Test Position',
          serviceType: 'Test Type',
          date: new Date(),
          createdById: testSuperadminId!,
        },
      })
      testVKId = first.id

      // Try to create duplicate
      await expect(
        prisma.vyberoveKonanie.create({
          data: {
            identifier, // Same identifier
            institutionId: testInstitutionId!,
            selectionType: 'Výberové konanie',
            organizationalUnit: 'Test Unit 2',
            serviceField: 'Test Field 2',
            position: 'Test Position 2',
            serviceType: 'Test Type 2',
            date: new Date(),
            createdById: testSuperadminId!,
          },
        })
      ).rejects.toThrow()
    })

    it('should set default status to PRIPRAVA', async () => {
      const vk = await prisma.vyberoveKonanie.create({
        data: {
          identifier: 'DEFAULT-STATUS-VK-' + Date.now(),
          institutionId: testInstitutionId!,
          selectionType: 'Výberové konanie',
          organizationalUnit: 'Test Unit',
          serviceField: 'Test Field',
          position: 'Test Position',
          serviceType: 'Test Type',
          date: new Date(),
          createdById: testSuperadminId!,
        },
      })

      testVKId = vk.id

      expect(vk.status).toBe(VKStatus.PRIPRAVA)
    })

    it('should set default numberOfPositions to 1', async () => {
      const vk = await prisma.vyberoveKonanie.create({
        data: {
          identifier: 'DEFAULT-POSITIONS-VK-' + Date.now(),
          institutionId: testInstitutionId!,
          selectionType: 'Výberové konanie',
          organizationalUnit: 'Test Unit',
          serviceField: 'Test Field',
          position: 'Test Position',
          serviceType: 'Test Type',
          date: new Date(),
          createdById: testSuperadminId!,
        },
      })

      testVKId = vk.id

      expect(vk.numberOfPositions).toBe(1)
    })

    it('should create VK with gestor', async () => {
      const gestor = await prisma.user.findFirst({
        where: { role: UserRole.GESTOR },
      })

      if (!gestor) {
        // Skip test if no gestor exists
        return
      }

      const vk = await prisma.vyberoveKonanie.create({
        data: {
          identifier: 'VK-WITH-GESTOR-' + Date.now(),
          institutionId: testInstitutionId!,
          selectionType: 'Výberové konanie',
          organizationalUnit: 'Test Unit',
          serviceField: 'Test Field',
          position: 'Test Position',
          serviceType: 'Test Type',
          date: new Date(),
          gestorId: gestor.id,
          createdById: testSuperadminId!,
        },
        include: {
          gestor: true,
        },
      })

      testVKId = vk.id

      expect(vk.gestorId).toBe(gestor.id)
      expect(vk.gestor).toBeDefined()
      expect(vk.gestor!.id).toBe(gestor.id)
    })
  })

  describe('GET /api/admin/vk/[id]', () => {
    beforeAll(async () => {
      if (!testVKId) {
        const vk = await prisma.vyberoveKonanie.create({
          data: {
            identifier: 'DETAIL-VK-' + Date.now(),
            institutionId: testInstitutionId!,
            selectionType: 'Výberové konanie',
            organizationalUnit: 'Test Unit',
            serviceField: 'Test Field',
            position: 'Test Position',
            serviceType: 'Test Type',
            date: new Date(),
            createdById: testSuperadminId!,
          },
        })
        testVKId = vk.id
      }
    })

    it('should fetch VK detail by id', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: testVKId! },
        include: {
          institution: true,
          gestor: true,
          createdBy: true,
        },
      })

      expect(vk).toBeDefined()
      expect(vk?.id).toBe(testVKId)
      expect(vk?.institution).toBeDefined()
    })

    it('should include candidates', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: testVKId! },
        include: {
          candidates: {
            where: { deleted: false },
            include: {
              user: true,
            },
          },
        },
      })

      expect(vk).toBeDefined()
      expect(Array.isArray(vk?.candidates)).toBe(true)
    })

    it('should include assigned tests', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: testVKId! },
        include: {
          assignedTests: {
            include: {
              test: true,
            },
          },
        },
      })

      expect(vk).toBeDefined()
      expect(Array.isArray(vk?.assignedTests)).toBe(true)
    })

    it('should include commission data', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: testVKId! },
        include: {
          commission: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      })

      expect(vk).toBeDefined()
      // Commission is optional, so we just check the query doesn't fail
    })

    it('should include evaluation config', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: testVKId! },
        include: {
          evaluationConfig: true,
        },
      })

      expect(vk).toBeDefined()
      // Evaluation config is optional
    })

    it('should return null for non-existent id', async () => {
      const vk = await prisma.vyberoveKonanie.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(vk).toBeNull()
    })
  })

  describe('PUT /api/admin/vk/[id]', () => {
    beforeAll(async () => {
      if (!testVKId) {
        const vk = await prisma.vyberoveKonanie.create({
          data: {
            identifier: 'UPDATE-VK-' + Date.now(),
            institutionId: testInstitutionId!,
            selectionType: 'Výberové konanie',
            organizationalUnit: 'Test Unit',
            serviceField: 'Test Field',
            position: 'Test Position',
            serviceType: 'Test Type',
            date: new Date(),
            createdById: testSuperadminId!,
          },
        })
        testVKId = vk.id
      }
    })

    it('should update VK position', async () => {
      const newPosition = 'Updated Position ' + Date.now()

      const updated = await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: { position: newPosition },
      })

      expect(updated.position).toBe(newPosition)
    })

    it('should update VK status', async () => {
      const updated = await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: { status: VKStatus.TESTOVANIE },
      })

      expect(updated.status).toBe(VKStatus.TESTOVANIE)

      // Reset
      await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: { status: VKStatus.PRIPRAVA },
      })
    })

    it('should update VK numberOfPositions', async () => {
      const updated = await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: { numberOfPositions: 5 },
      })

      expect(updated.numberOfPositions).toBe(5)
    })

    it('should update VK date', async () => {
      const newDate = new Date('2025-12-31')

      const updated = await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: { date: newDate },
      })

      expect(new Date(updated.date).toISOString()).toBe(newDate.toISOString())
    })

    it('should update VK gestor', async () => {
      const gestor = await prisma.user.findFirst({
        where: { role: UserRole.GESTOR },
      })

      if (!gestor) {
        // Skip if no gestor exists
        return
      }

      const updated = await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: { gestorId: gestor.id },
      })

      expect(updated.gestorId).toBe(gestor.id)
    })

    it('should update multiple fields at once', async () => {
      const updated = await prisma.vyberoveKonanie.update({
        where: { id: testVKId! },
        data: {
          position: 'Multi Update Position',
          organizationalUnit: 'Multi Update Unit',
          serviceField: 'Multi Update Field',
        },
      })

      expect(updated.position).toBe('Multi Update Position')
      expect(updated.organizationalUnit).toBe('Multi Update Unit')
      expect(updated.serviceField).toBe('Multi Update Field')
    })
  })
})
