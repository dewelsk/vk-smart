import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN'] as const

const updateQuestionSchema = z.object({
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string; questionId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const existingQuestion = await prisma.questionItem.findUnique({
      where: { id: params.questionId },
      select: { id: true, categoryId: true },
    })

    if (!existingQuestion || existingQuestion.categoryId !== params.categoryId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateQuestionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const [question, categoryUpdate] = await prisma.$transaction([
      prisma.questionItem.update({
        where: { id: params.questionId },
        data: {
          text: validation.data.text,
        },
      }),
      touchCategory(params.categoryId),
    ])

    return NextResponse.json({
      question,
      categoryUpdatedAt: categoryUpdate.updatedAt,
    })
  } catch (error) {
    console.error('Failed to update question:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { categoryId: string; questionId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const existingQuestion = await prisma.questionItem.findUnique({
      where: { id: params.questionId },
      select: { id: true, categoryId: true },
    })

    if (!existingQuestion || existingQuestion.categoryId !== params.categoryId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const [, categoryUpdate] = await prisma.$transaction([
      prisma.questionItem.delete({ where: { id: params.questionId } }),
      touchCategory(params.categoryId),
    ])

    const questionCount = await prisma.questionItem.count({
      where: { categoryId: params.categoryId },
    })

    return NextResponse.json({
      questionCount,
      categoryUpdatedAt: categoryUpdate.updatedAt,
    })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
