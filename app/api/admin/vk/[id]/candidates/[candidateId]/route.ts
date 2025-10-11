import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/vk/:id/candidates/:candidateId - Remove candidate from VK (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, candidateId: string } }
) {
  try {
    const session = await auth()

    // Check authentication - Only ADMIN and SUPERADMIN can remove candidates
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

    // ADMIN can remove candidates from any VK (no institution restrictions anymore)

    // Soft delete the candidate
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedEmail: candidate.email
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Candidate removed successfully'
    })

  } catch (error) {
    console.error('Error removing candidate:', error)
    return NextResponse.json(
      { error: 'Failed to remove candidate' },
      { status: 500 }
    )
  }
}
