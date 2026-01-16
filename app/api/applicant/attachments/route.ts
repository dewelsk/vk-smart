import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { CandidateAttachmentType } from '@prisma/client'
import { getAuthenticatedCandidate } from '@/lib/applicant-auth'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'applicants')
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

type ClientDocumentType = 'cv' | 'motivation' | 'certificate' | 'other' | 'unknown'

const FORM_TO_DB_TYPE: Record<string, CandidateAttachmentType> = {
  cv: CandidateAttachmentType.CV,
  motivation: CandidateAttachmentType.MOTIVATION,
  certificate: CandidateAttachmentType.CERTIFICATE,
  other: CandidateAttachmentType.OTHER,
}

const DB_TO_CLIENT_TYPE: Record<CandidateAttachmentType, ClientDocumentType> = {
  [CandidateAttachmentType.CV]: 'cv',
  [CandidateAttachmentType.MOTIVATION]: 'motivation',
  [CandidateAttachmentType.CERTIFICATE]: 'certificate',
  [CandidateAttachmentType.OTHER]: 'other',
  [CandidateAttachmentType.UNKNOWN]: 'unknown',
}

const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName.replace(/[\\/\r\n\t?%*:|"<>]/g, '_').trim()
  if (!cleaned) {
    return 'priloha'
  }

  return cleaned.slice(0, 180)
}

const resolveDir = (candidateId: string, vkId: string) => path.join(STORAGE_ROOT, candidateId, vkId)

const listAttachments = async (candidateId: string, vkId: string) => {
  const attachments = await prisma.candidateAttachment.findMany({
    where: {
      candidateId,
      vkId,
    },
    orderBy: { createdAt: 'desc' },
  })

  return attachments.map((attachment) => ({
    id: attachment.id,
    documentType: DB_TO_CLIENT_TYPE[attachment.documentType] ?? 'unknown',
    fileName: attachment.originalFileName,
    size: attachment.fileSize,
    uploadedAt: attachment.createdAt.toISOString(),
  }))
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Only accept JWT-based authentication
    const candidate = await getAuthenticatedCandidate(request)

    if (!candidate) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const files = await listAttachments(candidate.id, candidate.vkId)

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Attachments GET error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítavaní príloh' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only accept JWT-based authentication
    const candidate = await getAuthenticatedCandidate(request)

    if (!candidate) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const candidateId = candidate.id
    const vkId = candidate.vkId

    const formData = await request.formData()

    const uploadDir = resolveDir(candidateId, vkId)
    await fs.mkdir(uploadDir, { recursive: true })

    const fileEntries = formData.getAll('files').filter((entry): entry is File => entry instanceof File)
    const typeEntriesRaw = formData.getAll('documentTypes').map((entry) => String(entry))

    if (fileEntries.length === 0) {
      return NextResponse.json({ error: 'Neboli odoslané žiadne súbory' }, { status: 400 })
    }

    for (const file of fileEntries) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Súbor ${file.name} je príliš veľký (max. 25 MB)` }, { status: 400 })
      }
    }

    const relativeStoragePath = [candidateId, vkId].join('/')
    const createdRecordIds: string[] = []
    const createdFilePaths: string[] = []

    try {
      for (let index = 0; index < fileEntries.length; index += 1) {
        const file = fileEntries[index]
        const buffer = Buffer.from(await file.arrayBuffer())
        const safeOriginalName = (file.name && file.name.trim().length > 0) ? file.name : 'priloha'
        const storedFileName = `${randomUUID()}_${sanitizeFileName(safeOriginalName)}`
        const absolutePath = path.join(uploadDir, storedFileName)

        await fs.writeFile(absolutePath, buffer)
        createdFilePaths.push(path.join(relativeStoragePath, storedFileName))

        const documentType = FORM_TO_DB_TYPE[typeEntriesRaw[index]?.toLowerCase() ?? ''] ?? CandidateAttachmentType.OTHER

        const created = await prisma.candidateAttachment.create({
          data: {
            candidateId,
            vkId,
            documentType,
            originalFileName: safeOriginalName,
            storedFileName,
            storagePath: relativeStoragePath,
            mimeType: file.type || null,
            fileSize: buffer.length,
          },
          select: { id: true },
        })

        createdRecordIds.push(created.id)
      }
    } catch (error) {
      // Roll back created files/records if any step fails
      await Promise.all(
        createdRecordIds.map(async (attachmentId) => {
          try {
            await prisma.candidateAttachment.delete({ where: { id: attachmentId } })
          } catch (cleanupError) {
            console.error('Cleanup error (record) for attachment upload:', cleanupError)
          }
        })
      )

      await Promise.all(
        createdFilePaths.map(async (relativePath) => {
          try {
            const absolute = path.join(STORAGE_ROOT, relativePath)
            await fs.unlink(absolute)
          } catch (cleanupError) {
            if ((cleanupError as NodeJS.ErrnoException)?.code !== 'ENOENT') {
              console.error('Cleanup error (file) for attachment upload:', cleanupError)
            }
          }
        })
      )

      throw error
    }

    const files = await listAttachments(candidateId, vkId)

    return NextResponse.json({ success: true, files }, { status: 201 })
  } catch (error) {
    console.error('Attachments POST error:', error)
    return NextResponse.json(
      { error: 'Chyba pri nahrávaní príloh' },
      { status: 500 }
    )
  }
}
