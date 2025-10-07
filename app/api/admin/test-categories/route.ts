import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTestCategorySchema = z.object({
  name: z.string().min(1, 'Názov je povinný'),
  typeId: z.string().min(1, 'Typ testu je povinný'),
  description: z.string().nullish(), // Accept null, undefined, or string
})

// GET /api/admin/test-categories - Get list of test categories
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication - SUPERADMIN, ADMIN, and GESTOR can view test categories
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Query params
    const search = searchParams.get('search') || undefined
    const typeId = searchParams.get('typeId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100') // Higher default for simple list
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc'

    // Build where clause
    const where: any = {}

    // Apply filters
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (typeId) {
      where.typeId = typeId
    }

    // Get total count
    const total = await prisma.testCategory.count({ where })

    // Get test categories with pagination
    const testCategories = await prisma.testCategory.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        type: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            tests: true
          }
        }
      }
    })

    // Format response
    const formattedCategories = testCategories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      typeId: category.typeId,
      type: category.type,
      testCount: category._count.tests,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }))

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      categories: formattedCategories,
      total,
      page,
      limit,
      pages
    })
  } catch (error) {
    console.error('Error fetching test categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/test-categories - Create new test category
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication - only SUPERADMIN and ADMIN can create test categories
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createTestCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, typeId, description } = validationResult.data

    // Check if test category with this name already exists
    const existing = await prisma.testCategory.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Kategória testu s týmto názvom už existuje' },
        { status: 400 }
      )
    }

    // Verify typeId exists
    const typeExists = await prisma.testType.findUnique({
      where: { id: typeId }
    })

    if (!typeExists) {
      return NextResponse.json(
        { error: 'Zvolený typ testu neexistuje' },
        { status: 400 }
      )
    }

    // Create test category
    const testCategory = await prisma.testCategory.create({
      data: {
        name,
        typeId,
        description: description || null
      },
      include: {
        type: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(testCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating test category:', error)
    return NextResponse.json(
      { error: 'Failed to create test category' },
      { status: 500 }
    )
  }
}
