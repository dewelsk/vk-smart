import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/users/[id]/roles/[roleId] - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId, roleId } = params

    // Check if role assignment exists
    const roleAssignment = await prisma.userRoleAssignment.findUnique({
      where: { id: roleId },
      include: {
        user: true,
      },
    })

    if (!roleAssignment) {
      return NextResponse.json(
        { error: 'Role assignment not found' },
        { status: 404 }
      )
    }

    // Verify the role belongs to the specified user
    if (roleAssignment.userId !== userId) {
      return NextResponse.json(
        { error: 'Role does not belong to this user' },
        { status: 400 }
      )
    }

    // Only SUPERADMIN can remove SUPERADMIN role
    if (roleAssignment.role === 'SUPERADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only superadmin can remove superadmin role' },
        { status: 403 }
      )
    }

    // RBAC: Removed institution-based RBAC check (institutions model removed)

    // Delete role assignment
    await prisma.userRoleAssignment.delete({
      where: { id: roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id]/roles/[roleId] error:', error)
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    )
  }
}
