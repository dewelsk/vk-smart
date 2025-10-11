import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN'] as const

const updateConditionSchema = z.object({
  name: z.string().trim().min(1, 'Názov je povinný'),
  description: z.string().trim().optional(),
})

function isAuthorized(role: string | undefined) {
  return !!role && ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])
}

function touchTestType(testTypeId: string) {
  return prisma.testType.update({
    where: { id: testTypeId },
    data: { updatedAt: new Date() },
    select: { updatedAt: true },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const condition = await prisma.testTypeCondition.findUnique({
      where: { id: params.conditionId },
      select: {
        id: true,
        testTypeId: true,
      },
    })

    if (!condition || condition.testTypeId !== params.id) {
      return NextResponse.json({ error: 'Podmienka nebola nájdená' }, { status: 404 })
    }

    const data = await request.json()
    const validation = updateConditionSchema.safeParse(data)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const [updatedCondition, touch] = await prisma.$transaction([
      prisma.testTypeCondition.update({
        where: { id: params.conditionId },
        data: {
          name: validation.data.name,
          description: validation.data.description ? validation.data.description : null,
        },
      }),
      touchTestType(params.id),
    ])

    return NextResponse.json({
      condition: updatedCondition,
      testTypeUpdatedAt: touch.updatedAt,
    })
  } catch (error) {
    console.error('Error updating test type condition:', error)
    return NextResponse.json({ error: 'Failed to update condition' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; conditionId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const condition = await prisma.testTypeCondition.findUnique({
      where: { id: params.conditionId },
      select: {
        id: true,
        testTypeId: true,
      },
    })

    if (!condition || condition.testTypeId !== params.id) {
      return NextResponse.json({ error: 'Podmienka nebola nájdená' }, { status: 404 })
    }

    const [, touch] = await prisma.$transaction([
      prisma.testTypeCondition.delete({ where: { id: params.conditionId } }),
      touchTestType(params.id),
    ])

    return NextResponse.json({
      success: true,
      testTypeUpdatedAt: touch.updatedAt,
    })
  } catch (error) {
    console.error('Error deleting test type condition:', error)
    return NextResponse.json({ error: 'Failed to delete condition' }, { status: 500 })
  }
}
