import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/:id - Get user details with candidates
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Fetch user with candidates
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        institutions: {
          include: {
            institution: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        candidates: {
          where: { deleted: false },
          include: {
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
                score: true,
                maxScore: true,
                successRate: true,
                completedAt: true,
              },
            },
            evaluations: {
              select: {
                id: true,
                totalScore: true,
                maxScore: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For non-SUPERADMIN, check if user has access
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      const hasAccess = user.candidates.some((c) =>
        userInstitutionIds.includes(c.vk.institution.id)
      )

      if (!hasAccess && user.candidates.length > 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        active: user.active,
        note: user.note,
        passwordSetToken: user.passwordSetToken,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        institutions: user.institutions.map((ui) => ({
          id: ui.institution.id,
          code: ui.institution.code,
          name: ui.institution.name,
        })),
        vks: [],  // TODO: Add commission memberships for KOMISIA users
        candidates: user.candidates.map((c) => ({
          id: c.id,
          cisIdentifier: c.cisIdentifier,
          email: c.email,
          isArchived: c.isArchived,
          registeredAt: c.registeredAt,
          vk: c.vk,
          testResults: c.testResults,
          evaluations: c.evaluations,
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/users/:id error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
