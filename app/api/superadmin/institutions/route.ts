import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/superadmin/institutions - List institutions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication and authorization
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const activeParam = searchParams.get('active')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build where clause
    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Active filter
    if (activeParam && activeParam !== 'all') {
      where.active = activeParam === 'true'
    }

    // Count total
    const total = await prisma.institution.count({ where })

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'vkCount') {
      // Special case - will be handled with _count
    } else if (sortBy === 'adminCount') {
      // Special case - will be handled with _count
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Fetch institutions
    const institutions = await prisma.institution.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy[sortBy] ? orderBy : { name: 'asc' },
      include: {
        _count: {
          select: {
            vyberoveKonania: true,
            users: {
              where: {
                role: {
                  in: ['ADMIN', 'GESTOR', 'KOMISIA']
                }
              }
            }
          }
        }
      }
    })

    // Transform response
    const transformedInstitutions = institutions.map(inst => ({
      id: inst.id,
      name: inst.name,
      code: inst.code,
      description: inst.description,
      active: inst.active,
      createdAt: inst.createdAt,
      vkCount: inst._count.vyberoveKonania,
      adminCount: inst._count.users
    }))

    // Sort by computed fields if needed
    if (sortBy === 'vkCount' || sortBy === 'adminCount') {
      transformedInstitutions.sort((a, b) => {
        const aVal = sortBy === 'vkCount' ? a.vkCount : a.adminCount
        const bVal = sortBy === 'vkCount' ? b.vkCount : b.adminCount
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    return NextResponse.json({
      institutions: transformedInstitutions,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    })

  } catch (error) {
    console.error('Error fetching institutions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/institutions - Create institution
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication and authorization
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, active } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Validate code format (A-Z, 0-9 only, max 10 chars)
    const codeRegex = /^[A-Z0-9]{1,10}$/
    const upperCode = code.toUpperCase()

    if (!codeRegex.test(upperCode)) {
      return NextResponse.json(
        { error: 'Code must be 1-10 uppercase letters or numbers only' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.institution.findUnique({
      where: { code: upperCode }
    })

    if (existing) {
      return NextResponse.json(
        {
          error: 'CODE_EXISTS',
          message: `Rezort s kódom '${upperCode}' už existuje`
        },
        { status: 400 }
      )
    }

    // Create institution
    const institution = await prisma.institution.create({
      data: {
        name,
        code: upperCode,
        description: description || null,
        active: active !== undefined ? active : true
      }
    })

    return NextResponse.json(
      { institution },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating institution:', error)
    return NextResponse.json(
      { error: 'Failed to create institution' },
      { status: 500 }
    )
  }
}
