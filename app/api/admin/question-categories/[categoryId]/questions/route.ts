import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN'] as const

const createQuestionSchema = z.object({
  text: z.string().trim().min(5, 'Otázka musí obsahovať aspoň 5 znakov'),
})

function isAuthorized(role: string | undefined) {
  return !!role && ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])
}

function touchCategory(categoryId: string) {
  return prisma.questionCategory.update({
    where: { id: categoryId },
    data: { sortOrder: { increment: 0 } },
    select: { updatedAt: true },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const category = await prisma.questionCategory.findUnique({
      where: { id: params.categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = createQuestionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { text } = validation.data

    const lastQuestion = await prisma.questionItem.findFirst({
      where: { categoryId: params.categoryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const nextSortOrder = (lastQuestion?.sortOrder ?? 0) + 1

    const [question, categoryUpdate] = await prisma.$transaction([
      prisma.questionItem.create({
        data: {
          categoryId: params.categoryId,
          text,
          sortOrder: nextSortOrder,
        },
      }),
      touchCategory(params.categoryId),
    ])

    const questionCount = await prisma.questionItem.count({
      where: { categoryId: params.categoryId },
    })

    return NextResponse.json(
      {
        question,
        questionCount,
        categoryUpdatedAt: categoryUpdate.updatedAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create question:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
