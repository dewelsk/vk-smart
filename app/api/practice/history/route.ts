import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // RBAC: Only ADMIN, GESTOR, SUPERADMIN can view practice history
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na prístup k histórii' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const testId = searchParams.get('testId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (testId) {
      where.testId = testId
    }

    // Get practice results
    const [results, total] = await Promise.all([
      prisma.practiceTestResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          test: {
            select: {
              id: true,
              name: true,
              type: true,
              category: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      }),
      prisma.practiceTestResult.count({ where })
    ])

    // Format response
    const formattedResults = results.map(result => ({
      id: result.id,
      test: result.test,
      score: result.score,
      maxScore: result.maxScore,
      successRate: result.successRate,
      passed: result.passed,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      durationSeconds: result.durationSeconds,
      createdAt: result.createdAt,
    }))

    return NextResponse.json({
      results: formattedResults,
      total,
      limit,
      offset,
      hasMore: offset + results.length < total,
    })

  } catch (error) {
    console.error('Error fetching practice history:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní histórie' },
      { status: 500 }
    )
  }
}
