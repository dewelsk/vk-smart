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
    const { role, institutionId } = body

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

    // Check if user exists and get their existing roles
    const user = await prisma.user.findUnique({
      where: { id: userId, deleted: false },
      include: {
        userRoles: {
          select: {
            institutionId: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Auto-inherit institutionId from user's existing roles
    // If user has any role with an institutionId, use the first one found
    // Otherwise, use null (global role)
    let inheritedInstitutionId: string | null = null
    if (user.userRoles.length > 0) {
      const existingRoleWithInstitution = user.userRoles.find(r => r.institutionId !== null)
      if (existingRoleWithInstitution) {
        inheritedInstitutionId = existingRoleWithInstitution.institutionId
      }
    }

    // Override with provided institutionId if explicitly specified (for backwards compatibility)
    const finalInstitutionId = institutionId !== undefined ? institutionId : inheritedInstitutionId

    // RBAC: Admin (non-superadmin) can only assign roles within their institutions
    const isAdminOnly = userRoles.includes(UserRole.ADMIN) && !isSuperadmin
    if (isAdminOnly && finalInstitutionId) {
      const userInstitutionIds = session.user.institutions.map(i => i.id)
      if (!userInstitutionIds.includes(finalInstitutionId)) {
        return NextResponse.json(
          { error: 'You can only assign roles in your institutions' },
          { status: 403 }
        )
      }
    }

    // If institution specified, verify it exists
    if (finalInstitutionId) {
      const institution = await prisma.institution.findUnique({
        where: { id: finalInstitutionId },
      })

      if (!institution) {
        return NextResponse.json(
          { error: 'Institution not found' },
          { status: 404 }
        )
      }
    }

    // Check if role assignment already exists
    const existing = await prisma.userRoleAssignment.findUnique({
      where: {
        userId_role_institutionId: {
          userId,
          role,
          institutionId: finalInstitutionId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Role already assigned' },
        { status: 400 }
      )
    }

    // Create role assignment with inherited or specified institutionId
    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId,
        role,
        institutionId: finalInstitutionId,
        assignedBy: session.user.id,
      },
      include: {
        institution: true,
      },
    })

    return NextResponse.json({
      role: {
        id: roleAssignment.id,
        role: roleAssignment.role,
        institutionId: roleAssignment.institutionId,
        institutionName: roleAssignment.institution?.name || null,
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
