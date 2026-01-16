import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { VKStatus  } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getReadinessIndicator, getGroupedIssues } from '@/lib/vk-validation'


// GET /api/admin/vk - List VK with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const gestorId = searchParams.get('gestorId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    // Status filter (supports multiple statuses separated by comma)
    if (status) {
      const statuses = status.split(',').filter(Boolean)
      if (statuses.length === 1) {
        where.status = statuses[0] as VKStatus
      } else if (statuses.length > 1) {
        where.status = { in: statuses as VKStatus[] }
      }
    }

    // Date filter
    if (dateFrom || dateTo) {
      where.startDateTime = {}
      if (dateFrom) {
        where.startDateTime.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        where.startDateTime.lt = endDate
      }
    }

    // Gestor filter
    if (gestorId) {
      where.gestorId = gestorId
    }

    // Search filter
    if (search) {
      where.OR = [
        { identifier: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { selectionType: { contains: search, mode: 'insensitive' } },
        { organizationalUnit: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'identifier') {
      orderBy.identifier = sortOrder
    } else if (sortBy === 'position') {
      orderBy.position = sortOrder
    } else if (sortBy === 'date' || sortBy === 'startDateTime') {
      orderBy.startDateTime = sortOrder
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Fetch VKs
    const [vks, total] = await Promise.all([
      prisma.vyberoveKonanie.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          gestor: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          candidates: {
            where: { deleted: false },
            select: {
              id: true,
            },
          },
          assignedTests: {
            select: {
              id: true,
              test: true,
            },
          },
          commission: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
          evaluationConfig: true,
        },
      }),
      prisma.vyberoveKonanie.count({ where }),
    ])

    // Format response
    const formattedVKs = vks.map((vk) => {
      const validation = getReadinessIndicator(vk as any)
      const { errors, warnings } = getGroupedIssues(vk as any)

      return {
        id: vk.id,
        identifier: vk.identifier,
        position: vk.position,
        selectionType: vk.selectionType,
        organizationalUnit: vk.organizationalUnit,
        serviceField: vk.serviceField,
        serviceType: vk.serviceType,
        startDateTime: vk.startDateTime,
        numberOfPositions: vk.numberOfPositions,
        status: vk.status,
        createdAt: vk.createdAt,
        gestor: vk.gestor,
        candidatesCount: vk.candidates.length,
        testsCount: vk.assignedTests.length,
        validation: {
          status: validation.status,
          count: validation.count,
          label: validation.label,
          errors: errors.map(e => e.message),
          warnings: warnings.map(w => w.message),
        },
      }
    })

    return NextResponse.json({
      vks: formattedVKs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/vk error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VKs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/vk - Create new VK
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      identifier,
      selectionType,
      organizationalUnit,
      serviceField,
      position,
      serviceType,
      startDateTime,
      numberOfPositions,
      gestorId,
    } = body

    // Validation
    if (!identifier || !selectionType || !organizationalUnit || !serviceField || !position || !serviceType || !startDateTime) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if identifier exists
    const existingVK = await prisma.vyberoveKonanie.findUnique({
      where: { identifier },
    })

    if (existingVK) {
      return NextResponse.json(
        { error: 'VK identifier already exists' },
        { status: 400 }
      )
    }

    // Create VK
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier,
        selectionType,
        organizationalUnit,
        serviceField,
        position,
        serviceType,
        startDateTime: new Date(startDateTime),
        numberOfPositions: numberOfPositions || 1,
        gestorId: gestorId || null,
        createdById: session.user.id,
      },
      include: {
        gestor: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    })

    return NextResponse.json({
      vk: {
        id: vk.id,
        identifier: vk.identifier,
        position: vk.position,
        status: vk.status,
        gestor: vk.gestor,
      },
    })
  } catch (error) {
    console.error('POST /api/admin/vk error:', error)
    return NextResponse.json(
      { error: 'Failed to create VK' },
      { status: 500 }
    )
  }
}
