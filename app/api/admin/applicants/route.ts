import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/applicants - List applicants with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filters
    const search = searchParams.get('search') || ''
    const vkId = searchParams.get('vkId') || ''
    const institutionId = searchParams.get('institutionId') || ''
    const archived = searchParams.get('archived') || 'false' // false, true, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'registeredAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      deleted: false,
    }

    // Archived filter
    if (archived === 'true') {
      where.isArchived = true
    } else if (archived === 'false') {
      where.isArchived = false
    }

    // VK filter
    if (vkId) {
      where.vkId = vkId
    }

    // Institution filter - filter by VK's institution
    if (institutionId) {
      where.vk = {
        institutionId,
      }
    }

    // RBAC: Admin/Gestor/Komisia see only applicants from their institutions
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      where.vk = {
        ...where.vk,
        institutionId: {
          in: userInstitutionIds,
        },
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { cisIdentifier: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { surname: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'cisIdentifier') {
      orderBy.cisIdentifier = sortOrder
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder
    } else {
      orderBy.registeredAt = sortOrder
    }

    // Fetch applicants
    const [applicants, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
          vk: {
            select: {
              id: true,
              identifier: true,
              position: true,
              status: true,
              institution: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
          testResults: {
            select: {
              id: true,
            },
          },
          evaluations: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.candidate.count({ where }),
    ])

    // Format response
    const formattedApplicants = applicants.map((applicant) => ({
      id: applicant.id,
      cisIdentifier: applicant.cisIdentifier,
      email: applicant.email,
      isArchived: applicant.isArchived,
      registeredAt: applicant.registeredAt,
      user: {
        id: applicant.user.id,
        name: applicant.user.name,
        surname: applicant.user.surname,
        email: applicant.user.email,
      },
      vk: {
        id: applicant.vk.id,
        identifier: applicant.vk.identifier,
        position: applicant.vk.position,
        status: applicant.vk.status,
        institution: applicant.vk.institution,
      },
      testResultsCount: applicant.testResults.length,
      evaluationsCount: applicant.evaluations.length,
    }))

    return NextResponse.json({
      applicants: formattedApplicants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/applicants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    )
  }
}

// POST /api/admin/applicants - Create new applicant
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vkId, userId, cisIdentifier, email } = body

    // Validation
    if (!vkId || !userId || !cisIdentifier) {
      return NextResponse.json(
        { error: 'VK ID, User ID, and CIS Identifier are required' },
        { status: 400 }
      )
    }

    // Check if VK exists
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      include: { institution: true },
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // RBAC: Check if user has access to this VK's institution
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(vk.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if user exists and has UCHADZAC role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== 'UCHADZAC') {
      return NextResponse.json(
        { error: 'User not found or is not an applicant' },
        { status: 400 }
      )
    }

    // Check if applicant already exists for this VK
    const existingApplicant = await prisma.candidate.findFirst({
      where: {
        vkId,
        userId,
      },
    })

    if (existingApplicant) {
      return NextResponse.json(
        { error: 'Applicant already exists for this VK' },
        { status: 400 }
      )
    }

    // Check if cisIdentifier is unique for this VK
    const existingCis = await prisma.candidate.findUnique({
      where: {
        vkId_cisIdentifier: {
          vkId,
          cisIdentifier,
        },
      },
    })

    if (existingCis) {
      return NextResponse.json(
        { error: 'CIS Identifier already exists for this VK' },
        { status: 400 }
      )
    }

    // Create applicant
    const applicant = await prisma.candidate.create({
      data: {
        vkId,
        userId,
        cisIdentifier,
        email: email || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        vk: {
          select: {
            id: true,
            identifier: true,
            position: true,
          },
        },
      },
    })

    return NextResponse.json({
      applicant: {
        id: applicant.id,
        cisIdentifier: applicant.cisIdentifier,
        email: applicant.email,
        registeredAt: applicant.registeredAt,
        user: applicant.user,
        vk: applicant.vk,
      },
    })
  } catch (error) {
    console.error('POST /api/admin/applicants error:', error)
    return NextResponse.json(
      { error: 'Failed to create applicant' },
      { status: 500 }
    )
  }
}
