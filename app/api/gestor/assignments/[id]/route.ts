import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// GET /api/gestor/assignments/[id] - Get assignment detail with available tests for import
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.GESTOR) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get assignment
    const assignment = await prisma.testAssignment.findUnique({
      where: {
        id: params.id,
        assignedToUserId: session.user.id, // Only gestor's own assignments
      },
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
            description: true,
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
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Get available tests for import (same type, approved)
    const availableTests = await prisma.test.findMany({
      where: {
        testTypeId: assignment.testTypeId,
        approved: true,
      },
      select: {
        id: true,
        name: true,
        questions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const formattedAvailableTests = availableTests.map((test) => ({
      id: test.id,
      name: test.name,
      questionsCount: Array.isArray(test.questions) ? test.questions.length : 0,
      createdAt: test.createdAt,
    }))

    return NextResponse.json({
      assignment: {
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
      },
      test: assignment.test
        ? {
            id: assignment.test.id,
            name: assignment.test.name,
            description: assignment.test.description,
            questions: assignment.test.questions,
          }
        : null,
      availableTests: formattedAvailableTests,
    })
  } catch (error) {
    console.error('Error fetching gestor assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
