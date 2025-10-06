import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// PATCH /api/superadmin/institutions/[id]/toggle-active - Toggle institution active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication and authorization
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { active } = body

    if (active === undefined) {
      return NextResponse.json(
        { error: 'Active status is required' },
        { status: 400 }
      )
    }

    // Check if institution exists
    const existing = await prisma.institution.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      )
    }

    // Update active status
    const institution = await prisma.institution.update({
      where: { id: params.id },
      data: { active }
    })

    return NextResponse.json({
      success: true,
      institution: {
        id: institution.id,
        active: institution.active
      }
    })

  } catch (error) {
    console.error('Error toggling institution active status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle institution active status' },
      { status: 500 }
    )
  }
}
