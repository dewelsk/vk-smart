import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to calculate real-time stats
function calculateRealTimeStats(answers: Record<string, any>, questions: any[]) {
  let correct = 0
  let incorrect = 0
  let unanswered = 0

  questions.forEach((q: any) => {
    const userAnswer = answers[q.id]

    if (!userAnswer || userAnswer === '' || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      unanswered++
    } else {
      const isCorrect = compareAnswers(userAnswer, q.correctAnswer, q.type)
      if (isCorrect) {
        correct++
      } else {
        incorrect++
      }
    }
  })

  return { correct, incorrect, unanswered }
}

function compareAnswers(userAnswer: any, correctAnswer: any, questionType: string): boolean {
  if (questionType === 'SINGLE_CHOICE') {
    return userAnswer === correctAnswer
  } else if (questionType === 'MULTIPLE_CHOICE') {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false
    if (userAnswer.length !== correctAnswer.length) return false

    const sortedUser = [...userAnswer].sort()
    const sortedCorrect = [...correctAnswer].sort()

    return sortedUser.every((val, index) => val === sortedCorrect[index])
  } else if (questionType === 'TRUE_FALSE') {
    return userAnswer === correctAnswer
  } else if (questionType === 'SHORT_TEXT') {
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  } else {
    return userAnswer === correctAnswer
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vkId = params.id

    // Get VK
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId }
    })

    if (!vk) {
      return NextResponse.json(
        { error: 'Výberové konanie neexistuje' },
        { status: 404 }
      )
    }

    // Get all candidates for this VK
    const candidates = await prisma.candidate.findMany({
      where: {
        vkId: vkId,
        isArchived: false,
        deleted: false
      },
      include: {
        user: {
          select: {
            name: true,
            surname: true
          }
        },
        testSessions: {
          where: {
            OR: [
              { status: 'IN_PROGRESS' },
              { status: 'COMPLETED' },
              { status: 'TIME_EXPIRED' }
            ]
          },
          include: {
            test: {
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
                }
              }
            },
            vkTest: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        }
      },
      orderBy: {
        registeredAt: 'asc'
      }
    })

    // Build candidate data with real-time stats
    const candidatesData = candidates.map(candidate => {
      // Find current active session (IN_PROGRESS)
      const currentSession = candidate.testSessions.find(s => s.status === 'IN_PROGRESS')

      // Count completed sessions
      const completedSessions = candidate.testSessions.filter(s => s.status === 'COMPLETED' || s.status === 'TIME_EXPIRED')

      // Determine overall status
      let status: 'TESTING' | 'COMPLETED' | 'FAILED' | 'WAITING' = 'WAITING'

      if (currentSession) {
        status = 'TESTING'
      } else if (completedSessions.length > 0) {
        const lastCompleted = completedSessions[0]
        if (lastCompleted.passed === false) {
          status = 'FAILED'
        } else if (lastCompleted.passed === true) {
          // Check if there are more tests to take
          const allVkTests = candidate.testSessions.length
          // In real implementation, check if all tests are completed
          status = 'COMPLETED'
        }
      }

      const baseData: any = {
        id: candidate.id,
        name: candidate.user.name,
        surname: candidate.user.surname,
        cisIdentifier: candidate.cisIdentifier,
        status
      }

      // If currently testing, add session details
      if (currentSession) {
        const questions = currentSession.test.questions as any[]
        const answers = currentSession.answers as Record<string, any>
        const stats = calculateRealTimeStats(answers, questions)

        baseData.currentSession = {
          id: currentSession.id,
          test: {
            level: currentSession.vkTest.level,
            name: currentSession.test.name,
            testTypeId: currentSession.test.testTypeId,
            testType: currentSession.test.testType
              ? {
                  id: currentSession.test.testType.id,
                  name: currentSession.test.testType.name,
                  description: currentSession.test.testType.description,
                }
              : null,
            testTypeConditionId: currentSession.test.testTypeConditionId,
            testTypeCondition: currentSession.test.testTypeCondition
              ? {
                  id: currentSession.test.testTypeCondition.id,
                  name: currentSession.test.testTypeCondition.name,
                  description: currentSession.test.testTypeCondition.description,
                }
              : null
          },
          serverStartTime: currentSession.serverStartTime,
          durationSeconds: currentSession.durationSeconds,
          totalQuestions: questions.length,
          answeredQuestions: stats.correct + stats.incorrect,
          correctAnswers: stats.correct,
          incorrectAnswers: stats.incorrect,
          unansweredQuestions: stats.unanswered
        }
      }

      return baseData
    })

    // Calculate summary stats
    const summary = {
      totalCandidates: candidatesData.length,
      currentlyTesting: candidatesData.filter(c => c.status === 'TESTING').length,
      completed: candidatesData.filter(c => c.status === 'COMPLETED').length,
      failed: candidatesData.filter(c => c.status === 'FAILED').length,
      waiting: candidatesData.filter(c => c.status === 'WAITING').length
    }

    return NextResponse.json({
      vk: {
        id: vk.id,
        identifier: vk.identifier,
        position: vk.position,
        status: vk.status
      },
      summary,
      candidates: candidatesData
    })
  } catch (error) {
    console.error('Monitoring error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní monitoring dát' },
      { status: 500 }
    )
  }
}
