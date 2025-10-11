import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const answerSchema = z.object({
  id: z.string().optional(),
  letter: z.string(),
  text: z.string().min(1, 'Text odpovede je povinný'),
  isCorrect: z.boolean(),
})

const questionSchema = z.object({
  id: z.string().optional(),
  order: z.number(),
  text: z.string().min(1, 'Text otázky je povinný'),
  points: z.number().min(0.1),
  questionType: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']),
  status: z.string().optional(),
  answers: z.array(answerSchema).min(2, 'Otázka musí mať aspoň 2 odpovede').max(6, 'Otázka môže mať maximálne 6 odpovedí'),
})

const updateTestSchema = z.object({
  name: z.string().min(1, 'Názov testu je povinný').optional(),
  description: z.string().nullish(),
  testTypeId: z.string().min(1, 'Typ testu je povinný').optional(),
  testTypeConditionId: z.string().min(1).optional().nullable(),
  recommendedDuration: z.number().min(1).optional(),
  recommendedQuestionCount: z.number().min(1).optional(),
  recommendedScore: z.number().min(0).optional(),
  approved: z.boolean().optional(),
  practiceEnabled: z.boolean().optional(),
  categoryId: z.string().optional(),
  allowedQuestionTypes: z.array(z.string()).min(1, 'Aspoň jeden typ otázky musí byť vybraný').optional(),
  questions: z.array(questionSchema).optional(),
})

// GET /api/admin/tests/[id] - Get single test
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

    const testId = params.id

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
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
        category: {
          select: {
            id: true,
            name: true,
            type: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        vkAssignments: {
          select: {
            id: true,
            vk: {
              select: {
                id: true,
                identifier: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test nenájdený' }, { status: 404 })
    }

    // Check permissions: ADMIN and GESTOR can only see their own tests
    if (session.user.role !== 'SUPERADMIN' && test.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie prezerať tento test' }, { status: 403 })
    }

    // Get author information
    let author = null
    if (test.authorId) {
      author = await prisma.user.findUnique({
        where: { id: test.authorId },
        select: {
          id: true,
          name: true,
          surname: true
        }
      })
    }

    // Calculate usage statistics
    const questions = Array.isArray(test.questions) ? test.questions : []
    const totalVKs = test.vkAssignments.length
    const activeVKs = test.vkAssignments.filter(a => a.vk.status === 'TESTOVANIE').length

    return NextResponse.json({
      test: {
        id: test.id,
        name: test.name,
        testTypeId: test.testTypeId,
        testType: test.testType
          ? {
              id: test.testType.id,
              name: test.testType.name,
              description: test.testType.description,
            }
          : null,
        testTypeConditionId: test.testTypeConditionId,
        testTypeCondition: test.testTypeCondition
          ? {
              id: test.testTypeCondition.id,
              name: test.testTypeCondition.name,
              description: test.testTypeCondition.description,
            }
          : null,
        description: test.description,
        questions: test.questions,
        questionCount: questions.length,
        allowedQuestionTypes: test.allowedQuestionTypes,
        recommendedDuration: test.recommendedDuration,
        recommendedQuestionCount: test.recommendedQuestionCount,
        recommendedScore: test.recommendedScore,
        difficulty: test.difficulty,
        approved: test.approved,
        approvedAt: test.approvedAt,
        practiceEnabled: test.practiceEnabled,
        categoryId: test.categoryId,
        category: test.category,
        author,
        usage: {
          totalVKs,
          activeVKs,
          hasActiveUsage: activeVKs > 0
        },
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/tests/[id] - Update test
export async function PATCH(
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

    // Check if test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        vkAssignments: {
          select: {
            vk: {
              select: {
                status: true
              }
            }
          }
        }
      }
    })

    if (!existingTest) {
      return NextResponse.json({ error: 'Test nenájdený' }, { status: 404 })
    }

    // Check permissions: ADMIN and GESTOR can only edit their own tests
    if (session.user.role !== 'SUPERADMIN' && existingTest.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie upravovať tento test' }, { status: 403 })
    }

    // MVP: Allow editing tests even if used in active VK
    // TODO: In production, may want to restrict this
    // Check if test is being used in active VK
    // const hasActiveUsage = existingTest.vkAssignments.some(a => a.vk.status === 'TESTOVANIE')
    // if (hasActiveUsage && session.user.role !== 'SUPERADMIN') {
    //   return NextResponse.json(
    //     { error: 'Test sa používa v aktívnom výberovom konaní a nemožno ho upravovať' },
    //     { status: 400 }
    //   )
    // }

    const body = await request.json()

    // Validate input
    const validationResult = updateTestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const hasConditionField = Object.prototype.hasOwnProperty.call(data, 'testTypeConditionId')
    const targetTestTypeId = data.testTypeId ?? existingTest.testTypeId
    const targetConditionId = hasConditionField
      ? data.testTypeConditionId ?? null
      : data.testTypeId
        ? null
        : existingTest.testTypeConditionId

    const testTypeRecord = await prisma.testType.findUnique({
      where: { id: targetTestTypeId }
    })

    if (!testTypeRecord) {
      return NextResponse.json({ error: 'Zvolený typ testu neexistuje' }, { status: 400 })
    }

    if (targetConditionId) {
      const conditionRecord = await prisma.testTypeCondition.findUnique({
        where: { id: targetConditionId }
      })

      if (!conditionRecord) {
        return NextResponse.json({ error: 'Zvolená podmienka testu neexistuje' }, { status: 400 })
      }

      if (conditionRecord.testTypeId !== targetTestTypeId) {
        return NextResponse.json(
          { error: 'Zvolená podmienka nepatrí k danému typu testu' },
          { status: 400 }
        )
      }
    }

    // Validate allowedQuestionTypes if provided
    if (data.allowedQuestionTypes) {
      const validQuestionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED']
      const invalidTypes = data.allowedQuestionTypes.filter(type => !validQuestionTypes.includes(type))

      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: `Neplatné typy otázok: ${invalidTypes.join(', ')}` },
          { status: 400 }
        )
      }

      if (data.allowedQuestionTypes.length === 0) {
        return NextResponse.json(
          { error: 'Aspoň jeden typ otázky musí byť vybraný' },
          { status: 400 }
        )
      }
    }

    // If categoryId is being changed, verify it exists
    if (data.categoryId) {
      const categoryExists = await prisma.testCategory.findUnique({
        where: { id: data.categoryId }
      })

      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Zvolená kategória neexistuje' },
          { status: 400 }
        )
      }
    }

    // Validate questions if provided
    if (data.questions) {
      for (const question of data.questions) {
        // Validate that each question has exactly 1 correct answer
        const correctAnswers = question.answers.filter((a: any) => a.isCorrect)
        if (correctAnswers.length !== 1) {
          return NextResponse.json(
            { error: `Otázka ${question.order} musí mať práve 1 správnu odpoveď` },
            { status: 400 }
          )
        }

        // Validate questionType is in allowedQuestionTypes
        const allowedTypes = data.allowedQuestionTypes || existingTest.allowedQuestionTypes || []
        if (allowedTypes.length > 0 && !allowedTypes.includes(question.questionType)) {
          return NextResponse.json(
            { error: `Otázka ${question.order} má nepovolený typ "${question.questionType}". Povolené typy: ${allowedTypes.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    // Update test
    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.recommendedDuration !== undefined && { recommendedDuration: data.recommendedDuration }),
        ...(data.recommendedQuestionCount !== undefined && { recommendedQuestionCount: data.recommendedQuestionCount }),
        ...(data.recommendedScore !== undefined && { recommendedScore: data.recommendedScore }),
        ...(data.testTypeId && { testTypeId: data.testTypeId }),
        ...((data.testTypeId !== undefined || hasConditionField) && {
          testTypeConditionId: targetConditionId,
        }),
        ...(data.approved !== undefined && { approved: data.approved, approvedAt: data.approved ? new Date() : null }),
        ...(data.practiceEnabled !== undefined && { practiceEnabled: data.practiceEnabled }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.allowedQuestionTypes && { allowedQuestionTypes: data.allowedQuestionTypes }),
        ...(data.questions && { questions: data.questions }),
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
            name: true
          }
        }
      }
    })

    // Update all VKTest records that use this test
    // (update questionCount, durationMinutes, minScore from updated test)
    const questions = (updatedTest.questions as any[]) || []
    const totalQuestions = questions.length
    const questionCount = updatedTest.recommendedQuestionCount || totalQuestions
    const durationMinutes = updatedTest.recommendedDuration || 30
    const scorePerQuestion = 1
    const minScore = updatedTest.recommendedScore || (questionCount * scorePerQuestion * 0.6)

    await prisma.vKTest.updateMany({
      where: { testId },
      data: {
        questionCount,
        durationMinutes,
        minScore: Math.round(minScore)
      }
    })

    return NextResponse.json({
      test: updatedTest
    })
  } catch (error) {
    console.error('Error updating test:', error)
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tests/[id] - Delete test
export async function DELETE(
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

    // Check if test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        vkAssignments: {
          select: {
            vk: {
              select: {
                status: true,
                identifier: true
              }
            }
          }
        }
      }
    })

    if (!existingTest) {
      return NextResponse.json({ error: 'Test nenájdený' }, { status: 404 })
    }

    // Check permissions: ADMIN and GESTOR can only delete their own tests
    if (session.user.role !== 'SUPERADMIN' && existingTest.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie vymazať tento test' }, { status: 403 })
    }

    // Check if test is being used in active VK (status TESTOVANIE)
    const activeVKs = existingTest.vkAssignments.filter(a => a.vk.status === 'TESTOVANIE')
    if (activeVKs.length > 0) {
      const vkIdentifiers = activeVKs.map(a => a.vk.identifier).join(', ')
      return NextResponse.json(
        { error: `Test nemožno vymazať, pretože sa používa v aktívnom výberovom konaní (${vkIdentifiers}). Pre zmeny vytvorte kópiu testu.` },
        { status: 403 }
      )
    }

    // Delete test and all related records using transaction
    await prisma.$transaction(async (tx) => {
      // Delete practice test results
      await tx.practiceTestResult.deleteMany({
        where: { testId }
      })

      // Delete test results
      await tx.testResult.deleteMany({
        where: { testId }
      })

      // Delete test sessions
      await tx.testSession.deleteMany({
        where: { testId }
      })

      // Delete VK test assignments (only if not in active VKs)
      await tx.vKTest.deleteMany({
        where: { testId }
      })

      // Finally delete the test
      await tx.test.delete({
        where: { id: testId }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Test bol úspešne vymazaný'
    })
  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Nepodarilo sa vymazať test' },
      { status: 500 }
    )
  }
}
