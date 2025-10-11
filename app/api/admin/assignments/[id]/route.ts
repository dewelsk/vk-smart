import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/admin/assignments/[id] - Get assignment detail
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignment = await prisma.testAssignment.findUnique({
      where: { id: params.id },
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        testType: {
          select: {
            id: true,
            name: true,
          },
        },
        testTypeCondition: {
          select: {
            id: true,
            name: true,
            minQuestions: true,
            maxQuestions: true,
            timeLimitMinutes: true,
            pointsPerQuestion: true,
            minimumScore: true,
          },
        },
        test: {
          select: {
            id: true,
            name: true,
            description: true,
            questions: true,
            approved: true,
            approvedAt: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Format response
    const response = {
      assignment: {
        id: assignment.id,
        name: assignment.name,
        description: assignment.description,
        status: assignment.status,
        testType: assignment.testType,
        testTypeCondition: assignment.testTypeCondition,
        assignedTo: assignment.assignedToUser,
        createdBy: assignment.createdBy,
        createdAt: assignment.createdAt,
        startedAt: assignment.startedAt,
        completedAt: assignment.completedAt,
        approvedAt: assignment.approvedAt,
        approvedById: assignment.approvedById,
      },
      test: assignment.test
        ? {
            id: assignment.test.id,
            name: assignment.test.name,
            description: assignment.test.description,
            questionsCount: Array.isArray(assignment.test.questions)
              ? assignment.test.questions.length
              : 0,
            questions: assignment.test.questions,
            approved: assignment.test.approved,
            approvedAt: assignment.test.approvedAt,
          }
        : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
