import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH /api/admin/vk/:id/gestor - Change VK gestor
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can change gestor
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id
    const body = await request.json()
    const { gestorId } = body

    if (!gestorId) {
      return NextResponse.json(
        { error: 'gestorId is required' },
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

    // Check if new gestor exists and has GESTOR role
    const newGestor = await prisma.user.findUnique({
      where: { id: gestorId }
    })

    if (!newGestor) {
      return NextResponse.json(
        { error: 'Gestor not found' },
        { status: 404 }
      )
    }

    if (newGestor.role !== 'GESTOR') {
      return NextResponse.json(
        { error: 'User is not a gestor' },
        { status: 400 }
      )
    }

    if (!newGestor.active) {
      return NextResponse.json(
        { error: 'Gestor is not active' },
        { status: 400 }
      )
    }

    // Update gestor
    const updatedVK = await prisma.vyberoveKonanie.update({
      where: { id: vkId },
      data: { gestorId },
      include: {
        gestor: true,
        institution: true
      }
    })

    return NextResponse.json({
      success: true,
      vk: {
        id: updatedVK.id,
        gestorId: updatedVK.gestorId,
        gestor: updatedVK.gestor ? {
          id: updatedVK.gestor.id,
          name: updatedVK.gestor.name,
          surname: updatedVK.gestor.surname,
          email: updatedVK.gestor.email
        } : null
      }
    })

  } catch (error) {
    console.error('Error changing gestor:', error)
    return NextResponse.json(
      { error: 'Failed to change gestor' },
      { status: 500 }
    )
  }
}
