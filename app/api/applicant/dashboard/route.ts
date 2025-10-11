import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Get token to check candidate type
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    })

    if (!token || token.type !== 'candidate') {
      return NextResponse.json(
        { error: 'Prístup len pre uchádzačov' },
        { status: 403 }
      )
    }

    const candidateId = token.candidateId as string
    const vkId = token.vkId as string

    if (!candidateId || !vkId) {
      return NextResponse.json(
        { error: 'Neplatná session kandidáta' },
        { status: 400 }
      )
    }

    // Get candidate with VK info
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        vk: true,
      },
    })

    if (!candidate || candidate.deleted || !candidate.active) {
      return NextResponse.json(
        { error: 'Kandidát nenájdený alebo nie je aktívny' },
        { status: 404 }
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
            testTypeId: true,
            testTypeConditionId: true,
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
            }
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
      console.log(`VKTest Level ${vkTest.level}:`, {
        questionCount: vkTest.questionCount,
        durationMinutes: vkTest.durationMinutes,
        minScore: vkTest.minScore
      })
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
          testTypeId: vkTest.test.testTypeId,
          testType: vkTest.test.testType
            ? {
                id: vkTest.test.testType.id,
                name: vkTest.test.testType.name,
                description: vkTest.test.testType.description,
              }
            : null,
          testTypeConditionId: vkTest.test.testTypeConditionId,
          testTypeCondition: vkTest.test.testTypeCondition
            ? {
                id: vkTest.test.testTypeCondition.id,
                name: vkTest.test.testTypeCondition.name,
                description: vkTest.test.testTypeCondition.description,
              }
            : null
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
          const answers = (session.answers as Record<string, any>) || {}
          const answeredCount = Object.keys(answers).filter(key => {
            const value = answers[key]
            return value !== null && value !== undefined && value !== ''
          }).length
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
        date: vk.startDateTime
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
