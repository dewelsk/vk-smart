import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { parseQuestionBattery, importQuestionBattery } from '@/lib/question-battery/importer'

describe('Question Battery', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('parses DOCX document into 10 categories with questions', async () => {
    const docPath = path.resolve(
      process.cwd(),
      'zadanie/subory/8. Hodnotiaci rozhovor/Batéria otázok RR - komisii.docx'
    )

    const categories = await parseQuestionBattery(docPath)

    expect(categories).toHaveLength(10)
    categories.forEach((category, index) => {
      expect(category.sortOrder).toBe(index + 1)
      expect(category.questions.length).toBeGreaterThan(0)
      expect(category.description.length).toBeGreaterThan(0)
    })
  })

  it('imports question battery without duplicating categories', async () => {
    const docPath = path.resolve(
      process.cwd(),
      'zadanie/subory/8. Hodnotiaci rozhovor/Batéria otázok RR - komisii.docx'
    )

    const before = await prisma.questionCategory.count()
    await importQuestionBattery(prisma, docPath)
    const after = await prisma.questionCategory.count()

    expect(after).toBe(before)

    const categories = await prisma.questionCategory.findMany({
      include: {
        questions: true,
      },
    })

    categories.forEach((category) => {
      expect(category.questions.length).toBeGreaterThan(0)
    })
  })

  it('supports CRUD operations for question categories and questions', async () => {
    const categoryName = `Test Question Category ${Date.now()}`

    const category = await prisma.questionCategory.create({
      data: {
        name: categoryName,
        description: 'Test description',
        sortOrder: 999,
      },
    })

    expect(category).toBeDefined()
    expect(category.name).toBe(categoryName)

    try {
      const createdQuestion = await prisma.questionItem.create({
        data: {
          categoryId: category.id,
          text: 'Testovacia otázka',
          sortOrder: 1,
        },
      })

      expect(createdQuestion.categoryId).toBe(category.id)

      const updatedQuestion = await prisma.questionItem.update({
        where: { id: createdQuestion.id },
        data: { text: 'Aktualizovaná otázka' },
      })

      expect(updatedQuestion.text).toBe('Aktualizovaná otázka')

      await prisma.questionItem.delete({ where: { id: createdQuestion.id } })

      const deletedQuestion = await prisma.questionItem.findUnique({
        where: { id: createdQuestion.id },
      })

      expect(deletedQuestion).toBeNull()
    } finally {
      await prisma.questionCategory.delete({ where: { id: category.id } })
    }
  })
})
