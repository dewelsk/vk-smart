import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

async function getCandidateFromRequest(request: NextRequest) {
  // Try JWT token first (for admin switch)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  })

  if (token?.candidateId) {
    return await prisma.candidate.findUnique({
      where: { id: token.candidateId as string }
    })
  }

  // Fallback to header (for regular applicant login)
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

    // Get test session
    const session = await prisma.testSession.findUnique({
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
            }
          }
        },
        vkTest: true,
        candidate: {
          include: {
            vk: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Test session neexistuje' },
        { status: 404 }
      )
    }

    // MVP: Disabled security checks - allow any candidate to view any test
    // TODO: Re-enable in production
    /*
    // Check if session belongs to this candidate
    if (session.candidateId !== candidate.id) {
      return NextResponse.json(
        { error: 'Tento test nepatrí k vášmu účtu' },
        { status: 403 }
      )
    }

    // Check if session is already completed
    if (session.status === 'COMPLETED') {
      return NextResponse.json(
        {
          error: 'Test už bol dokončený',
          redirectUrl: `/applicant/test/${sessionId}/result`
        },
        { status: 400 }
      )
    }
    */

    // Update lastAccessedAt
    await prisma.testSession.update({
      where: { id: sessionId },
      data: { lastAccessedAt: new Date() }
    })

    // Transform questions: rename 'answers' to 'options' and 'questionType' to 'type'
    const questions = Array.isArray(session.test.questions)
      ? (session.test.questions as any[]).map((q: any, qIndex: number) => ({
          id: q.id || `q_${qIndex}`,
          text: q.text,
          type: q.questionType,
          points: q.points,
          options: q.answers
            ? q.answers.map((ans: any, ansIndex: number) => ({
                id: ans.id || ans.letter || `ans_${qIndex}_${ansIndex}`,
                text: ans.text
              }))
            : []
        }))
      : []

    console.log('[TEST SESSION] Questions:', questions.length)
    console.log('[TEST SESSION] First question:', questions[0])
    console.log('[TEST SESSION] Session answers:', session.answers)

    // Return session data
    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        serverStartTime: session.serverStartTime,
        durationSeconds: session.durationSeconds,
        answers: session.answers
      },
      test: {
        id: session.test.id,
        name: session.test.name,
        testTypeId: session.test.testTypeId,
        testType: session.test.testType
          ? {
              id: session.test.testType.id,
              name: session.test.testType.name,
              description: session.test.testType.description,
            }
          : null,
        testTypeConditionId: session.test.testTypeConditionId,
        testTypeCondition: session.test.testTypeCondition
          ? {
              id: session.test.testTypeCondition.id,
              name: session.test.testTypeCondition.name,
              description: session.test.testTypeCondition.description,
            }
          : null,
        questions: questions
      },
      vk: {
        identifier: session.candidate.vk.identifier,
        position: session.candidate.vk.position
      },
      vkTest: {
        level: session.vkTest.level,
        questionCount: session.vkTest.questionCount,
        durationMinutes: session.vkTest.durationMinutes,
        minScore: session.vkTest.minScore
      }
    })
  } catch (error) {
    console.error('Get test session error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní testu' },
      { status: 500 }
    )
  }
}
