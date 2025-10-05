import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build where clause based on user role
    const vkWhere: any = {}
    const candidateWhere: any = { deleted: false }
    const userWhere: any = { deleted: false, role: { not: UserRole.UCHADZAC } }

    // RBAC: Admin/Gestor/Komisia see only their institutions
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      vkWhere.institutionId = { in: userInstitutionIds }
      candidateWhere.vk = { institutionId: { in: userInstitutionIds } }

      // For users, we want to see users from the same institutions
      userWhere.institutions = {
        some: {
          institutionId: { in: userInstitutionIds },
        },
      }
    }

    // Get statistics
    const [
      totalVKs,
      activeVKs,
      totalCandidates,
      totalUsers,
      recentVKs,
      vksByStatus,
    ] = await Promise.all([
      // Total VKs
      prisma.vyberoveKonanie.count({ where: vkWhere }),

      // Active VKs (not DOKONCENE or ZRUSENE)
      prisma.vyberoveKonanie.count({
        where: {
          ...vkWhere,
          status: {
            notIn: ['DOKONCENE', 'ZRUSENE'],
          },
        },
      }),

      // Total candidates
      prisma.candidate.count({ where: candidateWhere }),

      // Total users (excluding UCHADZAC)
      prisma.user.count({ where: userWhere }),

      // Recent VKs (last 5)
      prisma.vyberoveKonanie.findMany({
        where: vkWhere,
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          institution: {
            select: {
              code: true,
              name: true,
            },
          },
          gestor: {
            select: {
              name: true,
              surname: true,
            },
          },
          candidates: {
            where: { deleted: false },
            select: { id: true },
          },
        },
      }),

      // VKs by status
      prisma.vyberoveKonanie.groupBy({
        by: ['status'],
        where: vkWhere,
        _count: true,
      }),
    ])

    // Format recent VKs
    const formattedRecentVKs = recentVKs.map((vk) => ({
      id: vk.id,
      identifier: vk.identifier,
      position: vk.position,
      status: vk.status,
      institution: vk.institution,
      gestor: vk.gestor,
      candidatesCount: vk.candidates.length,
      createdAt: vk.createdAt,
    }))

    // Format VKs by status
    const statusBreakdown = vksByStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      stats: {
        totalVKs,
        activeVKs,
        totalCandidates,
        totalUsers,
      },
      recentVKs: formattedRecentVKs,
      statusBreakdown,
    })
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
