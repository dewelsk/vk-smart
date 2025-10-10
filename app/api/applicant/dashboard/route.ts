import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to get candidate ID from request (simplified - in production use NextAuth session)
async function getCandidateFromRequest(request: NextRequest) {
  // In production, extract from session token/cookie
  // For now, expect candidateId in Authorization header
  const candidateId = request.headers.get('x-candidate-id')

  if (!candidateId) {
    return null
  }

  return await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      vk: true,
      user: true
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const candidate = await getCandidateFromRequest(request)

    if (!candidate) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Get VK details
    const vk = candidate.vk

    // Get all tests assigned to this VK (VKTest)
    const vkTests = await prisma.vKTest.findMany({
      where: { vkId: vk.id },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { level: 'asc' }
    })

    // Get all test sessions for this candidate
    const sessions = await prisma.testSession.findMany({
      where: { candidateId: candidate.id },
      include: {
        vkTest: true,
        test: true
      }
    })

    // Build tests array with session data
    const tests = vkTests.map((vkTest, index) => {
      const session = sessions.find(s => s.vkTestId === vkTest.id)

      // Check if this level is locked
      let locked = false
      let lockedReason = ''

      if (index > 0) {
        // Check if previous level was passed
        const previousVkTest = vkTests[index - 1]
        const previousSession = sessions.find(s => s.vkTestId === previousVkTest.id)

        if (!previousSession || previousSession.status !== 'COMPLETED' || !previousSession.passed) {
          locked = true
          lockedReason = `Dokončite Level ${previousVkTest.level}: ${previousVkTest.test.name}`
        }
      }

      // Build test object
      const testData: any = {
        vkTestId: vkTest.id,
        level: vkTest.level,
        test: {
          id: vkTest.test.id,
          name: vkTest.test.name,
          type: vkTest.test.type
        },
        questionCount: vkTest.questionCount,
        durationMinutes: vkTest.durationMinutes,
        minScore: vkTest.minScore,
        locked,
        lockedReason
      }

      // Add session data if exists
      if (session) {
        testData.session = {
          id: session.id,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          serverStartTime: session.serverStartTime,
          durationSeconds: session.durationSeconds,
          score: session.score,
          maxScore: session.maxScore,
          passed: session.passed
        }

        // Calculate answered questions count for IN_PROGRESS sessions
        if (session.status === 'IN_PROGRESS') {
          const answers = session.answers as Record<string, any>
          const answeredCount = Object.keys(answers).filter(key => answers[key] !== null && answers[key] !== undefined && answers[key] !== '').length
          testData.session.answeredQuestions = answeredCount
        }
      } else {
        testData.session = null
      }

      return testData
    })

    return NextResponse.json({
      vk: {
        identifier: vk.identifier,
        selectionType: vk.selectionType,
        organizationalUnit: vk.organizationalUnit,
        serviceField: vk.serviceField,
        position: vk.position,
        serviceType: vk.serviceType,
        date: vk.date
      },
      tests
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní dashboardu' },
      { status: 500 }
    )
  }
}
