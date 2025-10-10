import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'applicants')

const getCandidateId = (request: NextRequest) => {
  const candidateId = request.headers.get('x-candidate-id') || request.nextUrl.searchParams.get('candidateId')

  if (!candidateId) {
    throw new Error('Chýba identifikátor uchádzača')
  }

  return candidateId
}

const getVkId = (request: NextRequest) => {
  const vkId = request.headers.get('x-vk-id') || request.nextUrl.searchParams.get('vkId')

  if (!vkId) {
    throw new Error('Chýba identifikátor výberového konania')
  }

  return vkId
}

const ensureCandidateContext = async (candidateId: string, vkId: string) => {
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      vkId,
      deleted: false,
    },
    select: { id: true },
  })

  if (!candidate) {
    throw new Error('Neplatná kombinácia uchádzača a výberového konania')
  }
}

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
    const candidateId = getCandidateId(request)
    const vkId = getVkId(request)
    const { attachmentId } = params

    await ensureCandidateContext(candidateId, vkId)

    const attachment = await findAttachment(candidateId, vkId, attachmentId)

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
    const status = error instanceof Error && error.message.includes('identifikátor') ? 400 : 500
    const message = error instanceof Error ? error.message : 'Chyba pri sťahovaní prílohy'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { attachmentId: string } }) {
  try {
    const candidateId = getCandidateId(request)
    const vkId = getVkId(request)
    const { attachmentId } = params

    await ensureCandidateContext(candidateId, vkId)

    const attachment = await findAttachment(candidateId, vkId, attachmentId)

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
    const status = error instanceof Error && error.message.includes('identifikátor') ? 400 : 500
    const message = error instanceof Error ? error.message : 'Chyba pri odstraňovaní prílohy'
    return NextResponse.json({ error: message }, { status })
  }
}
