# Backend API Testovanie

## Prehľad

Backend testy sa nachádzajú v `tests/backend/` a testujú Prisma operácie a business logiku **BEZ** potreby spúšťať celý frontend alebo browser.

## Minimálne požadované testy pre CRUD API

Pre každý API endpoint vytvor testy pre:

### 1. GET (list) - načítanie zoznamu
- Základné načítanie dát
- Search (vyhľadávanie)
- Filter (filtrovanie)
- Sort (triedenie)
- Pagination (stránkovanie)
- Count (počet záznamov)
- Include relations (vzťahy medzi modelmi)

### 2. POST (create) - vytvorenie záznamu
- Úspešné vytvorenie so všetkými poľami
- Vytvorenie bez optional polí
- Chyba pri duplicate name/unique constraint
- Chyba pri neexistujúcom foreign key

### 3. PATCH (update) - úprava záznamu
- Úprava každého poľa samostatne
- Nastavenie optional polí na null
- Chyba pri duplicate name
- Automatické updatedAt timestamp

### 4. DELETE - vymazanie záznamu
- Úspešné vymazanie záznamu bez referencií
- Správne správanie pri vymazaní so vzťahmi (ON DELETE CASCADE/SET NULL)
- Count súvisiacich záznamov

### 5. GET (single) - načítanie jedného záznamu
- Úspešné načítanie podľa ID
- Null pre neexistujúci ID
- Include relations

### 6. Relationships - vzťahy medzi modelmi
- Prepojenie cez foreign key
- Query podľa vzťahu
- Aktualizácia vzťahu

## Štruktúra backend testu

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Test Categories API', () => {
  let testTypeId: string

  // Setup - vykonáva sa raz pred všetkými testmi
  beforeAll(async () => {
    await prisma.$connect()

    // Vytvor testovacie dáta pre foreign keys
    const testType = await prisma.testType.create({
      data: {
        name: 'Test Type ' + Date.now(),
        description: 'Test type for category tests'
      }
    })
    testTypeId = testType.id
  })

  // Cleanup - vykonáva sa raz po všetkých testoch
  afterAll(async () => {
    if (testTypeId) {
      await prisma.testType.delete({
        where: { id: testTypeId }
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/test-categories - List', () => {
    it('should fetch all test categories', async () => {
      const categories = await prisma.testCategory.findMany()

      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
    })

    it('should search by name', async () => {
      const categories = await prisma.testCategory.findMany({
        where: {
          name: {
            contains: 'jazyk',
            mode: 'insensitive'
          }
        }
      })

      expect(categories).toBeDefined()
      categories.forEach(category => {
        expect(category.name.toLowerCase()).toContain('jazyk')
      })
    })

    it('should filter by test type', async () => {
      const categories = await prisma.testCategory.findMany({
        where: { typeId: testTypeId }
      })

      categories.forEach(category => {
        expect(category.typeId).toBe(testTypeId)
      })
    })

    it('should sort by name ascending', async () => {
      const categories = await prisma.testCategory.findMany({
        orderBy: { name: 'asc' }
      })

      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].name <= categories[i + 1].name).toBe(true)
      }
    })

    it('should paginate correctly', async () => {
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

    it('should count total correctly', async () => {
      const total = await prisma.testCategory.count()

      expect(total).toBeGreaterThanOrEqual(0)
      expect(typeof total).toBe('number')
    })

    it('should include relations', async () => {
      const categories = await prisma.testCategory.findMany({
        include: {
          type: {
            select: { id: true, name: true }
          },
          _count: {
            select: { tests: true }
          }
        }
      })

      categories.forEach(category => {
        if (category.typeId) {
          expect(category.type).toBeDefined()
          expect(category.type?.id).toBeDefined()
        }
        expect(category._count).toBeDefined()
        expect(typeof category._count.tests).toBe('number')
      })
    })
  })

  describe('POST /api/admin/test-categories - Create', () => {
    let createdCategoryId: string | null = null

    // Cleanup po každom teste
    afterEach(async () => {
      if (createdCategoryId) {
        await prisma.testCategory.delete({
          where: { id: createdCategoryId }
        })
        createdCategoryId = null
      }
    })

    it('should create with all fields', async () => {
      const data = {
        name: 'Test Category ' + Date.now(),
        description: 'Test description',
        typeId: testTypeId
      }

      const category = await prisma.testCategory.create({
        data,
        include: {
          type: {
            select: { id: true, name: true }
          }
        }
      })

      createdCategoryId = category.id

      expect(category).toBeDefined()
      expect(category.name).toBe(data.name)
      expect(category.description).toBe(data.description)
      expect(category.typeId).toBe(data.typeId)
      expect(category.type).toBeDefined()
      expect(category.id).toBeDefined()
      expect(category.createdAt).toBeDefined()
      expect(category.updatedAt).toBeDefined()
    })

    it('should create without optional fields', async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Test Category No Desc ' + Date.now(),
          typeId: testTypeId
        }
      })

      createdCategoryId = category.id

      expect(category.description).toBeNull()
    })

    it('should fail with duplicate name', async () => {
      const category1 = await prisma.testCategory.create({
        data: { name: 'Duplicate ' + Date.now() }
      })
      createdCategoryId = category1.id

      await expect(
        prisma.testCategory.create({
          data: { name: category1.name }
        })
      ).rejects.toThrow()
    })

    it('should fail with non-existent foreign key', async () => {
      await expect(
        prisma.testCategory.create({
          data: {
            name: 'Invalid FK ' + Date.now(),
            typeId: 'non-existent-id'
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('PATCH /api/admin/test-categories/[id] - Update', () => {
    let categoryId: string

    beforeEach(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Update Test ' + Date.now(),
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

    it('should update name', async () => {
      const newName = 'Updated Name ' + Date.now()

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { name: newName }
      })

      expect(updated.name).toBe(newName)
      expect(updated.description).toBe('Original description')
    })

    it('should clear optional field with null', async () => {
      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: null }
      })

      expect(updated.description).toBeNull()
    })

    it('should fail with duplicate name', async () => {
      const duplicateName = 'Duplicate ' + Date.now()

      const category2 = await prisma.testCategory.create({
        data: { name: duplicateName }
      })

      await expect(
        prisma.testCategory.update({
          where: { id: categoryId },
          data: { name: duplicateName }
        })
      ).rejects.toThrow()

      await prisma.testCategory.delete({ where: { id: category2.id } })
    })

    it('should update updatedAt timestamp', async () => {
      const before = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: 'New description' }
      })

      expect(updated.updatedAt > before!.updatedAt).toBe(true)
    })
  })

  describe('DELETE /api/admin/test-categories/[id]', () => {
    let categoryId: string

    beforeEach(async () => {
      const category = await prisma.testCategory.create({
        data: { name: 'Delete Test ' + Date.now() }
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

    it('should delete successfully', async () => {
      await prisma.testCategory.delete({
        where: { id: categoryId }
      })

      const deleted = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      expect(deleted).toBeNull()
      categoryId = null as any
    })

    it('should return count of related records', async () => {
      const categoryWithCount = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: { tests: true }
          }
        }
      })

      expect(categoryWithCount?._count).toBeDefined()
      expect(typeof categoryWithCount?._count.tests).toBe('number')
    })
  })

  describe('GET /api/admin/test-categories/[id] - Single', () => {
    let categoryId: string

    beforeAll(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Single Test ' + Date.now(),
          description: 'Description',
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

    it('should fetch by id', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      expect(category).toBeDefined()
      expect(category?.id).toBe(categoryId)
      expect(category?.name).toContain('Single Test')
    })

    it('should return null for non-existent id', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(category).toBeNull()
    })

    it('should include relations', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          type: {
            select: { id: true, name: true }
          },
          _count: {
            select: { tests: true }
          }
        }
      })

      expect(category?.type).toBeDefined()
      expect(category?.type?.id).toBe(testTypeId)
      expect(category?._count).toBeDefined()
    })
  })

  describe('Relationships', () => {
    it('should link to related model', async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Relationship Test ' + Date.now(),
          typeId: testTypeId
        }
      })

      const categoryWithType = await prisma.testCategory.findUnique({
        where: { id: category.id },
        include: { type: true }
      })

      expect(categoryWithType?.type).toBeDefined()
      expect(categoryWithType?.type?.id).toBe(testTypeId)

      await prisma.testCategory.delete({ where: { id: category.id } })
    })

    it('should query by related model', async () => {
      const category1 = await prisma.testCategory.create({
        data: {
          name: 'Query Test 1 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const category2 = await prisma.testCategory.create({
        data: {
          name: 'Query Test 2 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const categories = await prisma.testCategory.findMany({
        where: {
          typeId: testTypeId,
          name: { contains: 'Query Test' }
        }
      })

      expect(categories.length).toBeGreaterThanOrEqual(2)
      categories.forEach(cat => {
        expect(cat.typeId).toBe(testTypeId)
      })

      await prisma.testCategory.delete({ where: { id: category1.id } })
      await prisma.testCategory.delete({ where: { id: category2.id } })
    })
  })
})
```

## Dôležité pravidlá

### 1. Používaj Date.now() pre unikátne názvy

```typescript
// ✅ SPRÁVNE: Unikátny názov pre každý test run
name: 'Test Category ' + Date.now()

// ❌ ZLE: Hardcoded názov zlyhá pri druhom spustení (duplicate)
name: 'Test Category'
```

### 2. Vždy cleanup v afterEach/afterAll

```typescript
afterEach(async () => {
  if (createdId) {
    await prisma.model.delete({
      where: { id: createdId }
    }).catch(() => {})  // catch() aby nezlyhalo ak už vymazané
    createdId = null
  }
})
```

### 3. Test aj success aj failure cases

```typescript
// Success case
it('should create successfully', async () => {
  const item = await prisma.model.create({ data: { name: 'Test' } })
  expect(item).toBeDefined()
})

// Failure case
it('should fail with duplicate name', async () => {
  await expect(
    prisma.model.create({ data: { name: existingName } })
  ).rejects.toThrow()
})
```

### 4. Test relations a counts

```typescript
it('should include related data', async () => {
  const item = await prisma.model.findUnique({
    where: { id },
    include: {
      relatedModel: true,
      _count: {
        select: { children: true }
      }
    }
  })

  expect(item?.relatedModel).toBeDefined()
  expect(typeof item?._count.children).toBe('number')
})
```

### 5. Test pagination správne

```typescript
it('should paginate correctly', async () => {
  const limit = 2
  const page1 = await prisma.model.findMany({
    take: limit,
    skip: 0,
    orderBy: { name: 'asc' }
  })

  const page2 = await prisma.model.findMany({
    take: limit,
    skip: limit,
    orderBy: { name: 'asc' }
  })

  expect(page1.length).toBeLessThanOrEqual(limit)
  expect(page2.length).toBeLessThanOrEqual(limit)

  // Verify different records
  if (page1.length > 0 && page2.length > 0) {
    expect(page1[0].id).not.toBe(page2[0].id)
  }
})
```

## Kontrolný zoznam

Po vytvorení API route:

- [ ] Vytvorený test súbor v `tests/backend/[názov]-api.test.ts`
- [ ] `beforeAll` - pripojenie k DB a vytvorenie test fixtures
- [ ] `afterAll` - vyčistenie fixtures a odpojenie od DB
- [ ] `afterEach` - cleanup vytvorených dát v každom teste
- [ ] **GET (list)** - fetch all, search, filter, sort, pagination, count, relations
- [ ] **POST (create)** - success, without optional, duplicate error, invalid FK
- [ ] **PATCH (update)** - update každého poľa, set null, duplicate error, updatedAt
- [ ] **DELETE** - success, related records behavior
- [ ] **GET (single)** - by ID, non-existent ID, relations
- [ ] **Relationships** - link, query by relation
- [ ] Všetky názvy používajú `Date.now()` pre unikátnosť
- [ ] Všetky testy robia cleanup po sebe

## Spustenie testov

```bash
# Všetky backend testy
npm run test:backend

# Watch mode
npm run test:backend:watch

# Špecifický súbor
npm run test:backend -- tests/backend/test-categories-api.test.ts
```

## Prečo je to dôležité?

- ✅ Overenie že Prisma schéma a queries fungujú správne
- ✅ Catch database constraint violations
- ✅ Validácia business logiky pred E2E testami
- ✅ Rýchlejšie ako E2E testy (žiadny browser overhead)
- ✅ Overenie ON DELETE CASCADE/SET NULL správania
- ✅ Testovanie edge cases (null values, duplicates, missing relations)

## Príklady v projekte

Kompletné príklady backend testov:
- **CRUD operácie:** [tests/backend/test-categories-api.test.ts](../../tests/backend/test-categories-api.test.ts)
  - GET list: lines 30-113
  - POST create: lines 115-165
  - PATCH update: lines 167-220
  - DELETE: lines 222-260
  - Relationships: lines 262-305
- **Ďalšie príklady:**
  - [tests/backend/tests-api.test.ts](../../tests/backend/tests-api.test.ts)
  - [tests/backend/institutions-api.test.ts](../../tests/backend/institutions-api.test.ts)
