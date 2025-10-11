import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // RBAC: Only ADMIN, GESTOR, SUPERADMIN can practice tests
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na prístup k testom' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const testTypeId = searchParams.get('type')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      practiceEnabled: true, // Only tests with practice enabled can be practiced
    }

    if (testTypeId) {
      where.testTypeId = testTypeId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get tests
    const tests = await prisma.test.findMany({
      where,
      orderBy: { name: 'asc' },
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
        },
        _count: {
          select: {
            practiceResults: true,
          }
        }
      }
    })

    // Get user's practice attempts for these tests
    const userPracticeResults = await prisma.practiceTestResult.findMany({
      where: {
        userId: session.user.id,
        testId: { in: tests.map(t => t.id) }
      },
      select: {
        testId: true,
        completedAt: true,
        successRate: true,
        passed: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group practice results by testId (get latest attempt per test)
    const latestAttempts = userPracticeResults.reduce((acc, result) => {
      if (!acc[result.testId]) {
        acc[result.testId] = result
      }
      return acc
    }, {} as Record<string, typeof userPracticeResults[0]>)

    // Format response
    const testsWithStats = tests.map(test => {
      const questions = test.questions as any[]
      const questionCount = Array.isArray(questions) ? questions.length : 0
      const latestAttempt = latestAttempts[test.id]

      return {
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
        category: test.category,
        difficulty: test.difficulty,
        questionCount,
        recommendedQuestionCount: test.recommendedQuestionCount,
        recommendedDuration: test.recommendedDuration,
        recommendedScore: test.recommendedScore,
        totalAttempts: test._count.practiceResults,
        userLastAttempt: latestAttempt ? {
          completedAt: latestAttempt.completedAt,
          successRate: latestAttempt.successRate,
          passed: latestAttempt.passed,
        } : null,
      }
    })

    return NextResponse.json({
      tests: testsWithStats,
      total: testsWithStats.length,
    })

  } catch (error) {
    console.error('Error fetching practice tests:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní testov' },
      { status: 500 }
    )
  }
}
