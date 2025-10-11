import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { validateVK, getGroupedIssues, getPreparationChecklist, canTransitionTo } from '@/lib/vk-validation'


// GET /api/admin/vk/:id/validation - Get validation status for VK
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const vkId = params.id

    // Fetch VK with necessary data
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      include: {
        assignedTests: {
          include: {
            test: true
          }
        },
        candidates: {
          where: {
            deleted: false
          }
        },
        commission: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        },
        evaluationConfig: true
      }
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK not found' }, { status: 404 })
    }

    // Check permissions
    // ADMIN can access any VK (no institution restrictions anymore)
    if (session.user.role === 'GESTOR') {
      // Gestor can only see VK where they are assigned
      if (vk.gestorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Prepare VK data for validation
    const vkData = {
      id: vk.id,
      status: vk.status,
      gestorId: vk.gestorId,
      assignedTests: vk.assignedTests,
      candidates: vk.candidates,
      commission: vk.commission,
      evaluationConfig: vk.evaluationConfig
    }

    // Run validations
    const { errors, warnings } = getGroupedIssues(vkData)
    const checklist = getPreparationChecklist(vkData)

    // Check if can transition to next status
    const canTransition: Record<string, boolean> = {}
    const possibleStatuses = ['PRIPRAVA', 'CAKA_NA_TESTY', 'TESTOVANIE', 'HODNOTENIE', 'DOKONCENE', 'ZRUSENE']
    for (const status of possibleStatuses) {
      canTransition[status] = canTransitionTo(vkData, status)
    }

    return NextResponse.json({
      validation: {
        errors,
        warnings,
        checklist,
        canTransition,
        isReady: errors.length === 0
      }
    })

  } catch (error) {
    console.error('Error validating VK:', error)
    return NextResponse.json(
      { error: 'Failed to validate VK' },
      { status: 500 }
    )
  }
}
