import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/tests - Get list of tests
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication - SUPERADMIN, ADMIN, and GESTOR can view tests
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Query params
    const search = searchParams.get('search') || undefined
    const testTypeId = searchParams.get('type') || undefined
    const approved = searchParams.get('approved') === 'true' ? true : searchParams.get('approved') === 'false' ? false : undefined
    const authorId = searchParams.get('authorId') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause
    const where: any = {}

    // Access control: ADMIN and GESTOR see only their own tests
    if (session.user.role !== 'SUPERADMIN') {
      where.authorId = session.user.id
    }

    // Apply filters
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (testTypeId) {
      where.type = testTypeId
    }

    if (approved !== undefined) {
      where.approved = approved
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    // Get total count
    const total = await prisma.test.count({ where })

    // Get tests with pagination
    const tests = await prisma.test.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        testTypeId: true,
        testTypeConditionId: true,
        description: true,
        questions: true,
        allowedQuestionTypes: true,
        recommendedQuestionCount: true,
        recommendedDuration: true,
        recommendedScore: true,
        difficulty: true,
        approved: true,
        approvedAt: true,
        authorId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
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
        },
        vkAssignments: {
          select: {
            id: true,
            vk: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    })

    // Get author information
    const authorIds = [...new Set(tests.map(t => t.authorId).filter(Boolean))] as string[]
    const authors = await prisma.user.findMany({
      where: {
        id: { in: authorIds }
      },
      select: {
        id: true,
        name: true,
        surname: true
      }
    })

    const authorsMap = new Map(authors.map(a => [a.id, a]))

    // Format response with usage statistics
    const formattedTests = tests.map(test => {
      const questions = Array.isArray(test.questions) ? test.questions : []
      const totalVKs = test.vkAssignments.length
      const activeVKs = test.vkAssignments.filter(a => a.vk.status === 'TESTOVANIE').length

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
        questionCount: questions.length,
        allowedQuestionTypes: test.allowedQuestionTypes,
        recommendedDuration: test.recommendedDuration,
        recommendedQuestionCount: test.recommendedQuestionCount,
        recommendedScore: test.recommendedScore,
        difficulty: test.difficulty,
        approved: test.approved,
        approvedAt: test.approvedAt,
        categoryId: test.categoryId,
        category: test.category,
        author: test.authorId ? authorsMap.get(test.authorId) || null : null,
        usage: {
          totalVKs,
          activeVKs,
          hasActiveUsage: activeVKs > 0
        },
        createdAt: test.createdAt,
        updatedAt: test.updatedAt
      }
    })

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      tests: formattedTests,
      total,
      page,
      limit,
      pages
    })

  } catch (error: any) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests', details: error.message || error.toString() },
      { status: 500 }
    )
  }
}
