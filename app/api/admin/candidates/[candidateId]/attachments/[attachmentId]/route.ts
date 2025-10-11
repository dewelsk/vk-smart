import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'applicants')

type SessionUser = NonNullable<Awaited<ReturnType<typeof auth>>>['user']

const ensureAccess = async (candidateId: string, sessionUser: SessionUser) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  })

  if (!candidate) {
    throw new Error('CandidateNotFound')
  }

  // ADMIN can access any VK (no institution restrictions anymore)
  if (sessionUser.role === 'SUPERADMIN' || sessionUser.role === 'ADMIN') {
    return candidate
  }

  throw new Error('Forbidden')
}

export async function GET(request: NextRequest, { params }: { params: { candidateId: string; attachmentId: string } }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['SUPERADMIN', 'ADMIN']

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { candidateId, attachmentId } = params

    const candidate = await ensureAccess(candidateId, session.user)

    const attachment = await prisma.candidateAttachment.findFirst({
      where: {
        id: attachmentId,
        candidateId: candidate.id,
      },
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Príloha nebola nájdená' }, { status: 404 })
    }

    const filePath = path.join(STORAGE_ROOT, attachment.storagePath, attachment.storedFileName)

    let fileBuffer: Buffer
    try {
      fileBuffer = await fs.readFile(filePath)
    } catch (error) {
      console.error('Admin attachments download - file missing:', error)
      return NextResponse.json({ error: 'Súbor sa nenašiel na úložisku' }, { status: 410 })
    }

    const headers = new Headers()
    headers.set('Content-Type', attachment.mimeType || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalFileName)}"`)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('GET /api/admin/candidates/[candidateId]/attachments/[attachmentId] error:', error)

    if (error instanceof Error) {
      if (error.message === 'CandidateNotFound') {
        return NextResponse.json({ error: 'Uchádzač neexistuje' }, { status: 404 })
      }

      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Chyba pri sťahovaní prílohy' }, { status: 500 })
  }
}
