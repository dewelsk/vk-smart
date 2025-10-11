import { PrismaClient } from '@prisma/client'
import mammoth from 'mammoth'

export const CATEGORY_DEFINITIONS = [
  'Sebadôvera',
  'Svedomitosť a spoľahlivosť',
  'Samostatnosť',
  'Motivácia',
  'Adaptabilita a flexibilita',
  'Schopnosť pracovať pod tlakom',
  'Rozhodovacia schopnosť',
  'Komunikačné zručnosti',
  'Analytické, koncepčné a strategické myslenie',
  'Riadiace schopnosti',
] as const

export type CategoryName = typeof CATEGORY_DEFINITIONS[number]

export type QuestionCategoryPayload = {
  name: CategoryName
  description: string
  questions: string[]
  sortOrder: number
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Z0-9]+/gi, '')
    .toUpperCase()
}

function isDescriptionLine(line: string): boolean {
  const match = line.match(/\p{L}/u)
  if (!match) {
    return false
  }
  const firstLetter = match[0]
  return firstLetter === firstLetter.toLowerCase()
}

function normalizeText(line: string): string {
  return line.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function parseQuestionBattery(docPath: string): Promise<QuestionCategoryPayload[]> {
  const result = await mammoth.extractRawText({ path: docPath })
  const allLines = result.value
    .split('\n')
    .map((line) => normalizeText(line))
    .filter((line) => line.length > 0)

  const categoryMap = new Map(
    CATEGORY_DEFINITIONS.map((name, index) => [normalizeKey(name), { name, sortOrder: index + 1 }])
  )

  const parsedCategories: QuestionCategoryPayload[] = []

  let current: QuestionCategoryPayload | null = null
  let descriptionBuffer: string[] = []
  let descriptionFinalized = false

  const finalizeCurrent = () => {
    if (!current) {
      return
    }

    if (!descriptionFinalized) {
      current.description = normalizeText(descriptionBuffer.join(' '))
    }

    parsedCategories.push(current)
    current = null
    descriptionBuffer = []
    descriptionFinalized = false
  }

  for (const line of allLines) {
    const key = normalizeKey(line)

    if (categoryMap.has(key)) {
      finalizeCurrent()
      const { name, sortOrder } = categoryMap.get(key)!
      current = {
        name,
        description: '',
        questions: [],
        sortOrder,
      }
      descriptionBuffer = []
      descriptionFinalized = false
      continue
    }

    if (!current) {
      continue
    }

    if (!descriptionFinalized) {
      if (isDescriptionLine(line)) {
        descriptionBuffer.push(line)
        continue
      }

      current.description = normalizeText(descriptionBuffer.join(' '))
      descriptionFinalized = true
    }

    if (line.length > 0) {
      current.questions.push(line)
    }
  }

  finalizeCurrent()

  if (parsedCategories.length !== CATEGORY_DEFINITIONS.length) {
    const foundNames = parsedCategories.map((category) => category.name).join(', ')
    throw new Error(
      `Očakávaných bolo ${CATEGORY_DEFINITIONS.length} kategórií, ale našlo sa ${parsedCategories.length}. ` +
        `Načítané kategórie: ${foundNames}`
    )
  }

  for (const expectedName of CATEGORY_DEFINITIONS) {
    if (!parsedCategories.some((category) => category.name === expectedName)) {
      throw new Error(`V dokumente sa nenašla očakávaná kategória "${expectedName}"`)
    }
  }

  return parsedCategories
}

export async function upsertQuestionBattery(
  prisma: PrismaClient,
  categories: QuestionCategoryPayload[]
): Promise<void> {
  for (const category of categories) {
    const upsertedCategory = await prisma.questionCategory.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        sortOrder: category.sortOrder,
      },
      create: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      },
    })

    await prisma.questionItem.deleteMany({ where: { categoryId: upsertedCategory.id } })

    if (category.questions.length > 0) {
      await prisma.questionItem.createMany({
        data: category.questions.map((questionText, index) => ({
          categoryId: upsertedCategory.id,
          text: questionText,
          sortOrder: index + 1,
        })),
      })
    }
  }
}

export async function importQuestionBattery(
  prisma: PrismaClient,
  docPath: string
): Promise<QuestionCategoryPayload[]> {
  const categories = await parseQuestionBattery(docPath)
  await upsertQuestionBattery(prisma, categories)
  return categories
}
