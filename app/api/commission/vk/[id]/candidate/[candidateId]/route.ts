import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/commission/vk/[id]/candidate/[candidateId] - Get candidate detail for evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; candidateId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'KOMISIA') {
      return NextResponse.json({ error: 'Neautorizovaný prístup' }, { status: 401 })
    }

    const userId = session.user.id
    const vkId = params.id
    const candidateId = params.candidateId

    // Check if user is commission member of this VK
    const commissionMember = await prisma.commissionMember.findFirst({
      where: {
        userId: userId,
        commission: {
          vkId: vkId,
        },
      },
    })

    if (!commissionMember) {
      return NextResponse.json(
        { error: 'Nie ste členom komisie tohto VK' },
        { status: 403 }
      )
    }

    // Get VK with evaluation config
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      select: {
        id: true,
        identifier: true,
        selectionType: true,
        startDateTime: true,
        evaluationConfig: {
          select: {
            id: true,
            evaluatedTraits: true,
            questionBattery: true,
          },
        },
      },
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK nenájdené' }, { status: 404 })
    }

    // Get candidate with all details
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        vkId: vkId,
        deleted: false,
      },
      include: {
        testSessions: {
          include: {
            vkTest: {
              include: {
                test: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        evaluations: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Kandidát nenájdený' }, { status: 404 })
    }

    // Calculate test scores
    const completedSessions = candidate.testSessions.filter(
      (session) => session.status === 'COMPLETED'
    )
    const totalTestScore = completedSessions.reduce(
      (sum, session) => sum + (session.score || 0),
      0
    )
    const passedAllTests = completedSessions.every((session) => session.passed)

    // Get my evaluation
    const myEvaluation = candidate.evaluations.find(
      (evaluation) => evaluation.memberId === commissionMember.id
    )

    // Get question battery categories with questions
    let questionBattery = null
    if (vk.evaluationConfig?.questionBattery) {
      const categories = await prisma.questionCategory.findMany({
        where: {
          id: {
            in: vk.evaluationConfig.evaluatedTraits || [],
          },
        },
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      })

      questionBattery = categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        questions: category.questions.map((q) => ({
          id: q.id,
          question: q.question,
          order: q.order,
        })),
      }))
    }

    return NextResponse.json({
      vk: {
        id: vk.id,
        identifier: vk.identifier,
        selectionType: vk.selectionType,
        startDateTime: vk.startDateTime,
      },
      candidate: {
        id: candidate.id,
        cisIdentifier: candidate.cisIdentifier,
        email: candidate.email,
        name: candidate.name,
        surname: candidate.surname,
        phone: candidate.phone,
        registeredAt: candidate.registeredAt,
        totalTestScore,
        passedAllTests,
        testSessions: completedSessions.map((session) => ({
          id: session.id,
          testName: session.vkTest.test.name,
          level: session.vkTest.level,
          score: session.score,
          maxScore: session.maxScore,
          passed: session.passed,
          completedAt: session.completedAt,
        })),
      },
      myEvaluation: myEvaluation
        ? {
            id: myEvaluation.id,
            evaluation: myEvaluation.evaluation,
            totalScore: myEvaluation.totalScore,
            finalized: myEvaluation.finalized,
            finalizedAt: myEvaluation.finalizedAt,
          }
        : null,
      allEvaluations: candidate.evaluations.map((evaluation) => ({
        id: evaluation.id,
        memberId: evaluation.memberId,
        memberName: `${evaluation.member.user.name} ${evaluation.member.user.surname}`,
        totalScore: evaluation.totalScore,
        finalized: evaluation.finalized,
      })),
      questionBattery,
      evaluatedTraits: vk.evaluationConfig?.evaluatedTraits || [],
    })
  } catch (error) {
    console.error('GET /api/commission/vk/[id]/candidate/[candidateId] error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní detailu kandidáta' },
      { status: 500 }
    )
  }
}
