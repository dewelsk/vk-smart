import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// Valid status transitions
const STATUS_FLOW: Record<string, string[]> = {
  PRIPRAVA: ['CAKA_NA_TESTY', 'ZRUSENE'],
  CAKA_NA_TESTY: ['PRIPRAVA', 'TESTOVANIE', 'ZRUSENE'],
  TESTOVANIE: ['CAKA_NA_TESTY', 'HODNOTENIE', 'ZRUSENE'],
  HODNOTENIE: ['TESTOVANIE', 'DOKONCENE', 'ZRUSENE'],
  DOKONCENE: [],
  ZRUSENE: [],
}

// GET /api/admin/vk/[id] - Get VK detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR', 'KOMISIA'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vk = await prisma.vyberoveKonanie.findUnique({
      where: {
        id: params.id,
      },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        gestor: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        candidates: {
          where: {
            deleted: false,
          },
          select: {
            id: true,
            cisIdentifier: true,
            isArchived: true,
            email: true,
            registeredAt: true,
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true,
              },
            },
          },
        },
        assignedTests: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        commission: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                    active: true,
                  },
                },
              },
            },
          },
        },
        evaluationConfig: true,
      },
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // RBAC: Check if user has access to this VK's institution
    if (session.user.role !== 'SUPERADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(vk.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Format response
    const formattedVK = {
      id: vk.id,
      identifier: vk.identifier,
      institutionId: vk.institutionId,
      institution: vk.institution,
      selectionType: vk.selectionType,
      organizationalUnit: vk.organizationalUnit,
      serviceField: vk.serviceField,
      position: vk.position,
      serviceType: vk.serviceType,
      date: vk.date,
      numberOfPositions: vk.numberOfPositions,
      status: vk.status,
      gestorId: vk.gestorId,
      gestor: vk.gestor,
      createdBy: vk.createdBy,
      createdAt: vk.createdAt,
      updatedAt: vk.updatedAt,
      candidates: vk.candidates.map((c) => ({
        id: c.id,
        cisIdentifier: c.cisIdentifier,
        isArchived: c.isArchived,
        email: c.email,
        registeredAt: c.registeredAt,
        user: c.user,
      })),
      assignedTests: vk.assignedTests.map((at) => ({
        id: at.id,
        testId: at.testId,
        level: at.level,
        test: at.test,
      })),
      commission: vk.commission ? {
        id: vk.commission.id,
        members: vk.commission.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          isChairman: m.isChairman,
          user: m.user,
        })),
      } : null,
      evaluationConfig: vk.evaluationConfig,
    }

    return NextResponse.json({ vk: formattedVK })
  } catch (error) {
    console.error('GET /api/admin/vk/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch VK' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/vk/[id] - Update VK
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      selectionType,
      organizationalUnit,
      serviceField,
      position,
      serviceType,
      date,
      numberOfPositions,
      status,
      gestorId,
    } = body

    // Get existing VK
    const existingVK = await prisma.vyberoveKonanie.findUnique({
      where: { id: params.id },
    })

    if (!existingVK) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // RBAC: Admin can only update VK from their institutions
    if (session.user.role === 'ADMIN') {
      const userInstitutionIds = session.user.institutions.map((i) => i.id)
      if (!userInstitutionIds.includes(existingVK.institutionId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate status transition if status is being changed
    if (status && status !== existingVK.status) {
      const allowedTransitions = STATUS_FLOW[existingVK.status] || []
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json({
          error: `Neplatný prechod statusu z "${existingVK.status}" na "${status}". Povolené prechody: ${allowedTransitions.join(', ') || 'žiadne'}`
        }, { status: 400 })
      }

      // Additional validations based on target status
      if (status === 'TESTOVANIE') {
        const testsCount = await prisma.vKTest.count({
          where: { vkId: params.id }
        })
        if (testsCount === 0) {
          return NextResponse.json({
            error: 'Nemožno spustiť testovanie - nie sú priradené žiadne testy'
          }, { status: 400 })
        }
      }
    }

    // Update VK
    const updatedVK = await prisma.vyberoveKonanie.update({
      where: { id: params.id },
      data: {
        selectionType: selectionType ?? existingVK.selectionType,
        organizationalUnit: organizationalUnit ?? existingVK.organizationalUnit,
        serviceField: serviceField ?? existingVK.serviceField,
        position: position ?? existingVK.position,
        serviceType: serviceType ?? existingVK.serviceType,
        date: date ? new Date(date) : existingVK.date,
        numberOfPositions: numberOfPositions ?? existingVK.numberOfPositions,
        status: status ?? existingVK.status,
        gestorId: gestorId !== undefined ? gestorId : existingVK.gestorId,
      },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        gestor: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    })

    return NextResponse.json({
      vk: {
        id: updatedVK.id,
        identifier: updatedVK.identifier,
        position: updatedVK.position,
        selectionType: updatedVK.selectionType,
        organizationalUnit: updatedVK.organizationalUnit,
        serviceField: updatedVK.serviceField,
        serviceType: updatedVK.serviceType,
        date: updatedVK.date,
        numberOfPositions: updatedVK.numberOfPositions,
        status: updatedVK.status,
        institution: updatedVK.institution,
        gestor: updatedVK.gestor,
      },
    })
  } catch (error) {
    console.error('PUT /api/admin/vk/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update VK' },
      { status: 500 }
    )
  }
}
