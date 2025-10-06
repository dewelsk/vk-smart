import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/vk/:id/candidates/available - Get users available to add as candidates
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can view available candidates
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id

    // Check if VK exists
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId }
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // Check permissions for ADMIN
    if (session.user.role === 'ADMIN') {
      const userInstitutions = await prisma.userInstitution.findMany({
        where: { userId: session.user.id },
        select: { institutionId: true }
      })
      const institutionIds = userInstitutions.map(ui => ui.institutionId)

      if (!institutionIds.includes(vk.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get existing candidates for this VK
    const existingCandidates = await prisma.candidate.findMany({
      where: {
        vkId,
        deleted: false
      },
      select: {
        userId: true
      }
    })

    const existingUserIds = existingCandidates.map(c => c.userId)

    // Get all active users with role UCHADZAC that are not already candidates
    const availableUsers = await prisma.user.findMany({
      where: {
        role: 'UCHADZAC',
        active: true,
        deleted: false,
        id: {
          notIn: existingUserIds
        }
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        active: true
      },
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      users: availableUsers
    })

  } catch (error) {
    console.error('Error fetching available users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available users' },
      { status: 500 }
    )
  }
}
