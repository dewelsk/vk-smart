import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { importQuestionBattery } from '@/lib/question-battery/importer'

const prisma = new PrismaClient()

async function main() {
  const providedPath = process.argv[2]
  const docPath = providedPath
    ? path.resolve(process.cwd(), providedPath)
    : path.resolve(
        process.cwd(),
        'zadanie/subory/8. Hodnotiaci rozhovor/Batéria otázok RR - komisii.docx'
      )

  if (!fs.existsSync(docPath)) {
    throw new Error(`Súbor s batériou otázok sa nenašiel: ${docPath}`)
  }

  console.log('📥 Začínam import batérie otázok...')
  console.log(`📄 Zdrojový súbor: ${docPath}`)

  try {
    const categories = await importQuestionBattery(prisma, docPath)

    categories.forEach((category) => {
      console.log(
        `\n➡️  ${category.name} (otázok: ${category.questions.length}, poradie: ${category.sortOrder})`
      )
    })

    console.log('\n✅ Import batérie otázok bol úspešne dokončený.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('❌ Import zlyhal:', error)
  prisma.$disconnect().catch(() => {})
  process.exit(1)
})
