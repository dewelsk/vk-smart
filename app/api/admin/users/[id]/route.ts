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

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const user = await prisma.user.findUnique({
      where: {
        id,
        deleted: false,
      },
      include: {
        institutions: {
          include: {
            institution: true,
          },
        },
        userRoles: {
          include: {
            institution: true,
          },
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

    // RBAC: Admin can only see users from their institutions
    if (session.user.role === 'ADMIN') {
      const userInstitutionIds = session.user.institutions.map(i => i.id)
      const hasAccess = user.institutions.some(ui =>
        userInstitutionIds.includes(ui.institutionId)
      )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        username: user.username,
        role: user.role,
        active: user.active,
        note: user.note,
        otpEnabled: user.otpEnabled,
        temporaryAccount: user.temporaryAccount,
        passwordSetToken: user.passwordSetToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        institutions: user.institutions.map((ui) => ({
          id: ui.institution.id,
          code: ui.institution.code,
          name: ui.institution.name,
          assignedAt: ui.assignedAt,
        })),
        roles: user.userRoles.map((ur) => ({
          id: ur.id,
          role: ur.role,
          institutionId: ur.institutionId,
          institutionName: ur.institution?.name || null,
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
