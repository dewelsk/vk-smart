import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN'] as const

const createConditionSchema = z.object({
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const testType = await prisma.testType.findUnique({ where: { id: params.id } })
    if (!testType) {
      return NextResponse.json({ error: 'Typ testu nebol nájdený' }, { status: 404 })
    }

    const data = await request.json()
    const validation = createConditionSchema.safeParse(data)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const lastCondition = await prisma.testTypeCondition.findFirst({
      where: { testTypeId: params.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const nextSortOrder = (lastCondition?.sortOrder ?? 0) + 1

    const [condition, touch] = await prisma.$transaction([
      prisma.testTypeCondition.create({
        data: {
          testTypeId: params.id,
          name: validation.data.name,
          description: validation.data.description ? validation.data.description : null,
          sortOrder: nextSortOrder,
        },
      }),
      touchTestType(params.id),
    ])

    return NextResponse.json(
      {
        condition,
        testTypeUpdatedAt: touch.updatedAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating test type condition:', error)
    return NextResponse.json({ error: 'Failed to create condition' }, { status: 500 })
  }
}
