import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/vk/:id/candidates/:candidateId/restore - Restore deleted candidate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, candidateId: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can restore candidates
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id
    const candidateId = params.candidateId

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        vk: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Verify candidate belongs to this VK
    if (candidate.vkId !== vkId) {
      return NextResponse.json({ error: 'Candidate does not belong to this VK' }, { status: 400 })
    }

    // Check if candidate is deleted
    if (!candidate.deleted) {
      return NextResponse.json({ error: 'Candidate is not deleted' }, { status: 400 })
    }

    // Restore the candidate
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        deleted: false,
        deletedAt: null,
        deletedEmail: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Candidate restored successfully'
    })

  } catch (error) {
    console.error('Error restoring candidate:', error)
    return NextResponse.json(
      { error: 'Failed to restore candidate' },
      { status: 500 }
    )
  }
}
