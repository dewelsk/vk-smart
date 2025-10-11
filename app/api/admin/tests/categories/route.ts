import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/tests/categories - Get list of test categories
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication - SUPERADMIN, ADMIN, and GESTOR can view categories
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Query params
    const search = searchParams.get('search') || undefined
    const typeId = searchParams.get('type') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause
    const where: any = {}

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

    // Get categories with pagination
    const categories = await prisma.testCategory.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        _count: {
          select: { tests: true }
        }
      }
    })

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      type: category.type,
      description: category.description,
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

// POST /api/admin/tests/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only SUPERADMIN can create categories
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, typeId, description } = body

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Názov kategórie je povinný' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.testCategory.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Kategória s týmto názvom už existuje' },
        { status: 400 }
      )
    }

    if (typeId) {
      const testTypeExists = await prisma.testType.findUnique({
        where: { id: typeId }
      })

      if (!testTypeExists) {
        return NextResponse.json(
          { error: 'Zvolený typ testu neexistuje' },
          { status: 400 }
        )
      }
    }

    // Create category
    const category = await prisma.testCategory.create({
      data: {
        name: name.trim(),
        typeId: typeId || null,
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: { tests: true }
        }
      }
    })

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        description: category.description,
        testCount: category._count.tests,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating test category:', error)
    return NextResponse.json(
      { error: 'Failed to create test category' },
      { status: 500 }
    )
  }
}
