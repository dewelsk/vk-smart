import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/admin/applicants/[id] - Get candidate detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user.role || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: {
        id: params.id,
        deleted: false,
      },
      include: {
        vk: {
          select: {
            id: true,
            identifier: true,
            position: true,
            selectionType: true,
            organizationalUnit: true,
            status: true,
            startDateTime: true,
          },
        },
        testSessions: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
              },
            },
            vkTest: {
              select: {
                id: true,
                level: true,
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
                testType: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
                testTypeCondition: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
        evaluations: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    // Get all tests assigned to this VK
    const vkTests = await prisma.vKTest.findMany({
      where: { vkId: candidate.vkId },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            testType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            testTypeCondition: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { level: 'asc' },
    })

    // Build assigned tests with status
    const assignedTests = vkTests.map((vkTest) => {
      const session = candidate.testSessions.find(s => s.vkTestId === vkTest.id)

      return {
        vkTestId: vkTest.id,
        level: vkTest.level,
        test: {
          id: vkTest.test.id,
          name: vkTest.test.name,
          testType: vkTest.test.testType
            ? {
                id: vkTest.test.testType.id,
                name: vkTest.test.testType.name,
                description: vkTest.test.testType.description,
              }
            : null,
          testTypeCondition: vkTest.test.testTypeCondition
            ? {
                id: vkTest.test.testTypeCondition.id,
                name: vkTest.test.testTypeCondition.name,
                description: vkTest.test.testTypeCondition.description,
              }
            : null,
        },
        questionCount: vkTest.questionCount,
        durationMinutes: vkTest.durationMinutes,
        minScore: vkTest.minScore,
        session: session
          ? {
              id: session.id,
              status: session.status,
              score: session.score,
              maxScore: session.maxScore,
              passed: session.passed,
              startedAt: session.startedAt,
              completedAt: session.completedAt,
            }
          : null,
      }
    })

    // Format response
    const formattedApplicant = {
      id: candidate.id,
      name: candidate.name,
      surname: candidate.surname,
      cisIdentifier: candidate.cisIdentifier,
      email: candidate.email,
      phone: candidate.phone,
      birthDate: candidate.birthDate,
      active: candidate.active,
      isArchived: candidate.isArchived,
      registeredAt: candidate.registeredAt,
      lastLoginAt: candidate.lastLoginAt,
      vk: candidate.vk,
      assignedTests,
      testSessions: candidate.testSessions.map((ts) => ({
        id: ts.id,
        testId: ts.testId,
        testName: ts.test.name,
        status: ts.status,
        score: ts.score,
        maxScore: ts.maxScore,
        passed: ts.passed,
        startedAt: ts.startedAt,
        completedAt: ts.completedAt,
      })),
      testResults: candidate.testResults.map((tr) => ({
        id: tr.id,
        test: {
          id: tr.testId,
          name: tr.test.name,
          testType: tr.test.testType
            ? {
                id: tr.test.testType.id,
                name: tr.test.testType.name,
                description: tr.test.testType.description,
              }
            : null,
          testTypeCondition: tr.test.testTypeCondition
            ? {
                id: tr.test.testTypeCondition.id,
                name: tr.test.testTypeCondition.name,
                description: tr.test.testTypeCondition.description,
              }
            : null,
        },
        score: tr.score,
        maxScore: tr.maxScore,
        passed: tr.passed,
        completedAt: tr.completedAt,
      })),
      evaluations: candidate.evaluations.map((ev) => ({
        id: ev.id,
        totalScore: ev.totalScore,
        maxScore: ev.maxScore,
        finalized: ev.finalized,
        finalizedAt: ev.finalizedAt,
        member: ev.member,
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

// PATCH /api/admin/applicants/[id] - Update candidate
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user.role || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      surname,
      email,
      phone,
      birthDate,
      active,
      isArchived,
      pin,
    } = body

    // Get existing candidate
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id: params.id, deleted: false },
    })

    if (!existingCandidate) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (surname !== undefined) updateData.surname = surname
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null
    if (active !== undefined) updateData.active = active
    if (isArchived !== undefined) updateData.isArchived = isArchived

    // Update PIN if provided
    if (pin) {
      updateData.password = await bcrypt.hash(pin, 10)
    }

    // Update candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: params.id },
      data: updateData,
      include: {
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
        id: updatedCandidate.id,
        name: updatedCandidate.name,
        surname: updatedCandidate.surname,
        cisIdentifier: updatedCandidate.cisIdentifier,
        email: updatedCandidate.email,
        phone: updatedCandidate.phone,
        birthDate: updatedCandidate.birthDate,
        active: updatedCandidate.active,
        isArchived: updatedCandidate.isArchived,
        registeredAt: updatedCandidate.registeredAt,
        vk: updatedCandidate.vk,
      },
    })
  } catch (error) {
    console.error('PATCH /api/admin/applicants/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update applicant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/applicants/[id] - Soft delete candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user.role || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id, deleted: false },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 })
    }

    // Soft delete
    await prisma.candidate.update({
      where: { id: params.id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedEmail: candidate.email,
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
