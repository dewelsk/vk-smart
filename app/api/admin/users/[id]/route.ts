import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[id] - Get user detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const user = await prisma.user.findUnique({
      where: {
        id,
        deleted: false,
      },
      include: {
        userRoles: {
          orderBy: {
            assignedAt: 'desc',
          },
        },
        gestorVKs: {
          select: {
            id: true,
            identifier: true,
            status: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        username: user.username,
        phone: user.phone,
        role: user.role,
        active: user.active,
        note: user.note,
        otpEnabled: user.otpEnabled,
        temporaryAccount: user.temporaryAccount,
        passwordSetToken: user.passwordSetToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        roles: user.userRoles.map((ur) => ({
          id: ur.id,
          role: ur.role,
          assignedAt: ur.assignedAt,
          assignedBy: ur.assignedBy,
        })),
        vkCount: user.gestorVKs.length,
        recentVKs: user.gestorVKs.map(vk => ({
          id: vk.id,
          identifier: vk.identifier,
          status: vk.status,
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Validate user exists
    const existingUser = await prisma.user.findUnique({
      where: { id, deleted: false },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract and validate fields
    const { name, surname, username, email, active, note } = body

    const errors: Record<string, string> = {}

    if (name !== undefined && !name.trim()) {
      errors.name = 'Meno je povinné'
    }

    if (surname !== undefined && !surname.trim()) {
      errors.surname = 'Priezvisko je povinné'
    }

    if (note !== undefined && note.trim().length > 500) {
      errors.note = 'Poznámka môže mať maximálne 500 znakov'
    }

    if (username !== undefined) {
      if (!username.trim()) {
        errors.username = 'Používateľské meno je povinné'
      } else {
        // Check if username is already taken by another user
        const usernameExists = await prisma.user.findFirst({
          where: {
            username,
            id: { not: id },
            deleted: false,
          },
        })

        if (usernameExists) {
          errors.username = 'Používateľské meno sa už používa'
        }
      }
    }

    if (email !== undefined) {
      if (!email.trim()) {
        errors.email = 'Email je povinný'
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Neplatná emailová adresa'
      } else {
        // Check if email is already taken by another user
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            id: { not: id },
            deleted: false,
          },
        })

        if (emailExists) {
          errors.email = 'Email sa už používa'
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name.trim()
    if (surname !== undefined) updateData.surname = surname.trim()
    if (username !== undefined) updateData.username = username.trim()
    if (email !== undefined) updateData.email = email.trim()
    if (active !== undefined) updateData.active = Boolean(active)
    if (note !== undefined) updateData.note = note.trim() || null

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        surname: updatedUser.surname,
        username: updatedUser.username,
        email: updatedUser.email,
        active: updatedUser.active,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error) {
    console.error('PATCH /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id, deleted: false },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deletion of superadmin users
    if (user.role === 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Superadmin nemožno vymazať' },
        { status: 400 }
      )
    }

    // Soft delete the user
    await prisma.user.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Používateľ bol úspešne vymazaný',
    })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
