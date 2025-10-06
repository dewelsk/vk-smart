import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// GET /api/admin/applicants/[id] - Get applicant detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const applicant = await prisma.candidate.findUnique({
      where: {
        id: params.id,
        deleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            username: true,
            active: true,
            lastLoginAt: true,
          },
        },
        vk: {
          include: {
            institution: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        testResults: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            filename: true,
            uploadedAt: true,
          },
        },
        evaluations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
            member: {
              select: {
                id: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    // RBAC: Check if user has access to this applicant's institution
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(applicant.vk.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Format response
    const formattedApplicant = {
      id: applicant.id,
      cisIdentifier: applicant.cisIdentifier,
      email: applicant.email,
      isArchived: applicant.isArchived,
      registeredAt: applicant.registeredAt,
      user: applicant.user,
      vk: {
        id: applicant.vk.id,
        identifier: applicant.vk.identifier,
        position: applicant.vk.position,
        selectionType: applicant.vk.selectionType,
        organizationalUnit: applicant.vk.organizationalUnit,
        status: applicant.vk.status,
        date: applicant.vk.date,
        institution: applicant.vk.institution,
      },
      testResults: applicant.testResults.map((tr) => ({
        id: tr.id,
        testId: tr.testId,
        testName: tr.test.name,
        score: tr.score,
        maxScore: tr.maxScore,
        passed: tr.passed,
        completedAt: tr.completedAt,
      })),
      documents: applicant.documents,
      evaluations: applicant.evaluations.map((ev) => ({
        id: ev.id,
        totalScore: ev.totalScore,
        maxScore: ev.maxScore,
        successRate: ev.successRate,
        finalized: ev.finalized,
        finalizedAt: ev.finalizedAt,
        user: ev.user,
        createdAt: ev.createdAt,
      })),
    }

    return NextResponse.json({ applicant: formattedApplicant })
  } catch (error) {
    console.error('GET /api/admin/applicants/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applicant' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/applicants/[id] - Update applicant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, isArchived } = body

    // Get existing applicant
    const existingApplicant = await prisma.candidate.findUnique({
      where: { id: params.id, deleted: false },
      include: {
        vk: {
          select: {
            institutionId: true,
          },
        },
      },
    })

    if (!existingApplicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    // RBAC: Check if user has access to this applicant's institution
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(existingApplicant.vk.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update applicant
    const updatedApplicant = await prisma.candidate.update({
      where: { id: params.id },
      data: {
        email: email !== undefined ? email : existingApplicant.email,
        isArchived: isArchived !== undefined ? isArchived : existingApplicant.isArchived,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        vk: {
          select: {
            id: true,
            identifier: true,
            position: true,
          },
        },
      },
    })

    return NextResponse.json({
      applicant: {
        id: updatedApplicant.id,
        cisIdentifier: updatedApplicant.cisIdentifier,
        email: updatedApplicant.email,
        isArchived: updatedApplicant.isArchived,
        registeredAt: updatedApplicant.registeredAt,
        user: updatedApplicant.user,
        vk: updatedApplicant.vk,
      },
    })
  } catch (error) {
    console.error('PUT /api/admin/applicants/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update applicant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/applicants/[id] - Soft delete applicant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if applicant exists
    const applicant = await prisma.candidate.findUnique({
      where: { id: params.id, deleted: false },
      include: {
        vk: {
          select: {
            institutionId: true,
          },
        },
      },
    })

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    // RBAC: Check if user has access
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(applicant.vk.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Soft delete
    await prisma.candidate.update({
      where: { id: params.id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedEmail: applicant.email,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/applicants/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete applicant' },
      { status: 500 }
    )
  }
}
