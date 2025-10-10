import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getCandidateFromRequest(request: NextRequest) {
  const candidateId = request.headers.get('x-candidate-id')
  if (!candidateId) return null

  return await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { user: true }
  })
}

// Calculate score and check if passed
function evaluateTest(answers: Record<string, any>, questions: any[], scorePerQuestion: number, minScore: number) {
  let correctCount = 0
  let totalQuestions = questions.length

  questions.forEach((q: any) => {
    const userAnswer = answers[q.id]

    if (userAnswer && compareAnswers(userAnswer, q.correctAnswer, q.type)) {
      correctCount++
    }
  })

  const score = correctCount * scorePerQuestion
  const maxScore = totalQuestions * scorePerQuestion
  const successRate = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
  const passed = score >= minScore

  return {
    score,
    maxScore,
    successRate,
    passed,
    correctCount,
    totalQuestions
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

    // Check if already completed
    if (session.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Test už bol odoslaný' },
        { status: 400 }
      )
    }

    // Evaluate test
    const questions = session.test.questions as any[]
    const answers = session.answers as Record<string, any>
    const evaluation = evaluateTest(
      answers,
      questions,
      session.vkTest.scorePerQuestion,
      session.vkTest.minScore
    )

    // Calculate duration
    const startTime = session.serverStartTime ? new Date(session.serverStartTime).getTime() : Date.now()
    const now = Date.now()
    const durationSeconds = Math.floor((now - startTime) / 1000)

    // Determine status
    let status: 'COMPLETED' | 'TIME_EXPIRED' = 'COMPLETED'

    if (session.durationSeconds && durationSeconds > session.durationSeconds) {
      status = 'TIME_EXPIRED'
    }

    // Update session
    const updatedSession = await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        passed: evaluation.passed,
        completedAt: new Date(),
        lastAccessedAt: new Date()
      }
    })

    // Create TestResult record for historical tracking
    await prisma.testResult.create({
      data: {
        candidateId: candidate.id,
        testId: session.testId,
        userId: candidate.userId,
        answers: answers,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        successRate: evaluation.successRate,
        passed: evaluation.passed,
        startedAt: session.startedAt || new Date(),
        completedAt: new Date(),
        durationSeconds: durationSeconds
      }
    })

    return NextResponse.json({
      success: true,
      result: {
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        successRate: evaluation.successRate,
        passed: evaluation.passed,
        correctCount: evaluation.correctCount,
        totalQuestions: evaluation.totalQuestions
      },
      redirectUrl: `/applicant/test/${sessionId}/result`
    })
  } catch (error) {
    console.error('Submit test error:', error)
    return NextResponse.json(
      { error: 'Chyba pri odoslaní testu' },
      { status: 500 }
    )
  }
}
