import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/admin/vk/:id/commission/members - Add member to commission
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
    const { userId, isChairman } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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

    // Check if user exists and has KOMISIA role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'KOMISIA') {
      return NextResponse.json(
        { error: 'User is not a commission member (role KOMISIA)' },
        { status: 400 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'User is not active' },
        { status: 400 }
      )
    }

    // Check if user is already in commission
    const existingMember = await prisma.commissionMember.findUnique({
      where: {
        commissionId_userId: {
          commissionId: commission.id,
          userId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already in commission' },
        { status: 400 }
      )
    }

    // If setting as chairman, remove chairman from other members
    if (isChairman) {
      await prisma.commissionMember.updateMany({
        where: {
          commissionId: commission.id,
          isChairman: true
        },
        data: {
          isChairman: false
        }
      })
    }

    // Add member to commission
    const member = await prisma.commissionMember.create({
      data: {
        commissionId: commission.id,
        userId,
        isChairman: isChairman || false
      },
      include: {
        user: true
      }
    })

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        userId: member.userId,
        isChairman: member.isChairman,
        user: {
          id: member.user.id,
          name: member.user.name,
          surname: member.user.surname,
          email: member.user.email
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding commission member:', error)
    return NextResponse.json(
      { error: 'Failed to add commission member' },
      { status: 500 }
    )
  }
}
