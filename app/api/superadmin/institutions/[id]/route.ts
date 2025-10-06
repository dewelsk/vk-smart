import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// PATCH /api/superadmin/institutions/[id] - Update institution
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
    const { name, description } = body

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

    // Update institution (code is immutable)
    const institution = await prisma.institution.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description
      }
    })

    return NextResponse.json({ institution })

  } catch (error) {
    console.error('Error updating institution:', error)
    return NextResponse.json(
      { error: 'Failed to update institution' },
      { status: 500 }
    )
  }
}
