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
      status: VKStatus.DOKONCENE,
    }

    // ADMIN can access any VK (no institution restrictions anymore)

    if (search) {
      where.OR = [
        { identifier: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { selectionType: { contains: search, mode: 'insensitive' } },
        { organizationalUnit: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [vks, total] = await Promise.all([
      prisma.vyberoveKonanie.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          gestor: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
          _count: {
            select: {
              candidates: { where: { deleted: false } },
            },
          },
        },
      }),
      prisma.vyberoveKonanie.count({ where }),
    ])

    const formatted = vks.map(vk => ({
      id: vk.id,
      identifier: vk.identifier,
      position: vk.position,
      date: vk.date,
      status: vk.status,
      gestor: vk.gestor
        ? {
            name: vk.gestor.name,
            surname: vk.gestor.surname,
          }
        : null,
      candidatesCount: vk._count.candidates,
    }))

    return NextResponse.json({
      vks: formatted,
      pagination: {
        page,
        limit,
        total,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/archive/vk error:', error)
    return NextResponse.json({ error: 'Chyba pri čítaní archívu VK' }, { status: 500 })
  }
}
