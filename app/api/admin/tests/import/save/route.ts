import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, categoryId, duration, difficulty, totalPoints, questions } = body

    // Validate inputs
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Názov testu je povinný' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Kategória je povinná' },
        { status: 400 }
      )
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { error: 'Časový limit musí byť aspoň 1 minúta' },
        { status: 400 }
      )
    }

    if (!totalPoints || totalPoints < 1) {
      return NextResponse.json(
        { error: 'Body za test musia byť aspoň 1' },
        { status: 400 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Test musí obsahovať aspoň 1 otázku' },
        { status: 400 }
      )
    }

    // Validate all questions are confirmed
    const unconfirmed = questions.filter((q: any) => q.status !== 'confirmed')
    if (unconfirmed.length > 0) {
      return NextResponse.json(
        { error: 'Všetky otázky musia byť potvrdené' },
        { status: 400 }
      )
    }

    // Validate each question has exactly 1 correct answer
    for (const question of questions) {
      const correctAnswers = question.answers.filter((a: any) => a.isCorrect)
      if (correctAnswers.length !== 1) {
        return NextResponse.json(
          { error: `Otázka ${question.order} musí mať práve 1 správnu odpoveď` },
          { status: 400 }
        )
      }

      if (question.answers.length < 2) {
        return NextResponse.json(
          { error: `Otázka ${question.order} musí mať aspoň 2 odpovede` },
          { status: 400 }
        )
      }

      if (question.answers.length > 6) {
        return NextResponse.json(
          { error: `Otázka ${question.order} môže mať maximálne 6 odpovedí` },
          { status: 400 }
        )
      }
    }

    // Determine test type from category or use default
    let testType = 'ODBORNY' // default
    if (categoryId) {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: { type: true }
      })

      // Map TestType name to TestTyp enum
      if (category?.type) {
        const typeMapping: Record<string, string> = {
          'Štátny jazyk': 'STATNY_JAZYK',
          'Cudzí jazyk': 'CUDZI_JAZYK',
          'IT zručnosti': 'IT_ZRUCNOSTI',
          'Odborný test': 'ODBORNY',
          'Všeobecný prehľad': 'VSEOBECNY',
          'Schopnosti a vlastnosti': 'SCHOPNOSTI_VLASTNOSTI',
        }
        testType = typeMapping[category.type.name] || 'ODBORNY'
      }
    }

    // Create test in database with questions as JSON
    const test = await prisma.test.create({
      data: {
        name,
        type: testType as any,
        categoryId,
        recommendedDuration: duration,
        recommendedQuestionCount: questions.length,
        difficulty: difficulty || 5, // Default to 5 if not provided
        approved: false, // Draft by default
        authorId: session.user.id,
        questions: questions, // Store as JSON
      },
    })

    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        name: test.name,
        questionsCount: questions.length,
        totalPoints: test.totalPoints,
        status: test.approved ? 'APPROVED' : 'DRAFT',
      },
    })
  } catch (error) {
    console.error('Save test error:', error)
    return NextResponse.json(
      { error: 'Chyba pri ukladaní testu' },
      { status: 500 }
    )
  }
}
