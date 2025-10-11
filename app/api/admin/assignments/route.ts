import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AssignmentStatus } from '@prisma/client'

// GET /api/admin/assignments - List all assignments with filters
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AssignmentStatus | null
    const gestorId = searchParams.get('gestorId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (gestorId) {
      where.assignedToUserId = gestorId
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Get assignments with relations
    const [assignments, total] = await Promise.all([
      prisma.testAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
              questions: true,
            },
          },
        },
      }),
      prisma.testAssignment.count({ where }),
    ])

    // Calculate stats
    const stats = await prisma.testAssignment.groupBy({
      by: ['status'],
      _count: true,
    })

    const statsMap = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      approved: 0,
      total: total,
    }

    stats.forEach((stat) => {
      if (stat.status === AssignmentStatus.PENDING) statsMap.pending = stat._count
      if (stat.status === AssignmentStatus.IN_PROGRESS) statsMap.inProgress = stat._count
      if (stat.status === AssignmentStatus.COMPLETED) statsMap.completed = stat._count
      if (stat.status === AssignmentStatus.APPROVED) statsMap.approved = stat._count
    })

    // Format assignments for frontend
    const formattedAssignments = assignments.map((assignment) => ({
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
      stats: statsMap,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/assignments - Create new assignment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, assignedToUserId, testTypeId, testTypeConditionId } = body

    // Validate required fields
    if (!name || !assignedToUserId || !testTypeId || !testTypeConditionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.length < 5 || name.length > 200) {
      return NextResponse.json(
        { error: 'Názov musí mať aspoň 5 znakov a maximálne 200 znakov' },
        { status: 400 }
      )
    }

    // Verify gestor exists and has GESTOR role
    const gestor = await prisma.user.findUnique({
      where: { id: assignedToUserId },
      select: { role: true, active: true },
    })

    if (!gestor || gestor.role !== UserRole.GESTOR || !gestor.active) {
      return NextResponse.json(
        { error: 'Vybraný používateľ nie je aktívny gestor' },
        { status: 400 }
      )
    }

    // Verify test type exists
    const testType = await prisma.testType.findUnique({
      where: { id: testTypeId },
    })

    if (!testType) {
      return NextResponse.json({ error: 'Typ testu neexistuje' }, { status: 400 })
    }

    // Verify test type condition exists and belongs to test type
    const condition = await prisma.testTypeCondition.findUnique({
      where: { id: testTypeConditionId },
    })

    if (!condition || condition.testTypeId !== testTypeId) {
      return NextResponse.json(
        { error: 'Podmienka nepatrí k vybranému typu testu' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = await prisma.testAssignment.create({
      data: {
        name,
        description: description || null,
        assignedToUserId,
        createdById: session.user.id,
        testTypeId,
        testTypeConditionId,
        status: AssignmentStatus.PENDING,
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
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
          },
        },
      },
    })

    return NextResponse.json(
      {
        id: assignment.id,
        name: assignment.name,
        status: assignment.status,
        createdAt: assignment.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
