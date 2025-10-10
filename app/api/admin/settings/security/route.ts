import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_SECURITY_SETTINGS = {
  maxFailedAttempts: 5,
  blockDurationMinutes: 15,
  blockWindowMinutes: 15,
}

const ensureSuperAdmin = async () => {
  const session = await auth()

  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (session.user.role !== 'SUPERADMIN') {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { session }
}

const mapSettingsResponse = (settings: Awaited<ReturnType<typeof prisma.securitySettings.findFirst>>) => {
  if (!settings) {
    return null
  }

  return {
    id: settings.id,
    maxFailedAttempts: settings.maxFailedAttempts,
    blockDurationMinutes: settings.blockDurationMinutes,
    blockWindowMinutes: settings.blockWindowMinutes,
    updatedAt: settings.updatedAt.toISOString(),
    updatedBy: settings.updatedBy
      ? {
          id: settings.updatedBy.id,
          name: settings.updatedBy.name,
          surname: settings.updatedBy.surname,
          email: settings.updatedBy.email,
        }
      : null,
  }
}

export async function GET() {
  const { session, error } = await ensureSuperAdmin()
  if (!session) {
    return error
  }

  let settings = await prisma.securitySettings.findFirst({
    include: {
      updatedBy: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      },
    },
  })

  if (!settings) {
    settings = await prisma.securitySettings.create({
      data: {
        ...DEFAULT_SECURITY_SETTINGS,
        updatedById: session.user.id,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    })
  }

  return NextResponse.json({ settings: mapSettingsResponse(settings) })
}

export async function PUT(request: NextRequest) {
  const { session, error } = await ensureSuperAdmin()
  if (!session) {
    return error
  }

  let body: any
  try {
    body = await request.json()
  } catch (parseError) {
    return NextResponse.json({ error: 'Neplatný formát požiadavky' }, { status: 400 })
  }

  const maxFailedAttempts = Number(body?.maxFailedAttempts)
  const blockDurationMinutes = Number(body?.blockDurationMinutes)
  const blockWindowMinutes = Number(body?.blockWindowMinutes)

  if (!Number.isInteger(maxFailedAttempts) || maxFailedAttempts < 1) {
    return NextResponse.json({ error: 'Maximálny počet pokusov musí byť celé číslo väčšie ako 0' }, { status: 400 })
  }

  if (!Number.isInteger(blockDurationMinutes) || blockDurationMinutes < 1) {
    return NextResponse.json({ error: 'Dĺžka blokácie musí byť celé číslo väčšie ako 0' }, { status: 400 })
  }

  if (!Number.isInteger(blockWindowMinutes) || blockWindowMinutes < 1) {
    return NextResponse.json({ error: 'Časové okno musí byť celé číslo väčšie ako 0' }, { status: 400 })
  }

  const existing = await prisma.securitySettings.findFirst()

  const updated = existing
    ? await prisma.securitySettings.update({
        where: { id: existing.id },
        data: {
          maxFailedAttempts,
          blockDurationMinutes,
          blockWindowMinutes,
          updatedById: session.user.id,
        },
        include: {
          updatedBy: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
      })
    : await prisma.securitySettings.create({
        data: {
          maxFailedAttempts,
          blockDurationMinutes,
          blockWindowMinutes,
          updatedById: session.user.id,
        },
        include: {
          updatedBy: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
        },
      })

  return NextResponse.json({ settings: mapSettingsResponse(updated) })
}
