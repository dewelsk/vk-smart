import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // RBAC: Only ADMIN, GESTOR, SUPERADMIN can practice tests
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na precvičovanie testov' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { testId } = body

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }

    // Verify test exists and is approved
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testType: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        testTypeCondition: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test nebol nájdený' },
        { status: 404 }
      )
    }

    if (!test.practiceEnabled) {
      return NextResponse.json(
        { error: 'Test musí byť povolený na precvičovanie' },
        { status: 400 }
      )
    }

    // Parse questions from JSON
    const questions = test.questions as any

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Test neobsahuje žiadne otázky' },
        { status: 400 }
      )
    }

    // Transform questions to match frontend format
    const transformedQuestions = questions.map((q: any) => ({
      id: q.id || `q-${q.order}`,
      text: q.text,
      type: q.questionType, // Map questionType to type
      options: q.answers?.map((a: any, idx: number) => ({ // Map answers to options
        id: a.id || `${q.order}-${a.letter || idx}`,
        text: a.text
      })),
      points: q.points || 1
    }))

    // Create practice session
    const practiceSession = await prisma.practiceTestResult.create({
      data: {
        testId: test.id,
        userId: session.user.id,
        answers: [],
        score: 0,
        maxScore: 0,
        successRate: 0,
        passed: false,
        startedAt: new Date(),
      }
    })

    // Return test data with session ID
    return NextResponse.json({
      sessionId: practiceSession.id,
      test: {
        id: test.id,
        name: test.name,
        testTypeId: test.testTypeId,
        testType: test.testType
          ? {
              id: test.testType.id,
              name: test.testType.name,
              description: test.testType.description,
            }
          : null,
        testTypeConditionId: test.testTypeConditionId,
        testTypeCondition: test.testTypeCondition
          ? {
              id: test.testTypeCondition.id,
              name: test.testTypeCondition.name,
              description: test.testTypeCondition.description,
            }
          : null,
        description: test.description,
        category: test.category,
        questions: transformedQuestions,
        recommendedQuestionCount: test.recommendedQuestionCount,
        recommendedDuration: test.recommendedDuration,
        difficulty: test.difficulty,
      },
      startedAt: practiceSession.startedAt,
    })

  } catch (error) {
    console.error('Error starting practice test:', error)
    return NextResponse.json(
      { error: 'Chyba pri spustení precvičovania' },
      { status: 500 }
    )
  }
}
