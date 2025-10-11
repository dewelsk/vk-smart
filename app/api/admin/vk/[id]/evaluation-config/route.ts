import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/vk/[id]/evaluation-config
 * Get evaluation configuration for VK
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Check if user has access to this VK
    const hasAccess = ['SUPERADMIN', 'ADMIN'].includes(session.user.role)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Nedostatočné oprávnenia' },
        { status: 403 }
      )
    }

    // Get evaluation config
    const config = await prisma.evaluationConfig.findUnique({
      where: {
        vkId: params.id
      }
    })

    return NextResponse.json({
      config: config || null
    })
  } catch (error) {
    console.error('Failed to fetch evaluation config:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní konfigurácie' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/vk/[id]/evaluation-config
 * Create evaluation configuration for VK
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const hasAccess = ['SUPERADMIN', 'ADMIN'].includes(session.user.role)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Nedostatočné oprávnenia' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { evaluatedTraits } = body

    // Validate
    if (!evaluatedTraits || !Array.isArray(evaluatedTraits)) {
      return NextResponse.json(
        { error: 'Neplatné dáta - evaluatedTraits musí byť pole' },
        { status: 400 }
      )
    }

    if (evaluatedTraits.length < 3) {
      return NextResponse.json(
        { error: 'Musíte vybrať minimálne 3 kategórie' },
        { status: 400 }
      )
    }

    if (evaluatedTraits.length > 10) {
      return NextResponse.json(
        { error: 'Môžete vybrať maximálne 10 kategórií' },
        { status: 400 }
      )
    }

    // Check if VK exists
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: params.id }
    })

    if (!vk) {
      return NextResponse.json(
        { error: 'Výberové konanie nebolo nájdené' },
        { status: 404 }
      )
    }

    // Check if config already exists
    const existingConfig = await prisma.evaluationConfig.findUnique({
      where: { vkId: params.id }
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: 'Konfigurácia už existuje, použite PUT na aktualizáciu' },
        { status: 409 }
      )
    }

    // Create config
    const config = await prisma.evaluationConfig.create({
      data: {
        vkId: params.id,
        evaluatedTraits,
        questionBattery: {} // Will be populated later when loading questions
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_EVALUATION_CONFIG',
        userId: session.user.id!,
        entity: 'EvaluationConfig',
        entityId: config.id,
        details: {
          vkId: params.id,
          evaluatedTraits,
          userId: session.user.id,
          username: session.user.username
        }
      }
    })

    return NextResponse.json({
      config,
      message: 'Konfigurácia ústnej časti bola vytvorená'
    })
  } catch (error) {
    console.error('Failed to create evaluation config:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní konfigurácie' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/vk/[id]/evaluation-config
 * Update evaluation configuration for VK
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const hasAccess = ['SUPERADMIN', 'ADMIN'].includes(session.user.role)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Nedostatočné oprávnenia' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { evaluatedTraits } = body

    // Validate
    if (!evaluatedTraits || !Array.isArray(evaluatedTraits)) {
      return NextResponse.json(
        { error: 'Neplatné dáta - evaluatedTraits musí byť pole' },
        { status: 400 }
      )
    }

    if (evaluatedTraits.length < 3) {
      return NextResponse.json(
        { error: 'Musíte vybrať minimálne 3 kategórie' },
        { status: 400 }
      )
    }

    if (evaluatedTraits.length > 10) {
      return NextResponse.json(
        { error: 'Môžete vybrať maximálne 10 kategórií' },
        { status: 400 }
      )
    }

    // Check if config exists
    const existingConfig = await prisma.evaluationConfig.findUnique({
      where: { vkId: params.id }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Konfigurácia neexistuje, použite POST na vytvorenie' },
        { status: 404 }
      )
    }

    // Update config
    const config = await prisma.evaluationConfig.update({
      where: { vkId: params.id },
      data: {
        evaluatedTraits,
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_EVALUATION_CONFIG',
        userId: session.user.id!,
        entity: 'EvaluationConfig',
        entityId: config.id,
        details: {
          vkId: params.id,
          oldTraits: existingConfig.evaluatedTraits,
          newTraits: evaluatedTraits,
          userId: session.user.id,
          username: session.user.username
        }
      }
    })

    return NextResponse.json({
      config,
      message: 'Konfigurácia ústnej časti bola aktualizovaná'
    })
  } catch (error) {
    console.error('Failed to update evaluation config:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii konfigurácie' },
      { status: 500 }
    )
  }
}