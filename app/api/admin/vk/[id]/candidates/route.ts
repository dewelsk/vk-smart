import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/vk/:id/candidates - Add candidates to VK (supports bulk add)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can add candidates
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id
    const body = await request.json()
    const { userIds } = body

    // Support both single userId and array of userIds
    const userIdArray = Array.isArray(userIds) ? userIds : (body.userId ? [body.userId] : [])

    if (!userIdArray || userIdArray.length === 0) {
      return NextResponse.json(
        { error: 'At least one userId is required' },
        { status: 400 }
      )
    }

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

    // Validate all users exist and have role UCHADZAC
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIdArray },
        role: 'UCHADZAC',
        active: true,
        deleted: false
      }
    })

    if (users.length !== userIdArray.length) {
      return NextResponse.json(
        { error: 'Some users not found or are not valid UCHADZAC users' },
        { status: 400 }
      )
    }

    // Check for existing candidates
    const existingCandidates = await prisma.candidate.findMany({
      where: {
        vkId,
        userId: { in: userIdArray },
        deleted: false
      }
    })

    if (existingCandidates.length > 0) {
      const existingUserIds = existingCandidates.map(c => c.userId)
      const existingUsers = users.filter(u => existingUserIds.includes(u.id))
      const names = existingUsers.map(u => `${u.name} ${u.surname}`).join(', ')

      return NextResponse.json(
        { error: `Nasledujúci uchádzači už sú pridaní do tohto VK: ${names}` },
        { status: 400 }
      )
    }

    // Generate CIS identifiers and create candidates
    const timestamp = Date.now()
    const candidatesData = userIdArray.map((userId, index) => ({
      vkId,
      userId,
      cisIdentifier: `CIS${timestamp + index}`,
      email: null
    }))

    // Bulk insert candidates
    await prisma.candidate.createMany({
      data: candidatesData
    })

    // Fetch created candidates with user data
    const createdCandidates = await prisma.candidate.findMany({
      where: {
        vkId,
        userId: { in: userIdArray }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      count: createdCandidates.length,
      candidates: createdCandidates.map(c => ({
        id: c.id,
        cisIdentifier: c.cisIdentifier,
        email: c.email,
        registeredAt: c.registeredAt,
        isArchived: c.isArchived,
        user: c.user
      }))
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding candidates:', error)
    return NextResponse.json(
      { error: 'Failed to add candidates' },
      { status: 500 }
    )
  }
}
