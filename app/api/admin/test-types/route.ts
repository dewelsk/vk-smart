import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTestTypeSchema = z.object({
  name: z.string().min(1, 'Názov je povinný'),
  description: z.string().optional(),
})

// GET /api/admin/test-types - Get list of test types
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication - SUPERADMIN, ADMIN, and GESTOR can view test types
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Query params
    const search = searchParams.get('search') || undefined
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

    // Get total count
    const total = await prisma.testType.count({ where })

    // Get test types with pagination
    const testTypes = await prisma.testType.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        _count: {
          select: {
            categories: true
          }
        }
      }
    })

    // Format response
    const formattedTestTypes = testTypes.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      categoryCount: type._count.categories,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt
    }))

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      testTypes: formattedTestTypes,
      total,
      page,
      limit,
      pages
    })
  } catch (error) {
    console.error('Error fetching test types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test types' },
      { status: 500 }
    )
  }
}

// POST /api/admin/test-types - Create new test type
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication - only SUPERADMIN and ADMIN can create test types
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createTestTypeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, description } = validationResult.data

    // Check if test type with this name already exists
    const existing = await prisma.testType.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Typ testu s týmto názvom už existuje' },
        { status: 400 }
      )
    }

    // Create test type
    const testType = await prisma.testType.create({
      data: {
        name,
        description: description || null
      }
    })

    return NextResponse.json(testType, { status: 201 })
  } catch (error) {
    console.error('Error creating test type:', error)
    return NextResponse.json(
      { error: 'Failed to create test type' },
      { status: 500 }
    )
  }
}
