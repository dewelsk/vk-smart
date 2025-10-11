import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/commission/vk - List VK where user is commission member
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'KOMISIA') {
      return NextResponse.json({ error: 'Neautorizovaný prístup' }, { status: 401 })
    }

    const userId = session.user.id

    // Get all VK where user is commission member
    const commissionMemberships = await prisma.commissionMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        commission: {
          include: {
            vk: {
              include: {
                gestor: {
                  select: {
                    id: true,
                    name: true,
                    surname: true,
                  },
                },
                candidates: {
                  where: {
                    deleted: false,
                    active: true,
                  },
                  select: {
                    id: true,
                  },
                },
                evaluationConfig: {
                  select: {
                    id: true,
                    evaluatedTraits: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Get evaluation progress for each VK
    const vkList = await Promise.all(
      commissionMemberships.map(async (membership) => {
        const vk = membership.commission.vk
        const candidatesCount = vk.candidates.length

        // Count how many candidates this member has evaluated
        const myEvaluationsCount = await prisma.evaluation.count({
          where: {
            memberId: membership.id,
            finalized: true,
          },
        })

        // Count total evaluations needed (candidates * commission members)
        const commissionMembersCount = await prisma.commissionMember.count({
          where: {
            commissionId: membership.commission.id,
          },
        })

        const totalEvaluationsNeeded = candidatesCount * commissionMembersCount
        const completedEvaluationsCount = await prisma.evaluation.count({
          where: {
            candidate: {
              vkId: vk.id,
            },
            finalized: true,
          },
        })

        return {
          id: vk.id,
          identifier: vk.identifier,
          selectionType: vk.selectionType,
          organizationalUnit: vk.organizationalUnit,
          serviceField: vk.serviceField,
          position: vk.position,
          serviceType: vk.serviceType,
          startDateTime: vk.startDateTime,
          status: vk.status,
          gestor: vk.gestor,
          candidatesCount,
          myEvaluationsCount,
          totalEvaluationsNeeded,
          completedEvaluationsCount,
          isChairman: membership.isChairman,
          evaluationConfig: vk.evaluationConfig,
        }
      })
    )

    // Sort: active VK first, then by startDateTime
    const sortedVkList = vkList.sort((a, b) => {
      if (a.status === 'HODNOTENIE' && b.status !== 'HODNOTENIE') return -1
      if (a.status !== 'HODNOTENIE' && b.status === 'HODNOTENIE') return 1
      return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
    })

    return NextResponse.json({ vkList: sortedVkList })
  } catch (error) {
    console.error('GET /api/commission/vk error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní VK' },
      { status: 500 }
    )
  }
}
