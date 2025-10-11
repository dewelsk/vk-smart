import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AssignmentStatus } from '@prisma/client'

// GET /api/gestor/assignments - List gestor's assignments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.GESTOR) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AssignmentStatus | null

    // Build where clause
    const where: any = {
      assignedToUserId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    // Get assignments
    const assignments = await prisma.testAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
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
            questions: true,
          },
        },
      },
    })

    // Calculate stats
    const stats = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      approved: 0,
    }

    assignments.forEach((assignment) => {
      if (assignment.status === AssignmentStatus.PENDING) stats.pending++
      if (assignment.status === AssignmentStatus.IN_PROGRESS) stats.inProgress++
      if (assignment.status === AssignmentStatus.COMPLETED) stats.completed++
      if (assignment.status === AssignmentStatus.APPROVED) stats.approved++
    })

    // Format assignments
    const formattedAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      name: assignment.name,
      description: assignment.description,
      status: assignment.status,
      testType: assignment.testType,
      testTypeCondition: assignment.testTypeCondition,
      createdBy: assignment.createdBy,
      createdAt: assignment.createdAt,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt,
      approvedAt: assignment.approvedAt,
      test: assignment.test
        ? {
            id: assignment.test.id,
            name: assignment.test.name,
            questionsCount: Array.isArray(assignment.test.questions)
              ? assignment.test.questions.length
              : 0,
          }
        : null,
    }))

    return NextResponse.json({
      assignments: formattedAssignments,
      stats,
    })
  } catch (error) {
    console.error('Error fetching gestor assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
