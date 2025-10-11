import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { VKStatus } from '@prisma/client'

const ALLOWED_ROLES = ['SUPERADMIN', 'ADMIN']
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') ?? '').trim()
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const limitParam = parseInt(searchParams.get('limit') ?? '50', 10)
    const limit = Math.min(Math.max(limitParam, 1), MAX_LIMIT)

    const where: any = {
      deleted: false,
      vk: {
        status: VKStatus.DOKONCENE,
      },
    }

    // ADMIN can access any VK (no institution restrictions anymore)

    if (search) {
      where.OR = [
        { cisIdentifier: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { surname: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          vk: {
            OR: [
              { identifier: { contains: search, mode: 'insensitive' } },
              { position: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { registeredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vk: {
            select: {
              id: true,
              identifier: true,
              position: true,
              date: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
      }),
      prisma.candidate.count({ where }),
    ])

    const formatted = candidates.map(candidate => ({
      candidateId: candidate.id,
      userId: candidate.user.id,
      name: candidate.user.name,
      surname: candidate.user.surname,
      email: candidate.user.email,
      cisIdentifier: candidate.cisIdentifier,
      vkIdentifier: candidate.vk.identifier,
      position: candidate.vk.position,
      completedAt: candidate.vk.date,
      registeredAt: candidate.registeredAt,
    }))

    return NextResponse.json({
      applicants: formatted,
      pagination: {
        page,
        limit,
        total,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/archive/applicants error:', error)
    return NextResponse.json({ error: 'Chyba pri čítaní archívu uchádzačov' }, { status: 500 })
  }
}
