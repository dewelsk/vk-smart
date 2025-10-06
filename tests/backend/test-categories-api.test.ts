import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Test Categories API', () => {
  let testTypeId: string

  beforeAll(async () => {
    await prisma.$connect()

    // Create a test type to use in tests
    const testType = await prisma.testType.create({
      data: {
        name: 'Test Type for Categories ' + Date.now(),
        description: 'Test type for category tests'
      }
    })
    testTypeId = testType.id
  })

  afterAll(async () => {
    // Cleanup test type
    if (testTypeId) {
      await prisma.testType.delete({
        where: { id: testTypeId }
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/test-categories - List test categories', () => {
    it('should fetch all test categories', async () => {
      const categories = await prisma.testCategory.findMany()

      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
    })

    it('should include test type information', async () => {
      const categories = await prisma.testCategory.findMany({
        include: {
          type: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      expect(categories).toBeDefined()
      categories.forEach(category => {
        if (category.typeId) {
          expect(category.type).toBeDefined()
          expect(category.type?.id).toBeDefined()
          expect(category.type?.name).toBeDefined()
        }
      })
    })

    it('should include test count', async () => {
      const categories = await prisma.testCategory.findMany({
        include: {
          _count: {
            select: {
              tests: true
            }
          }
        }
      })

      expect(categories).toBeDefined()
      categories.forEach(category => {
        expect(category._count).toBeDefined()
        expect(typeof category._count.tests).toBe('number')
      })
    })

    it('should search test categories by name', async () => {
      const searchTerm = 'jazyk'
      const categories = await prisma.testCategory.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      })

      expect(categories).toBeDefined()
      if (categories.length > 0) {
        categories.forEach(category => {
          expect(category.name.toLowerCase()).toContain(searchTerm.toLowerCase())
        })
      }
    })

    it('should filter categories by test type', async () => {
      const categories = await prisma.testCategory.findMany({
        where: {
          typeId: testTypeId
        }
      })

      expect(categories).toBeDefined()
      categories.forEach(category => {
        expect(category.typeId).toBe(testTypeId)
      })
    })

    it('should sort test categories by name ascending', async () => {
      const categories = await prisma.testCategory.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      expect(categories).toBeDefined()
      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].name <= categories[i + 1].name).toBe(true)
      }
    })

    it('should sort test categories by name descending', async () => {
      const categories = await prisma.testCategory.findMany({
        orderBy: {
          name: 'desc'
        }
      })

      expect(categories).toBeDefined()
      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].name >= categories[i + 1].name).toBe(true)
      }
    })

    it('should paginate test categories correctly', async () => {
      const limit = 2
      const page1 = await prisma.testCategory.findMany({
        take: limit,
        skip: 0,
        orderBy: { name: 'asc' }
      })

      const page2 = await prisma.testCategory.findMany({
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

    it('should count total test categories correctly', async () => {
      const total = await prisma.testCategory.count()

      expect(total).toBeGreaterThanOrEqual(0)
      expect(typeof total).toBe('number')
    })
  })

  describe('POST /api/admin/test-categories - Create test category', () => {
    let createdCategoryId: string | null = null

    afterEach(async () => {
      // Cleanup created category
      if (createdCategoryId) {
        await prisma.testCategory.delete({
          where: { id: createdCategoryId }
        })
        createdCategoryId = null
      }
    })

    it('should create a new test category with valid data', async () => {
      const categoryData = {
        name: 'Test Category ' + Date.now(),
        description: 'Test description for new category',
        typeId: testTypeId
      }

      const category = await prisma.testCategory.create({
        data: categoryData,
        include: {
          type: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      createdCategoryId = category.id

      expect(category).toBeDefined()
      expect(category.name).toBe(categoryData.name)
      expect(category.description).toBe(categoryData.description)
      expect(category.typeId).toBe(categoryData.typeId)
      expect(category.type).toBeDefined()
      expect(category.id).toBeDefined()
      expect(category.createdAt).toBeDefined()
      expect(category.updatedAt).toBeDefined()
    })

    it('should create category without description', async () => {
      const categoryData = {
        name: 'Test Category No Desc ' + Date.now(),
        typeId: testTypeId
      }

      const category = await prisma.testCategory.create({
        data: categoryData
      })

      createdCategoryId = category.id

      expect(category).toBeDefined()
      expect(category.name).toBe(categoryData.name)
      expect(category.description).toBeNull()
      expect(category.typeId).toBe(testTypeId)
    })

    it('should create category without test type', async () => {
      const categoryData = {
        name: 'Test Category No Type ' + Date.now()
      }

      const category = await prisma.testCategory.create({
        data: categoryData
      })

      createdCategoryId = category.id

      expect(category).toBeDefined()
      expect(category.name).toBe(categoryData.name)
      expect(category.typeId).toBeNull()
    })

    it('should fail to create category with duplicate name', async () => {
      // Create first category
      const category1 = await prisma.testCategory.create({
        data: {
          name: 'Duplicate Category ' + Date.now()
        }
      })
      createdCategoryId = category1.id

      // Try to create another with same name
      await expect(
        prisma.testCategory.create({
          data: {
            name: category1.name
          }
        })
      ).rejects.toThrow()
    })

    it('should fail to create category with non-existent test type', async () => {
      await expect(
        prisma.testCategory.create({
          data: {
            name: 'Invalid Type Category ' + Date.now(),
            typeId: 'non-existent-id'
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('PATCH /api/admin/test-categories/[id] - Update test category', () => {
    let categoryId: string

    beforeEach(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Update Test Category ' + Date.now(),
          description: 'Original description',
          typeId: testTypeId
        }
      })
      categoryId = category.id
    })

    afterEach(async () => {
      if (categoryId) {
        await prisma.testCategory.delete({
          where: { id: categoryId }
        }).catch(() => {})
      }
    })

    it('should update category name', async () => {
      const newName = 'Updated Name ' + Date.now()

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { name: newName }
      })

      expect(updated.name).toBe(newName)
      expect(updated.description).toBe('Original description')
      expect(updated.typeId).toBe(testTypeId)
    })

    it('should update category description', async () => {
      const newDescription = 'Updated description'

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: newDescription }
      })

      expect(updated.description).toBe(newDescription)
    })

    it('should update category test type', async () => {
      // Create another test type
      const newTestType = await prisma.testType.create({
        data: {
          name: 'New Test Type ' + Date.now()
        }
      })

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { typeId: newTestType.id }
      })

      expect(updated.typeId).toBe(newTestType.id)

      // Cleanup
      await prisma.testType.delete({
        where: { id: newTestType.id }
      })
    })

    it('should clear test type when set to null', async () => {
      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { typeId: null }
      })

      expect(updated.typeId).toBeNull()
    })

    it('should clear description when set to null', async () => {
      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: null }
      })

      expect(updated.description).toBeNull()
    })

    it('should fail to update with duplicate name', async () => {
      const duplicateName = 'Duplicate Name ' + Date.now()

      // Create another category
      const category2 = await prisma.testCategory.create({
        data: {
          name: duplicateName
        }
      })

      // Try to update first category with duplicate name
      await expect(
        prisma.testCategory.update({
          where: { id: categoryId },
          data: { name: duplicateName }
        })
      ).rejects.toThrow()

      // Cleanup
      await prisma.testCategory.delete({
        where: { id: category2.id }
      })
    })

    it('should update updatedAt timestamp', async () => {
      const before = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: 'New description' }
      })

      expect(updated.updatedAt > before!.updatedAt).toBe(true)
    })
  })

  describe('DELETE /api/admin/test-categories/[id] - Delete test category', () => {
    let categoryId: string

    beforeEach(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Delete Test Category ' + Date.now()
        }
      })
      categoryId = category.id
    })

    afterEach(async () => {
      // Try to cleanup if test failed
      if (categoryId) {
        await prisma.testCategory.delete({
          where: { id: categoryId }
        }).catch(() => {})
      }
    })

    it('should delete test category without tests', async () => {
      await prisma.testCategory.delete({
        where: { id: categoryId }
      })

      const deleted = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      expect(deleted).toBeNull()
      categoryId = null as any // Mark as deleted
    })

    it('should return count of associated tests', async () => {
      const categoryWithCount = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              tests: true
            }
          }
        }
      })

      expect(categoryWithCount?._count).toBeDefined()
      expect(typeof categoryWithCount?._count.tests).toBe('number')
    })
  })

  describe('GET /api/admin/test-categories/[id] - Get single test category', () => {
    let categoryId: string

    beforeAll(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Single Test Category ' + Date.now(),
          description: 'Description for single category',
          typeId: testTypeId
        }
      })
      categoryId = category.id
    })

    afterAll(async () => {
      await prisma.testCategory.delete({
        where: { id: categoryId }
      }).catch(() => {})
    })

    it('should fetch single test category by id', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      expect(category).toBeDefined()
      expect(category?.id).toBe(categoryId)
      expect(category?.name).toContain('Single Test Category')
      expect(category?.description).toBe('Description for single category')
      expect(category?.typeId).toBe(testTypeId)
    })

    it('should return null for non-existent category', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(category).toBeNull()
    })

    it('should include test type information', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          type: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      expect(category).toBeDefined()
      expect(category?.type).toBeDefined()
      expect(category?.type?.id).toBe(testTypeId)
    })

    it('should include test count', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              tests: true
            }
          }
        }
      })

      expect(category).toBeDefined()
      expect(category?._count).toBeDefined()
      expect(typeof category?._count.tests).toBe('number')
    })
  })

  describe('Test Category relationships', () => {
    it('should link categories to test types', async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Relationship Test Category ' + Date.now(),
          typeId: testTypeId
        }
      })

      const categoryWithType = await prisma.testCategory.findUnique({
        where: { id: category.id },
        include: {
          type: true
        }
      })

      expect(categoryWithType?.type).toBeDefined()
      expect(categoryWithType?.type?.id).toBe(testTypeId)

      // Cleanup
      await prisma.testCategory.delete({
        where: { id: category.id }
      })
    })

    it('should allow updating category test type', async () => {
      // Create category without type
      const category = await prisma.testCategory.create({
        data: {
          name: 'Type Update Category ' + Date.now()
        }
      })

      expect(category.typeId).toBeNull()

      // Update to add test type
      const updated = await prisma.testCategory.update({
        where: { id: category.id },
        data: { typeId: testTypeId }
      })

      expect(updated.typeId).toBe(testTypeId)

      // Cleanup
      await prisma.testCategory.delete({
        where: { id: category.id }
      })
    })

    it('should query categories by test type', async () => {
      // Create multiple categories with same test type
      const category1 = await prisma.testCategory.create({
        data: {
          name: 'Type Query Category 1 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const category2 = await prisma.testCategory.create({
        data: {
          name: 'Type Query Category 2 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const categories = await prisma.testCategory.findMany({
        where: {
          typeId: testTypeId,
          name: {
            contains: 'Type Query Category'
          }
        }
      })

      expect(categories.length).toBeGreaterThanOrEqual(2)
      categories.forEach(cat => {
        expect(cat.typeId).toBe(testTypeId)
      })

      // Cleanup
      await prisma.testCategory.delete({ where: { id: category1.id } })
      await prisma.testCategory.delete({ where: { id: category2.id } })
    })
  })
})
