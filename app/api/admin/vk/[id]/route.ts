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
          select: {
            id: true,
            cisIdentifier: true,
            isArchived: true,
            deleted: true,
            email: true,
            registeredAt: true,
          },
        },
        assignedTests: {
          include: {
            test: {
              select: {
                id: true,
                name: true,
                testType: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        evaluationConfig: {
          select: {
            id: true,
            evaluatedTraits: true,
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

    // Format response
    const formattedVK = {
      id: vk.id,
      identifier: vk.identifier,
      selectionType: vk.selectionType,
      organizationalUnit: vk.organizationalUnit,
      serviceField: vk.serviceField,
      position: vk.position,
      serviceType: vk.serviceType,
      startDateTime: vk.startDateTime,
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
      identifier,
      selectionType,
      organizationalUnit,
      serviceField,
      position,
      serviceType,
      startDateTime,
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

    // Check if VK is in DOKONCENE status - cannot be edited
    if (existingVK.status === 'DOKONCENE' || existingVK.status === 'ZRUSENE') {
      return NextResponse.json({
        error: 'Výberové konanie v stave DOKONČENÉ alebo ZRUŠENÉ nie je možné upravovať'
      }, { status: 400 })
    }

    // Validate fields
    const errors: Record<string, string> = {}

    if (identifier !== undefined && !identifier.trim()) {
      errors.identifier = 'Identifikátor je povinný'
    }

    if (selectionType !== undefined && !selectionType.trim()) {
      errors.selectionType = 'Druh konania je povinný'
    }

    if (organizationalUnit !== undefined && !organizationalUnit.trim()) {
      errors.organizationalUnit = 'Organizačný útvar je povinný'
    }

    if (serviceField !== undefined && !serviceField.trim()) {
      errors.serviceField = 'Odbor je povinný'
    }

    if (position !== undefined && !position.trim()) {
      errors.position = 'Pozícia je povinná'
    }

    if (serviceType !== undefined && !serviceType.trim()) {
      errors.serviceType = 'Druh štátnej služby je povinný'
    }

    if (startDateTime !== undefined && !startDateTime) {
      errors.startDateTime = 'Dátum a čas začiatku je povinný'
    }

    if (numberOfPositions !== undefined && numberOfPositions < 1) {
      errors.numberOfPositions = 'Počet miest musí byť aspoň 1'
    }

    // Check if identifier is unique (if being changed)
    if (identifier !== undefined && identifier !== existingVK.identifier) {
      const existingWithIdentifier = await prisma.vyberoveKonanie.findFirst({
        where: {
          identifier,
          id: { not: params.id },
          deleted: false,
        },
      })

      if (existingWithIdentifier) {
        errors.identifier = 'Výberové konanie s týmto identifikátorom už existuje'
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
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
        identifier: identifier ?? existingVK.identifier,
        selectionType: selectionType ?? existingVK.selectionType,
        organizationalUnit: organizationalUnit ?? existingVK.organizationalUnit,
        serviceField: serviceField ?? existingVK.serviceField,
        position: position ?? existingVK.position,
        serviceType: serviceType ?? existingVK.serviceType,
        startDateTime: startDateTime ? new Date(startDateTime) : existingVK.startDateTime,
        numberOfPositions: numberOfPositions ?? existingVK.numberOfPositions,
        status: status ?? existingVK.status,
        gestorId: gestorId !== undefined ? gestorId : existingVK.gestorId,
      },
      include: {
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
