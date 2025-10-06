import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TestTyp } from '@prisma/client'

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
    const type = searchParams.get('type') as TestTyp | undefined
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

    if (type) {
      where.type = type
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
        type: true,
        description: true,
        questions: true,
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
        type: test.type,
        description: test.description,
        questionCount: questions.length,
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

  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}
