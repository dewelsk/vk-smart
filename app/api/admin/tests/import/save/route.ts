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
    const { name, testTypeId, testTypeConditionId, duration, totalPoints, questions, allowedQuestionTypes } = body

    // Validate inputs
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Názov testu je povinný' },
        { status: 400 }
      )
    }

    if (!testTypeId) {
      return NextResponse.json(
        { error: 'Typ testu je povinný' },
        { status: 400 }
      )
    }

    // Validate allowedQuestionTypes (default to SINGLE_CHOICE if not provided)
    const finalAllowedQuestionTypes = allowedQuestionTypes && Array.isArray(allowedQuestionTypes) && allowedQuestionTypes.length > 0
      ? allowedQuestionTypes
      : ['SINGLE_CHOICE']

    const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
    const invalidTypes = finalAllowedQuestionTypes.filter(type => !validQuestionTypes.includes(type))
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Neplatné typy otázok: ${invalidTypes.join(', ')}` },
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
      // Validate questionType exists
      if (!question.questionType) {
        return NextResponse.json(
          { error: `Otázka ${question.order} musí mať definovaný typ otázky` },
          { status: 400 }
        )
      }

      // Validate questionType is in allowedQuestionTypes
      if (!finalAllowedQuestionTypes.includes(question.questionType)) {
        return NextResponse.json(
          { error: `Otázka ${question.order} má nepovolený typ "${question.questionType}". Povolené typy pre tento test: ${finalAllowedQuestionTypes.join(', ')}` },
          { status: 400 }
        )
      }

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

    // Create test in database with questions as JSON
    const test = await prisma.test.create({
      data: {
        name,
        testTypeId,
        testTypeConditionId: testTypeConditionId || null,
        categoryId: null, // No category for imported tests
        recommendedDuration: duration,
        recommendedQuestionCount: questions.length,
        difficulty: 5, // Default medium difficulty
        approved: false, // Draft by default
        authorId: session.user.id,
        questions: questions, // Store as JSON
        allowedQuestionTypes: finalAllowedQuestionTypes, // Store allowed question types
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
