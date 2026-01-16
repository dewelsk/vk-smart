import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedCandidate } from '@/lib/applicant-auth'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'applicants')

const findAttachment = async (candidateId: string, vkId: string, attachmentId: string) => {
  return prisma.candidateAttachment.findFirst({
    where: {
      id: attachmentId,
      candidateId,
      vkId,
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { attachmentId: string } }) {
  try {
    // SECURITY: Only accept JWT-based authentication
    const candidate = await getAuthenticatedCandidate(request)

    if (!candidate) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const { attachmentId } = params

    const attachment = await findAttachment(candidate.id, candidate.vkId, attachmentId)

    if (!attachment) {
      return NextResponse.json({ error: 'Príloha nebola nájdená' }, { status: 404 })
    }

    const absolutePath = path.join(STORAGE_ROOT, attachment.storagePath, attachment.storedFileName)

    let fileBuffer: Buffer
    try {
      fileBuffer = await fs.readFile(absolutePath)
    } catch (error) {
      console.error('Attachment file missing:', error)
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
    console.error('Attachment download error:', error)
    return NextResponse.json(
      { error: 'Chyba pri sťahovaní prílohy' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { attachmentId: string } }) {
  try {
    // SECURITY: Only accept JWT-based authentication
    const candidate = await getAuthenticatedCandidate(request)

    if (!candidate) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const { attachmentId } = params

    const attachment = await findAttachment(candidate.id, candidate.vkId, attachmentId)

    if (!attachment) {
      return NextResponse.json({ error: 'Príloha nebola nájdená' }, { status: 404 })
    }

    const absolutePath = path.join(STORAGE_ROOT, attachment.storagePath, attachment.storedFileName)

    await fs.unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    })

    await prisma.candidateAttachment.delete({ where: { id: attachment.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Attachment delete error:', error)
    return NextResponse.json(
      { error: 'Chyba pri odstraňovaní prílohy' },
      { status: 500 }
    )
  }
}
