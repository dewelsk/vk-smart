import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AssignmentStatus } from '@prisma/client'

// POST /api/gestor/assignments/[id]/import - Import questions from existing test
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.GESTOR) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sourceTestId, questionCount } = body

    // Validate required fields
    if (!sourceTestId || !questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get assignment
    const assignment = await prisma.testAssignment.findUnique({
      where: {
        id: params.id,
        assignedToUserId: session.user.id,
      },
      include: {
        testTypeCondition: true,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Only PENDING and IN_PROGRESS can import
    if (
      assignment.status !== AssignmentStatus.PENDING &&
      assignment.status !== AssignmentStatus.IN_PROGRESS
    ) {
      return NextResponse.json(
        { error: 'Priradenie už bolo dokončené' },
        { status: 400 }
      )
    }

    const condition = assignment.testTypeCondition

    // Validate question count is within range
    if (
      condition.minQuestions &&
      condition.maxQuestions &&
      (questionCount < condition.minQuestions || questionCount > condition.maxQuestions)
    ) {
      return NextResponse.json(
        {
          error: `Počet otázok musí byť v rozsahu ${condition.minQuestions}-${condition.maxQuestions}`,
        },
        { status: 400 }
      )
    }

    // Get source test
    const sourceTest = await prisma.test.findUnique({
      where: { id: sourceTestId },
      select: {
        testTypeId: true,
        questions: true,
        approved: true,
      },
    })

    if (!sourceTest) {
      return NextResponse.json({ error: 'Zdrojový test neexistuje' }, { status: 404 })
    }

    // Verify source test is approved
    if (!sourceTest.approved) {
      return NextResponse.json(
        { error: 'Zdrojový test nie je schválený' },
        { status: 400 }
      )
    }

    // Verify source test is same type
    if (sourceTest.testTypeId !== assignment.testTypeId) {
      return NextResponse.json(
        { error: 'Zdrojový test musí byť rovnakého typu' },
        { status: 400 }
      )
    }

    // Get questions array
    const sourceQuestions = Array.isArray(sourceTest.questions)
      ? sourceTest.questions
      : []

    if (sourceQuestions.length < questionCount) {
      return NextResponse.json(
        { error: `Zdrojový test má len ${sourceQuestions.length} otázok` },
        { status: 400 }
      )
    }

    // Take first N questions
    const importedQuestions = sourceQuestions.slice(0, questionCount)

    return NextResponse.json({
      message: `Importovaných ${questionCount} otázok`,
      questions: importedQuestions,
      count: importedQuestions.length,
    })
  } catch (error) {
    console.error('Error importing questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
