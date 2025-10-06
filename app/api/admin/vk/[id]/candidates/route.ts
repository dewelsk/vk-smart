import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/vk/:id/candidates - Add candidate to VK
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
    const { userId, cisIdentifier, email } = body

    if (!userId || !cisIdentifier) {
      return NextResponse.json(
        { error: 'userId and cisIdentifier are required' },
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

    // Validate user exists and has role UCHADZAC
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'UCHADZAC') {
      return NextResponse.json(
        { error: 'User must have role UCHADZAC' },
        { status: 400 }
      )
    }

    if (!user.active || user.deleted) {
      return NextResponse.json(
        { error: 'User must be active' },
        { status: 400 }
      )
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        vkId,
        userId,
        deleted: false
      }
    })

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'User is already a candidate in this VK' },
        { status: 400 }
      )
    }

    // Check if cisIdentifier is unique for this VK
    const existingCisId = await prisma.candidate.findFirst({
      where: {
        vkId,
        cisIdentifier,
        deleted: false
      }
    })

    if (existingCisId) {
      return NextResponse.json(
        { error: 'CIS identifier already exists in this VK' },
        { status: 400 }
      )
    }

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        vkId,
        userId,
        cisIdentifier,
        email: email || null
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
      candidate: {
        id: candidate.id,
        cisIdentifier: candidate.cisIdentifier,
        email: candidate.email,
        registeredAt: candidate.registeredAt,
        isArchived: candidate.isArchived,
        user: candidate.user
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding candidate:', error)
    return NextResponse.json(
      { error: 'Failed to add candidate' },
      { status: 500 }
    )
  }
}
