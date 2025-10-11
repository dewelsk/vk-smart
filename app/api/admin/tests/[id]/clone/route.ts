import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/tests/[id]/clone - Clone test
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Check authentication
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const testId = params.id

    // Get original test
    const originalTest = await prisma.test.findUnique({
      where: { id: testId },
    })

    if (!originalTest) {
      return NextResponse.json({ error: 'Test nenájdený' }, { status: 404 })
    }

    // Check permissions: ADMIN and GESTOR can only clone tests they can view
    if (session.user.role !== 'SUPERADMIN' && originalTest.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie klonovať tento test' }, { status: 403 })
    }

    // Create clone
    const clonedTest = await prisma.test.create({
      data: {
        name: `${originalTest.name} (kópia)`,
        testTypeId: originalTest.testTypeId,
        testTypeConditionId: originalTest.testTypeConditionId,
        description: originalTest.description,
        questions: originalTest.questions,
        recommendedQuestionCount: originalTest.recommendedQuestionCount,
        recommendedDuration: originalTest.recommendedDuration,
        recommendedScore: originalTest.recommendedScore,
        difficulty: originalTest.difficulty,
        allowedQuestionTypes: originalTest.allowedQuestionTypes,

        // NEW organization: test category
        categoryId: originalTest.categoryId,

        // Clone is NOT approved
        approved: false,
        approvedAt: null,

        // Author is current user
        authorId: session.user.id,
      },
      include: {
        testType: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        testTypeCondition: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Get author information
    let author = null
    if (clonedTest.authorId) {
      author = await prisma.user.findUnique({
        where: { id: clonedTest.authorId },
        select: {
          id: true,
          name: true,
          surname: true
        }
      })
    }

    return NextResponse.json({
      test: {
        ...clonedTest,
        author,
        questionCount: Array.isArray(clonedTest.questions) ? clonedTest.questions.length : 0,
        usage: {
          totalVKs: 0,
          activeVKs: 0,
          hasActiveUsage: false
        }
      }
    })
  } catch (error) {
    console.error('Error cloning test:', error)
    return NextResponse.json(
      { error: 'Nepodarilo sa naklonovať test' },
      { status: 500 }
    )
  }
}
