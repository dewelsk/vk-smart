import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// POST /api/admin/users/[id]/roles - Assign role to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check if user has SUPERADMIN or ADMIN role
    const userRoles = session?.user?.roles?.map(r => r.role) || []
    const canManageRoles = userRoles.includes(UserRole.SUPERADMIN) || userRoles.includes(UserRole.ADMIN)

    if (!session || !canManageRoles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = params
    const body = await request.json()
    const { role } = body

    // Validation
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Only SUPERADMIN can assign SUPERADMIN role
    const isSuperadmin = userRoles.includes(UserRole.SUPERADMIN)
    if (role === UserRole.SUPERADMIN && !isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can assign superadmin role' },
        { status: 403 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId, deleted: false },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if role assignment already exists
    const existing = await prisma.userRoleAssignment.findUnique({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Role already assigned' },
        { status: 400 }
      )
    }

    // Create role assignment
    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId,
        role,
        assignedBy: session.user.id,
      },
    })

    return NextResponse.json({
      role: {
        id: roleAssignment.id,
        role: roleAssignment.role,
        assignedAt: roleAssignment.assignedAt,
        assignedBy: roleAssignment.assignedBy,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/users/[id]/roles error:', error)
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    )
  }
}
