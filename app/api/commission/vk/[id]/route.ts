import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/commission/vk/[id] - Get VK detail for commission member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'KOMISIA') {
      return NextResponse.json({ error: 'Neautorizovaný prístup' }, { status: 401 })
    }

    const userId = session.user.id
    const vkId = params.id

    // Check if user is commission member of this VK
    const commissionMember = await prisma.commissionMember.findFirst({
      where: {
        userId: userId,
        commission: {
          vkId: vkId,
        },
      },
      include: {
        commission: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!commissionMember) {
      return NextResponse.json(
        { error: 'Nie ste členom komisie tohto VK' },
        { status: 403 }
      )
    }

    // Get VK detail
    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      include: {
        gestor: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        evaluationConfig: {
          select: {
            id: true,
            evaluatedTraits: true,
            questionBattery: true,
          },
        },
        candidates: {
          where: {
            deleted: false,
            active: true,
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
        },
      },
    })

    if (!vk) {
      return NextResponse.json({ error: 'VK nenájdené' }, { status: 404 })
    }

    // Calculate test scores for each candidate
    const candidates = vk.candidates.map((candidate) => {
      // Calculate total test score
      const completedSessions = candidate.testSessions.filter(
        (session) => session.status === 'COMPLETED'
      )
      const totalTestScore = completedSessions.reduce(
        (sum, session) => sum + (session.score || 0),
        0
      )

      // Check my evaluation status
      const myEvaluation = candidate.evaluations.find(
        (evaluation) => evaluation.memberId === commissionMember.id
      )

      // Check if there's a scoring conflict (difference > 2)
      const hasConflict = checkScoringConflict(candidate.evaluations)

      return {
        id: candidate.id,
        cisIdentifier: candidate.cisIdentifier,
        email: candidate.email,
        name: candidate.name,
        surname: candidate.surname,
        phone: candidate.phone,
        registeredAt: candidate.registeredAt,
        totalTestScore,
        passedAllTests: completedSessions.every((session) => session.passed),
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
        hasConflict,
      }
    })

    return NextResponse.json({
      vk: {
        id: vk.id,
        identifier: vk.identifier,
        selectionType: vk.selectionType,
        organizationalUnit: vk.organizationalUnit,
        serviceField: vk.serviceField,
        position: vk.position,
        serviceType: vk.serviceType,
        startDateTime: vk.startDateTime,
        numberOfPositions: vk.numberOfPositions,
        status: vk.status,
        gestor: vk.gestor,
        evaluationConfig: vk.evaluationConfig,
      },
      commission: {
        id: commissionMember.commission.id,
        chairmanId: commissionMember.commission.chairmanId,
        members: commissionMember.commission.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          isChairman: member.isChairman,
          user: member.user,
        })),
      },
      myMembership: {
        id: commissionMember.id,
        isChairman: commissionMember.isChairman,
      },
      candidates,
    })
  } catch (error) {
    console.error('GET /api/commission/vk/[vkId] error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní VK' },
      { status: 500 }
    )
  }
}

// Helper function to check if there's a scoring conflict
function checkScoringConflict(evaluations: any[]): boolean {
  if (evaluations.length < 2) return false

  const finalizedEvaluations = evaluations.filter((e) => e.finalized)
  if (finalizedEvaluations.length < 2) return false

  // Get all trait scores
  const traitScores: Record<string, number[]> = {}

  finalizedEvaluations.forEach((evaluation) => {
    const evaluationData = evaluation.evaluation as Record<string, any>
    Object.entries(evaluationData).forEach(([trait, data]: [string, any]) => {
      if (!traitScores[trait]) {
        traitScores[trait] = []
      }
      traitScores[trait].push(data.score)
    })
  })

  // Check if any trait has difference > 2
  for (const scores of Object.values(traitScores)) {
    const min = Math.min(...scores)
    const max = Math.max(...scores)
    if (max - min > 2) {
      return true
    }
  }

  return false
}
