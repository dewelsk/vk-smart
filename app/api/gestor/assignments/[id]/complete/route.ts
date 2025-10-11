import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AssignmentStatus } from '@prisma/client'

// POST /api/gestor/assignments/[id]/complete - Complete test and submit for approval
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
    const { name, description, questions } = body

    // Validate required fields
    if (!name || !questions || !Array.isArray(questions)) {
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
        test: true,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Only PENDING and IN_PROGRESS can be completed
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

    // Validate question count
    if (
      condition.minQuestions &&
      condition.maxQuestions &&
      (questions.length < condition.minQuestions || questions.length > condition.maxQuestions)
    ) {
      return NextResponse.json(
        {
          error: `Počet otázok musí byť v rozsahu ${condition.minQuestions}-${condition.maxQuestions}`,
        },
        { status: 400 }
      )
    }

    // Validate question structure
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 3) {
        return NextResponse.json(
          { error: 'Každá otázka musí mať text a 3 možnosti odpovede' },
          { status: 400 }
        )
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 2) {
        return NextResponse.json(
          { error: 'Každá otázka musí mať označenú správnu odpoveď (0-2)' },
          { status: 400 }
        )
      }
      // Validate all options are filled
      for (const option of q.options) {
        if (!option || option.trim().length === 0) {
          return NextResponse.json(
            { error: 'Všetky odpovede musia byť vyplnené' },
            { status: 400 }
          )
        }
      }
    }

    // Create or update test
    let test
    if (assignment.test) {
      // Update existing draft
      test = await prisma.test.update({
        where: { id: assignment.test.id },
        data: {
          name,
          description: description || null,
          questions,
        },
      })
    } else {
      // Create new test
      test = await prisma.test.create({
        data: {
          name,
          description: description || null,
          testTypeId: assignment.testTypeId,
          testTypeConditionId: assignment.testTypeConditionId,
          questions,
          approved: false,
          authorId: session.user.id,
        },
      })
    }

    // Update assignment status to COMPLETED
    const updatedAssignment = await prisma.testAssignment.update({
      where: { id: params.id },
      data: {
        status: AssignmentStatus.COMPLETED,
        startedAt: assignment.startedAt || new Date(),
        completedAt: new Date(),
        testId: test.id,
      },
    })

    return NextResponse.json({
      message: 'Test úspešne odoslaný na schválenie',
      test: {
        id: test.id,
        name: test.name,
        questionsCount: questions.length,
      },
      assignment: {
        id: updatedAssignment.id,
        status: updatedAssignment.status,
        completedAt: updatedAssignment.completedAt,
      },
    })
  } catch (error) {
    console.error('Error completing assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
