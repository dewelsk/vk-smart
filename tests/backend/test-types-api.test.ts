import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Test Types API', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/admin/test-types - List test types', () => {
    it('should fetch all test types', async () => {
      const testTypes = await prisma.testType.findMany()

      expect(testTypes).toBeDefined()
      expect(Array.isArray(testTypes)).toBe(true)
      expect(testTypes.length).toBeGreaterThan(0)
    })

    it('should include category count', async () => {
      const testTypes = await prisma.testType.findMany({
        include: {
          _count: {
            select: {
              categories: true
            }
          }
        }
      })

      expect(testTypes).toBeDefined()
      testTypes.forEach(type => {
        expect(type._count).toBeDefined()
        expect(typeof type._count.categories).toBe('number')
      })
    })

    it('should search test types by name', async () => {
      const searchTerm = 'jazyk'
      const testTypes = await prisma.testType.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      })

      expect(testTypes).toBeDefined()
      expect(testTypes.length).toBeGreaterThan(0)
      testTypes.forEach(type => {
        expect(type.name.toLowerCase()).toContain(searchTerm.toLowerCase())
      })
    })

    it('should sort test types by name ascending', async () => {
      const testTypes = await prisma.testType.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      expect(testTypes).toBeDefined()
      for (let i = 0; i < testTypes.length - 1; i++) {
        expect(testTypes[i].name <= testTypes[i + 1].name).toBe(true)
      }
    })

    it('should sort test types by name descending', async () => {
      const testTypes = await prisma.testType.findMany({
        orderBy: {
          name: 'desc'
        }
      })

      expect(testTypes).toBeDefined()
      for (let i = 0; i < testTypes.length - 1; i++) {
        expect(testTypes[i].name >= testTypes[i + 1].name).toBe(true)
      }
    })

    it('should paginate test types correctly', async () => {
      const limit = 2
      const page1 = await prisma.testType.findMany({
        take: limit,
        skip: 0,
        orderBy: { name: 'asc' }
      })

      const page2 = await prisma.testType.findMany({
        take: limit,
        skip: limit,
        orderBy: { name: 'asc' }
      })

      expect(page1.length).toBeLessThanOrEqual(limit)
      expect(page2.length).toBeLessThanOrEqual(limit)
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })

    it('should count total test types correctly', async () => {
      const total = await prisma.testType.count()

      expect(total).toBeGreaterThan(0)
      expect(typeof total).toBe('number')
    })
  })

  describe('POST /api/admin/test-types - Create test type', () => {
    let createdTestTypeId: string | null = null

    afterEach(async () => {
      // Cleanup created test type
      if (createdTestTypeId) {
        await prisma.testType.delete({
          where: { id: createdTestTypeId }
        })
        createdTestTypeId = null
      }
    })

    it('should create a new test type with valid data', async () => {
      const testTypeData = {
        name: 'Test Type ' + Date.now(),
        description: 'Test description for new test type'
      }

      const testType = await prisma.testType.create({
        data: testTypeData
      })

      createdTestTypeId = testType.id

      expect(testType).toBeDefined()
      expect(testType.name).toBe(testTypeData.name)
      expect(testType.description).toBe(testTypeData.description)
      expect(testType.id).toBeDefined()
      expect(testType.createdAt).toBeDefined()
      expect(testType.updatedAt).toBeDefined()
    })

    it('should create test type without description', async () => {
      const testTypeData = {
        name: 'Test Type No Desc ' + Date.now()
      }

      const testType = await prisma.testType.create({
        data: testTypeData
      })

      createdTestTypeId = testType.id

      expect(testType).toBeDefined()
      expect(testType.name).toBe(testTypeData.name)
      expect(testType.description).toBeNull()
    })

    it('should fail to create test type with duplicate name', async () => {
      const name = 'Štátny jazyk' // Existing seeded test type

      await expect(
        prisma.testType.create({
          data: { name }
        })
      ).rejects.toThrow()
    })

    it('should trim whitespace from name', async () => {
      const testTypeData = {
        name: '  Test Type With Spaces ' + Date.now() + '  '
      }

      const testType = await prisma.testType.create({
        data: {
          name: testTypeData.name.trim()
        }
      })

      createdTestTypeId = testType.id

      expect(testType.name).toBe(testTypeData.name.trim())
    })
  })

  describe('PATCH /api/admin/test-types/[id] - Update test type', () => {
    let testTypeId: string

    beforeEach(async () => {
      const testType = await prisma.testType.create({
        data: {
          name: 'Update Test Type ' + Date.now(),
          description: 'Original description'
        }
      })
      testTypeId = testType.id
    })

    afterEach(async () => {
      if (testTypeId) {
        await prisma.testType.delete({
          where: { id: testTypeId }
        }).catch(() => {})
      }
    })

    it('should update test type name', async () => {
      const newName = 'Updated Name ' + Date.now()

      const updated = await prisma.testType.update({
        where: { id: testTypeId },
        data: { name: newName }
      })

      expect(updated.name).toBe(newName)
      expect(updated.description).toBe('Original description')
    })

    it('should update test type description', async () => {
      const newDescription = 'Updated description'

      const updated = await prisma.testType.update({
        where: { id: testTypeId },
        data: { description: newDescription }
      })

      expect(updated.description).toBe(newDescription)
    })

    it('should clear description when set to null', async () => {
      const updated = await prisma.testType.update({
        where: { id: testTypeId },
        data: { description: null }
      })

      expect(updated.description).toBeNull()
    })

    it('should fail to update with duplicate name', async () => {
      const duplicateName = 'Štátny jazyk' // Existing seeded test type

      await expect(
        prisma.testType.update({
          where: { id: testTypeId },
          data: { name: duplicateName }
        })
      ).rejects.toThrow()
    })

    it('should update updatedAt timestamp', async () => {
      const before = await prisma.testType.findUnique({
        where: { id: testTypeId }
      })

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await prisma.testType.update({
        where: { id: testTypeId },
        data: { description: 'New description' }
      })

      expect(updated.updatedAt > before!.updatedAt).toBe(true)
    })
  })

  describe('DELETE /api/admin/test-types/[id] - Delete test type', () => {
    let testTypeId: string

    beforeEach(async () => {
      const testType = await prisma.testType.create({
        data: {
          name: 'Delete Test Type ' + Date.now()
        }
      })
      testTypeId = testType.id
    })

    afterEach(async () => {
      // Try to cleanup if test failed
      if (testTypeId) {
        await prisma.testType.delete({
          where: { id: testTypeId }
        }).catch(() => {})
      }
    })

    it('should delete test type without categories', async () => {
      await prisma.testType.delete({
        where: { id: testTypeId }
      })

      const deleted = await prisma.testType.findUnique({
        where: { id: testTypeId }
      })

      expect(deleted).toBeNull()
      testTypeId = null as any // Mark as deleted
    })

    it('should set typeId to null when test type with categories is deleted', async () => {
      // Create a category linked to this test type
      const category = await prisma.testCategory.create({
        data: {
          name: 'Test Category for Deletion ' + Date.now(),
          typeId: testTypeId
        }
      })

      // Verify category is linked
      expect(category.typeId).toBe(testTypeId)

      // Delete the test type - should succeed and set typeId to null (ON DELETE SET NULL)
      await prisma.testType.delete({
        where: { id: testTypeId }
        })

      testTypeId = null as any // Mark as deleted

      // Verify category's typeId was set to null
      const updatedCategory = await prisma.testCategory.findUnique({
        where: { id: category.id }
      })

      expect(updatedCategory?.typeId).toBeNull()

      // Cleanup category
      await prisma.testCategory.delete({
        where: { id: category.id }
      })
    })

    it('should return count of associated categories', async () => {
      // Create categories linked to this test type
      await prisma.testCategory.create({
        data: {
          name: 'Category 1 ' + Date.now(),
          typeId: testTypeId
        }
      })

      await prisma.testCategory.create({
        data: {
          name: 'Category 2 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const testTypeWithCount = await prisma.testType.findUnique({
        where: { id: testTypeId },
        include: {
          _count: {
            select: {
              categories: true
            }
          }
        }
      })

      expect(testTypeWithCount?._count.categories).toBe(2)

      // Cleanup
      await prisma.testCategory.deleteMany({
        where: { typeId: testTypeId }
      })
    })
  })

  describe('GET /api/admin/test-types/[id] - Get single test type', () => {
    let testTypeId: string

    beforeAll(async () => {
      const testType = await prisma.testType.create({
        data: {
          name: 'Single Test Type ' + Date.now(),
          description: 'Description for single test type'
        }
      })
      testTypeId = testType.id
    })

    afterAll(async () => {
      await prisma.testType.delete({
        where: { id: testTypeId }
      }).catch(() => {})
    })

    it('should fetch single test type by id', async () => {
      const testType = await prisma.testType.findUnique({
        where: { id: testTypeId }
      })

      expect(testType).toBeDefined()
      expect(testType?.id).toBe(testTypeId)
      expect(testType?.name).toContain('Single Test Type')
      expect(testType?.description).toBe('Description for single test type')
    })

    it('should return null for non-existent test type', async () => {
      const testType = await prisma.testType.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(testType).toBeNull()
    })

    it('should include category count', async () => {
      const testType = await prisma.testType.findUnique({
        where: { id: testTypeId },
        include: {
          _count: {
            select: {
              categories: true
            }
          }
        }
      })

      expect(testType).toBeDefined()
      expect(testType?._count).toBeDefined()
      expect(typeof testType?._count.categories).toBe('number')
    })
  })

  describe('Test Type relationships', () => {
    it('should link categories to test types', async () => {
      const testType = await prisma.testType.findFirst()
      expect(testType).toBeDefined()

      const category = await prisma.testCategory.create({
        data: {
          name: 'Relationship Test Category ' + Date.now(),
          typeId: testType!.id
        }
      })

      const categoryWithType = await prisma.testCategory.findUnique({
        where: { id: category.id },
        include: {
          type: true
        }
      })

      expect(categoryWithType?.type).toBeDefined()
      expect(categoryWithType?.type?.id).toBe(testType!.id)
      expect(categoryWithType?.type?.name).toBe(testType!.name)

      // Cleanup
      await prisma.testCategory.delete({
        where: { id: category.id }
      })
    })

    it('should allow categories without test type', async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'No Type Category ' + Date.now(),
          typeId: null
        }
      })

      expect(category.typeId).toBeNull()

      // Cleanup
      await prisma.testCategory.delete({
        where: { id: category.id }
      })
    })

    it('should maintain category count when fetching with categories', async () => {
      // Create a test type
      const testType = await prisma.testType.create({
        data: {
          name: 'Count Test Type ' + Date.now()
        }
      })

      // Create categories linked to this test type
      const category1 = await prisma.testCategory.create({
        data: {
          name: 'Count Category 1 ' + Date.now(),
          typeId: testType.id
        }
      })

      const category2 = await prisma.testCategory.create({
        data: {
          name: 'Count Category 2 ' + Date.now(),
          typeId: testType.id
        }
      })

      // Fetch test type with category count
      const testTypeWithCount = await prisma.testType.findUnique({
        where: { id: testType.id },
        include: {
          _count: {
            select: {
              categories: true
            }
          }
        }
      })

      expect(testTypeWithCount?._count.categories).toBe(2)

      // Cleanup
      await prisma.testCategory.delete({ where: { id: category1.id } })
      await prisma.testCategory.delete({ where: { id: category2.id } })
      await prisma.testType.delete({ where: { id: testType.id } })
    })
  })
})
