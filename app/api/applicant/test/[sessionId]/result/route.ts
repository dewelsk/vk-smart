import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getCandidateFromRequest(request: NextRequest) {
  const candidateId = request.headers.get('x-candidate-id')
  if (!candidateId) return null

  return await prisma.candidate.findUnique({
    where: { id: candidateId }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const candidate = await getCandidateFromRequest(request)

    if (!candidate) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const { sessionId } = params

    // Get session
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: true,
        vkTest: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Test session neexistuje' },
        { status: 404 }
      )
    }

    // Check ownership
    if (session.candidateId !== candidate.id) {
      return NextResponse.json(
        { error: 'Tento test nepatrí k vášmu účtu' },
        { status: 403 }
      )
    }

    // Check if session is completed
    if (session.status !== 'COMPLETED' && session.status !== 'TIME_EXPIRED') {
      return NextResponse.json(
        {
          error: 'Test ešte nebol dokončený',
          redirectUrl: `/applicant/test/${sessionId}`
        },
        { status: 400 }
      )
    }

    // Get next level test (if exists and not started)
    const nextVkTest = await prisma.vKTest.findFirst({
      where: {
        vkId: session.vkTest.vkId,
        level: session.vkTest.level + 1
      },
      include: {
        test: true
      }
    })

    let nextTest = null
    if (nextVkTest && session.passed) {
      // Check if next test session exists
      const nextSession = await prisma.testSession.findUnique({
        where: {
          candidateId_vkTestId: {
            candidateId: candidate.id,
            vkTestId: nextVkTest.id
          }
        }
      })

      if (!nextSession || nextSession.status === 'NOT_STARTED') {
        nextTest = {
          vkTestId: nextVkTest.id,
          level: nextVkTest.level,
          name: nextVkTest.test.name,
          type: nextVkTest.test.type
        }
      }
    }

    // Build detailed answers (with correct/incorrect status)
    const questions = session.test.questions as any[]
    const userAnswers = session.answers as Record<string, any>

    const detailedAnswers = questions.map((q: any) => {
      const userAnswer = userAnswers[q.id]
      const isCorrect = userAnswer && compareAnswers(userAnswer, q.correctAnswer, q.type)

      return {
        questionId: q.id,
        questionText: q.text,
        userAnswer: userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: q.points || session.vkTest.scorePerQuestion,
        options: q.options || null  // For single/multiple choice questions
      }
    })

    return NextResponse.json({
      result: {
        score: session.score,
        maxScore: session.maxScore,
        passed: session.passed,
        status: session.status,
        completedAt: session.completedAt
      },
      test: {
        level: session.vkTest.level,
        name: session.test.name,
        type: session.test.type
      },
      detailedAnswers,
      nextTest,
      hasNextLevel: !!nextTest
    })
  } catch (error) {
    console.error('Get test result error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní výsledku' },
      { status: 500 }
    )
  }
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
