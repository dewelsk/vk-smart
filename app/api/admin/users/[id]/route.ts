import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/users/[id] - Get user detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
        deleted: false,
      },
      include: {
        institutions: {
          include: {
            institution: true,
          },
        },
        gestorVKs: {
          select: {
            id: true,
            identifier: true,
            position: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // RBAC: Admin can only see users from their institutions
    if (session.user.role === 'ADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      const hasAccess = user.institutions.some((ui) =>
        userInstitutionIds.includes(ui.institutionId)
      )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Format response
    const formattedUser = {
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
      institutions: user.institutions.map((ui) => ({
        id: ui.institution.id,
        code: ui.institution.code,
        name: ui.institution.name,
      })),
      vks: user.gestorVKs.map((vk) => ({
        id: vk.id,
        identifier: vk.identifier,
        position: vk.position,
        status: vk.status,
      })),
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, surname, email, role, note, active, institutionIds } = body

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id, deleted: false },
      include: {
        institutions: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // RBAC: Admin can only update users from their institutions
    if (session.user.role === 'ADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      const hasAccess = existingUser.institutions.some((ui) =>
        userInstitutionIds.includes(ui.institutionId)
      )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name ?? existingUser.name,
        surname: surname ?? existingUser.surname,
        email: email ?? existingUser.email,
        role: role ?? existingUser.role,
        note: note ?? existingUser.note,
        active: active ?? existingUser.active,
      },
    })

    // Update institutions if provided
    if (institutionIds !== undefined) {
      // Remove old assignments
      await prisma.userInstitution.deleteMany({
        where: { userId: params.id },
      })

      // Add new assignments
      if (institutionIds.length > 0) {
        await prisma.userInstitution.createMany({
          data: institutionIds.map((institutionId: string) => ({
            userId: params.id,
            institutionId,
            assignedBy: session.user.id,
          })),
        })
      }
    }

    // Fetch updated user with institutions
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        institutions: {
          include: {
            institution: true,
          },
        },
      },
    })

    return NextResponse.json({
      user: {
        id: user!.id,
        name: user!.name,
        surname: user!.surname,
        email: user!.email,
        username: user!.username,
        role: user!.role,
        active: user!.active,
        note: user!.note,
        institutions: user!.institutions.map((ui) => ({
          id: ui.institution.id,
          code: ui.institution.code,
          name: ui.institution.name,
        })),
      },
    })
  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Soft delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id, deleted: false },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete
    await prisma.user.update({
      where: { id: params.id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
