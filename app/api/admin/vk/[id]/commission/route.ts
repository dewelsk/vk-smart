import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/admin/vk/:id/commission - Create commission for VK
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can create commission
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id

    // Check if VK exists
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      include: {
        commission: true
      }
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // Check if commission already exists
    if (vk.commission) {
      return NextResponse.json(
        { error: 'Commission already exists' },
        { status: 400 }
      )
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

    // Create commission
    const commission = await prisma.commission.create({
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

    return NextResponse.json({
      success: true,
      commission: {
        id: commission.id,
        vkId: commission.vkId,
        members: commission.members
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating commission:', error)
    return NextResponse.json(
      { error: 'Failed to create commission' },
      { status: 500 }
    )
  }
}
