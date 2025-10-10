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

    // Get test session
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: true,
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

    // Update lastAccessedAt
    await prisma.testSession.update({
      where: { id: sessionId },
      data: { lastAccessedAt: new Date() }
    })

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
        type: session.test.type,
        questions: session.test.questions  // This contains all questions with options
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
