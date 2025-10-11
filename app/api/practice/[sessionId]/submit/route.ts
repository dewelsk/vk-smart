import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface SubmitAnswersRequest {
  answers: Array<{
    questionId: string
    answer: any
  }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth()

    // RBAC: Only ADMIN, GESTOR, SUPERADMIN can practice tests
    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na odoslanie testu' },
        { status: 403 }
      )
    }

    const { sessionId } = params
    const body: SubmitAnswersRequest = await request.json()

    if (!body.answers || !Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: 'Neplatné odpovede' },
        { status: 400 }
      )
    }

    // Verify practice session exists and belongs to user
    const practiceSession = await prisma.practiceTestResult.findUnique({
      where: { id: sessionId },
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
            },
          }
        }
      }
    })

    if (!practiceSession) {
      return NextResponse.json(
        { error: 'Precvičovacia session nebola nájdená' },
        { status: 404 }
      )
    }

    if (practiceSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na túto session' },
        { status: 403 }
      )
    }

    if (practiceSession.completedAt) {
      return NextResponse.json(
        { error: 'Táto session už bola odoslaná' },
        { status: 400 }
      )
    }

    // Parse test questions
    const questions = practiceSession.test.questions as any[]

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Test neobsahuje otázky' },
        { status: 500 }
      )
    }

    // Calculate score
    let totalScore = 0
    let maxScore = 0
    const results = []

    for (const question of questions) {
      const userAnswer = body.answers.find(a => a.questionId === question.id)
      const points = question.points || 1
      maxScore += points

      let isCorrect = false

      if (userAnswer) {
        // Check answer based on question type
        switch (question.type) {
          case 'SINGLE_CHOICE':
            isCorrect = userAnswer.answer === question.correctAnswer
            break

          case 'MULTIPLE_CHOICE':
            // For multiple choice, check if arrays match
            const userAnswerArray = Array.isArray(userAnswer.answer) ? userAnswer.answer.sort() : []
            const correctAnswerArray = Array.isArray(question.correctAnswer) ? question.correctAnswer.sort() : []
            isCorrect = JSON.stringify(userAnswerArray) === JSON.stringify(correctAnswerArray)
            break

          case 'TRUE_FALSE':
            isCorrect = userAnswer.answer === question.correctAnswer
            break

          case 'TEXT':
            // For text questions, normalize and compare (case-insensitive, trimmed)
            const userText = String(userAnswer.answer || '').trim().toLowerCase()
            const correctText = String(question.correctAnswer || '').trim().toLowerCase()
            isCorrect = userText === correctText
            break

          default:
            // Default comparison
            isCorrect = userAnswer.answer === question.correctAnswer
        }

        if (isCorrect) {
          totalScore += points
        }
      }

      results.push({
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        userAnswer: userAnswer?.answer || null,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        explanation: question.explanation || null,
      })
    }

    const successRate = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = practiceSession.test.recommendedScore
      ? successRate >= practiceSession.test.recommendedScore
      : successRate >= 50 // Default 50% to pass

    const completedAt = new Date()
    const durationSeconds = Math.floor(
      (completedAt.getTime() - practiceSession.startedAt.getTime()) / 1000
    )

    // Check if time limit exceeded (if recommendedDuration is set)
    if (practiceSession.test.recommendedDuration) {
      const timeLimit = practiceSession.test.recommendedDuration * 60 // Convert to seconds
      if (durationSeconds > timeLimit) {
        return NextResponse.json(
          { error: 'Časový limit bol prekročený' },
          { status: 400 }
        )
      }
    }

    // Update practice session with results
    const updatedSession = await prisma.practiceTestResult.update({
      where: { id: sessionId },
      data: {
        answers: body.answers,
        score: totalScore,
        maxScore,
        successRate,
        passed,
        completedAt,
        durationSeconds,
      }
    })

    return NextResponse.json({
      sessionId: updatedSession.id,
      score: totalScore,
      maxScore,
      successRate,
      passed,
      durationSeconds,
      completedAt,
      results,
      test: {
        id: practiceSession.test.id,
        name: practiceSession.test.name,
        testTypeId: practiceSession.test.testTypeId,
        testType: practiceSession.test.testType
          ? {
              id: practiceSession.test.testType.id,
              name: practiceSession.test.testType.name,
              description: practiceSession.test.testType.description,
            }
          : null,
        testTypeConditionId: practiceSession.test.testTypeConditionId,
        testTypeCondition: practiceSession.test.testTypeCondition
          ? {
              id: practiceSession.test.testTypeCondition.id,
              name: practiceSession.test.testTypeCondition.name,
              description: practiceSession.test.testTypeCondition.description,
            }
          : null,
        recommendedScore: practiceSession.test.recommendedScore,
      }
    })

  } catch (error) {
    console.error('Error submitting practice test:', error)
    return NextResponse.json(
      { error: 'Chyba pri odoslaní testu' },
      { status: 500 }
    )
  }
}
