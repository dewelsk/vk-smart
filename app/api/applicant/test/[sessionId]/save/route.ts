import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getCandidateFromRequest(request: NextRequest) {
  const candidateId = request.headers.get('x-candidate-id')
  if (!candidateId) return null

  return await prisma.candidate.findUnique({
    where: { id: candidateId }
  })
}

// Helper function to calculate real-time stats (for admin monitoring)
function calculateRealTimeStats(answers: Record<string, any>, questions: any[]) {
  let correct = 0
  let incorrect = 0
  let unanswered = 0

  questions.forEach((q: any) => {
    const userAnswer = answers[q.id]

    if (!userAnswer || userAnswer === '' || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      unanswered++
    } else {
      // Compare user answer with correct answer
      const isCorrectAnswer = compareAnswers(userAnswer, q.correctAnswer, q.type)
      if (isCorrectAnswer) {
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
    // For short text, exact match (case-insensitive)
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  } else {
    // Default: exact match
    return userAnswer === correctAnswer
  }
}

export async function POST(
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
    const body = await request.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Odpovede sú povinné' },
        { status: 400 }
      )
    }

    // Get session
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: true
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

    // Check if session is still in progress
    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Test nie je aktívny' },
        { status: 400 }
      )
    }

    // Check if time expired
    if (session.serverStartTime && session.durationSeconds) {
      const startTime = new Date(session.serverStartTime).getTime()
      const now = Date.now()
      const elapsed = (now - startTime) / 1000

      if (elapsed > session.durationSeconds) {
        // Time expired - auto-submit
        return NextResponse.json(
          { error: 'Čas vypršal', timeExpired: true },
          { status: 400 }
        )
      }
    }

    // Calculate real-time stats
    const questions = session.test.questions as any[]
    const stats = calculateRealTimeStats(answers, questions)

    // Update session
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        answers: answers,
        lastAccessedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      stats  // Return stats for potential future use
    })
  } catch (error) {
    console.error('Save answers error:', error)
    return NextResponse.json(
      { error: 'Chyba pri ukladaní odpovedí' },
      { status: 500 }
    )
  }
}
