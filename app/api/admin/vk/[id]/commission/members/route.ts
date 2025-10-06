import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// POST /api/admin/vk/:id/commission/members - Add member(s) to commission
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can add commission members
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id
    const body = await request.json()
    const { userIds, chairmanId } = body

    // Support both single user (legacy) and bulk add
    const userIdsArray = Array.isArray(userIds) ? userIds : (body.userId ? [body.userId] : [])

    if (userIdsArray.length === 0) {
      return NextResponse.json(
        { error: 'userIds is required' },
        { status: 400 }
      )
    }

    // Check if VK exists
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      include: {
        commission: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
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

    // Create commission if doesn't exist
    let commission = vk.commission
    if (!commission) {
      commission = await prisma.commission.create({
        data: {
          vkId
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      })
    }

    // Validate all users
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIdsArray },
        role: 'KOMISIA',
        active: true
      }
    })

    if (users.length !== userIdsArray.length) {
      return NextResponse.json(
        { error: 'One or more users not found, not active, or not KOMISIA role' },
        { status: 400 }
      )
    }

    // Get existing members
    const existingMembers = await prisma.commissionMember.findMany({
      where: {
        commissionId: commission.id
      }
    })

    // Find members to remove (exist in DB but not in userIdsArray)
    const existingUserIds = existingMembers.map(m => m.userId)
    const toRemove = existingUserIds.filter(id => !userIdsArray.includes(id))

    // Find members to add (in userIdsArray but not in DB)
    const toAdd = userIdsArray.filter(id => !existingUserIds.includes(id))

    // Remove members that are no longer selected
    if (toRemove.length > 0) {
      await prisma.commissionMember.deleteMany({
        where: {
          commissionId: commission.id,
          userId: { in: toRemove }
        }
      })
    }

    // Add new members
    if (toAdd.length > 0) {
      const newMembersData = toAdd.map(userId => ({
        commissionId: commission.id,
        userId,
        isChairman: false
      }))
      await prisma.commissionMember.createMany({
        data: newMembersData
      })
    }

    // Update chairman status for all members
    await prisma.commissionMember.updateMany({
      where: {
        commissionId: commission.id
      },
      data: {
        isChairman: false
      }
    })

    if (chairmanId && userIdsArray.includes(chairmanId)) {
      await prisma.commissionMember.updateMany({
        where: {
          commissionId: commission.id,
          userId: chairmanId
        },
        data: {
          isChairman: true
        }
      })
    }

    // Fetch created members with user data
    const createdMembers = await prisma.commissionMember.findMany({
      where: {
        commissionId: commission.id,
        userId: { in: userIdsArray }
      },
      include: {
        user: true
      }
    })

    return NextResponse.json({
      success: true,
      members: createdMembers.map(m => ({
        id: m.id,
        userId: m.userId,
        isChairman: m.isChairman,
        user: {
          id: m.user.id,
          name: m.user.name,
          surname: m.user.surname,
          email: m.user.email
        }
      }))
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding commission member:', error)
    return NextResponse.json(
      { error: 'Failed to add commission member' },
      { status: 500 }
    )
  }
}
