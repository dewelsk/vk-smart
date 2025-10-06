import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { VKStatus  } from '@prisma/client'
import { prisma } from '@/lib/prisma'


export async function GET() {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stats in parallel
    const [activeVK, totalCandidates, activeTests] = await Promise.all([
      // Active VK count (TESTOVANIE or HODNOTENIE)
      prisma.vyberoveKonanie.count({
        where: {
          status: {
            in: [VKStatus.TESTOVANIE, VKStatus.HODNOTENIE],
          },
        },
      }),

      // Total candidates count
      prisma.candidate.count({
        where: {
          deleted: false,
        },
      }),

      // Active tests (this is a placeholder - we'll implement proper tracking later)
      prisma.testResult.count({
        where: {
          completedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      activeVK,
      totalCandidates,
      activeTests,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
