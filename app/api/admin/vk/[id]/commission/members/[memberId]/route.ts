import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// DELETE /api/admin/vk/:id/commission/members/:memberId - Remove member from commission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, memberId: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can remove commission members
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id
    const memberId = params.memberId

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

    // Check if member exists
    const member = await prisma.commissionMember.findUnique({
      where: { id: memberId },
      include: {
        commission: true
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Commission member not found' },
        { status: 404 }
      )
    }

    // Check if member belongs to this VK
    if (member.commission.vkId !== vkId) {
      return NextResponse.json(
        { error: 'Commission member does not belong to this VK' },
        { status: 400 }
      )
    }

    // Delete member
    await prisma.commissionMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({
      success: true,
      message: 'Commission member removed'
    })

  } catch (error) {
    console.error('Error removing commission member:', error)
    return NextResponse.json(
      { error: 'Failed to remove commission member' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/vk/:id/commission/members/:memberId - Toggle chairman status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, memberId: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can update commission members
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id
    const memberId = params.memberId
    const body = await request.json()
    const { isChairman } = body

    if (isChairman === undefined) {
      return NextResponse.json(
        { error: 'isChairman is required' },
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

    // Check if member exists
    const member = await prisma.commissionMember.findUnique({
      where: { id: memberId },
      include: {
        commission: true,
        user: true
      }
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Commission member not found' },
        { status: 404 }
      )
    }

    // Check if member belongs to this VK
    if (member.commission.vkId !== vkId) {
      return NextResponse.json(
        { error: 'Commission member does not belong to this VK' },
        { status: 400 }
      )
    }

    // If setting as chairman, remove chairman from other members
    if (isChairman) {
      await prisma.commissionMember.updateMany({
        where: {
          commissionId: member.commissionId,
          isChairman: true,
          id: { not: memberId }
        },
        data: {
          isChairman: false
        }
      })
    }

    // Update member
    const updatedMember = await prisma.commissionMember.update({
      where: { id: memberId },
      data: { isChairman },
      include: {
        user: true
      }
    })

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        isChairman: updatedMember.isChairman,
        user: {
          id: updatedMember.user.id,
          name: updatedMember.user.name,
          surname: updatedMember.user.surname,
          email: updatedMember.user.email
        }
      }
    })

  } catch (error) {
    console.error('Error updating commission member:', error)
    return NextResponse.json(
      { error: 'Failed to update commission member' },
      { status: 500 }
    )
  }
}
