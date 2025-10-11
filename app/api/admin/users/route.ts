import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { UserRole  } from '@prisma/client'
import { prisma } from '@/lib/prisma'


// GET /api/admin/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filters
    const search = searchParams.get('search') || ''
    const roles = searchParams.get('roles')?.split(',').filter(Boolean) || []
    const status = searchParams.get('status') || 'all' // all, active, inactive, pending
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      // Exclude UCHADZAC role - they have separate list
      role: {
        not: UserRole.UCHADZAC,
      },
      deleted: false,
    }

    // Role filter
    if (roles.length > 0) {
      where.role = {
        in: roles as UserRole[],
        not: UserRole.UCHADZAC,
      }
    }

    // Status filter
    if (status === 'active') {
      where.active = true
    } else if (status === 'inactive') {
      where.active = false
    } else if (status === 'pending') {
      where.passwordSetToken = {
        not: null,
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder
    } else if (sortBy === 'role') {
      orderBy.role = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Fetch users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userRoles: true,
          gestorVKs: {
            select: { id: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Format response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      username: user.username,
      role: user.role,
      active: user.active,
      note: user.note,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      passwordSetToken: user.passwordSetToken,
      roles: user.userRoles.map((ur) => ({
        id: ur.id,
        role: ur.role,
        assignedAt: ur.assignedAt,
      })),
      vkCount: user.gestorVKs.length,
    }))

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, surname, username, email, role, note } = body

    // Validation
    if (!name || !surname || !username || !role) {
      return NextResponse.json(
        { error: 'Name, surname, username, and role are required' },
        { status: 400 }
      )
    }

    // Only SUPERADMIN can create SUPERADMIN users
    if (role === 'SUPERADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only superadmin can create superadmin users' },
        { status: 403 }
      )
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Generate password reset token
    const passwordSetToken = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    const passwordSetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        surname,
        username,
        email: email || null,
        role,
        note: note || null,
        passwordSetToken,
        passwordSetTokenExpiry,
        active: true,
      },
    })

    // TODO: Send email with password set link
    // For now, just return the token in response (MVP)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      passwordSetLink: `/set-password?token=${passwordSetToken}`,
    })
  } catch (error) {
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
