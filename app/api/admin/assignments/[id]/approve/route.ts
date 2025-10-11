import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AssignmentStatus } from '@prisma/client'

// PATCH /api/admin/assignments/[id]/approve - Approve completed assignment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get assignment
    const assignment = await prisma.testAssignment.findUnique({
      where: { id: params.id },
      include: {
        test: true,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify assignment is in COMPLETED status
    if (assignment.status !== AssignmentStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Priradenie musí byť dokončené pred schválením' },
        { status: 400 }
      )
    }

    // Verify test exists
    if (!assignment.testId || !assignment.test) {
      return NextResponse.json(
        { error: 'Test nebol vytvorený' },
        { status: 400 }
      )
    }

    // Update assignment and test in transaction
    const [updatedAssignment, updatedTest] = await prisma.$transaction([
      // Update assignment status to APPROVED
      prisma.testAssignment.update({
        where: { id: params.id },
        data: {
          status: AssignmentStatus.APPROVED,
          approvedAt: new Date(),
          approvedById: session.user.id,
        },
      }),
      // Mark test as approved
      prisma.test.update({
        where: { id: assignment.testId },
        data: {
          approved: true,
          approvedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      assignment: {
        id: updatedAssignment.id,
        status: updatedAssignment.status,
        approvedAt: updatedAssignment.approvedAt,
        approvedById: updatedAssignment.approvedById,
      },
      test: {
        id: updatedTest.id,
        approved: updatedTest.approved,
        approvedAt: updatedTest.approvedAt,
      },
    })
  } catch (error) {
    console.error('Error approving assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
