import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/admin/applicants - List candidates (applicants)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user.role || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filters
    const search = searchParams.get('search') || ''
    const vkId = searchParams.get('vkId') || ''
    const archived = searchParams.get('archived') || 'false' // false, true, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'registeredAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

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

    // Search filter
    if (search) {
      where.OR = [
        { cisIdentifier: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'surname') {
      orderBy.surname = sortOrder
    } else if (sortBy === 'cisIdentifier') {
      orderBy.cisIdentifier = sortOrder
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder
    } else {
      orderBy.registeredAt = sortOrder
    }

    // Fetch candidates with VK info
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vk: {
            select: {
              id: true,
              identifier: true,
              position: true,
              status: true,
              startDateTime: true,
              assignedTests: {
                select: {
                  id: true,
                },
              },
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
    const formattedApplicants = candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      surname: candidate.surname,
      email: candidate.email,
      cisIdentifier: candidate.cisIdentifier,
      active: candidate.active,
      isArchived: candidate.isArchived,
      registeredAt: candidate.registeredAt,
      createdAt: candidate.registeredAt,
      vk: candidate.vk,
      testResultsCount: candidate.vk?.assignedTests?.length || 0,
      evaluationsCount: candidate.evaluations.length,
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

// POST /api/admin/applicants - Create new candidate (applicant)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user.role || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      vkId,
      cisIdentifier,
      pin,
      name,
      surname,
      email,
      phone,
      birthDate,
    } = body

    // Validation
    if (!vkId || !cisIdentifier || !name || !surname) {
      return NextResponse.json(
        { error: 'VK ID, CIS Identifier, Name, and Surname are required' },
        { status: 400 }
      )
    }

    // Check if VK exists
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // Check if cisIdentifier is unique
    const existingCandidate = await prisma.candidate.findUnique({
      where: { cisIdentifier },
    })

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'CIS Identifier already exists' },
        { status: 400 }
      )
    }

    // Hash PIN if provided
    let hashedPin = null
    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10)
    }

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        vkId,
        cisIdentifier,
        password: hashedPin,
        name,
        surname,
        email: email || null,
        phone: phone || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        active: true,
      },
      include: {
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
        id: candidate.id,
        cisIdentifier: candidate.cisIdentifier,
        name: candidate.name,
        surname: candidate.surname,
        email: candidate.email,
        phone: candidate.phone,
        birthDate: candidate.birthDate,
        active: candidate.active,
        registeredAt: candidate.registeredAt,
        vk: candidate.vk,
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
