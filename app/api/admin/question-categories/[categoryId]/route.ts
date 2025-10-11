import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN'] as const

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Názov je povinný'),
  description: z.string().trim().min(1, 'Popis je povinný'),
})

function isAuthorized(role: string | undefined) {
  return !!role && ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const category = await prisma.questionCategory.findUnique({
      where: { id: params.categoryId },
      include: {
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      questionCount: category.questions.length,
      questions: category.questions.map((question) => ({
        id: question.id,
        categoryId: question.categoryId,
        text: question.text,
        sortOrder: question.sortOrder,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch question category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await auth()

    if (!isAuthorized(session?.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description } = validation.data

    const updatedCategory = await prisma.questionCategory.update({
      where: { id: params.categoryId },
      data: {
        name,
        description,
      },
      include: {
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    return NextResponse.json({
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      sortOrder: updatedCategory.sortOrder,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
      questionCount: updatedCategory.questions.length,
      questions: updatedCategory.questions.map((question) => ({
        id: question.id,
        categoryId: question.categoryId,
        text: question.text,
        sortOrder: question.sortOrder,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Failed to update question category:', error)
    return NextResponse.json(
      { error: 'Failed to update question category' },
      { status: 500 }
    )
  }
}
