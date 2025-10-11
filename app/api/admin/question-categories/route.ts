import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN']

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()

    const categories = await prisma.questionCategory.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    const payload = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      questionCount: category._count.questions,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }))

    return NextResponse.json({ categories: payload })
  } catch (error) {
    console.error('Failed to fetch question categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question categories' },
      { status: 500 }
    )
  }
}
