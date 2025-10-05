import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient, VKStatus } from '@prisma/client'
import { getReadinessIndicator } from '@/lib/vk-validation'

const prisma = new PrismaClient()

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
    const institutionId = searchParams.get('institutionId') || ''
    const status = searchParams.get('status') || ''
    const gestorId = searchParams.get('gestorId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    // RBAC: Admin/Gestor/Komisia see only VK from their institutions
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      where.institutionId = {
        in: userInstitutionIds,
      }
    }

    // Institution filter (only for superadmin)
    if (institutionId && session.user.role === 'SUPERADMIN') {
      where.institutionId = institutionId
    }

    // Status filter
    if (status) {
      where.status = status as VKStatus
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
    } else if (sortBy === 'date') {
      orderBy.date = sortOrder
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
          institution: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
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
        },
      }),
      prisma.vyberoveKonanie.count({ where }),
    ])

    // Format response
    const formattedVKs = vks.map((vk) => {
      const validation = getReadinessIndicator(vk as any)

      return {
        id: vk.id,
        identifier: vk.identifier,
        position: vk.position,
        selectionType: vk.selectionType,
        organizationalUnit: vk.organizationalUnit,
        serviceField: vk.serviceField,
        serviceType: vk.serviceType,
        date: vk.date,
        numberOfPositions: vk.numberOfPositions,
        status: vk.status,
        createdAt: vk.createdAt,
        institution: vk.institution,
        gestor: vk.gestor,
        candidatesCount: vk.candidates.length,
        testsCount: vk.assignedTests.length,
        validation: {
          status: validation.status,
          count: validation.count,
          label: validation.label,
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
      institutionId,
      selectionType,
      organizationalUnit,
      serviceField,
      position,
      serviceType,
      date,
      numberOfPositions,
      gestorId,
    } = body

    // Validation
    if (!identifier || !institutionId || !selectionType || !organizationalUnit || !serviceField || !position || !serviceType || !date) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // RBAC: Admin can only create VK for their institutions
    if (session.user.role === 'ADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    })

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    // Create VK
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier,
        institutionId,
        selectionType,
        organizationalUnit,
        serviceField,
        position,
        serviceType,
        date: new Date(date),
        numberOfPositions: numberOfPositions || 1,
        gestorId: gestorId || null,
        createdById: session.user.id,
      },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
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
        institution: vk.institution,
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
