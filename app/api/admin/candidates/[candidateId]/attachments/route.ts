import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CandidateAttachmentType } from '@prisma/client'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'applicants')
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

type SessionUser = NonNullable<Awaited<ReturnType<typeof auth>>>['user']

type FormDocumentType = 'cv' | 'motivation' | 'certificate' | 'other'

const FORM_TO_DB_TYPE: Record<FormDocumentType, CandidateAttachmentType> = {
  cv: CandidateAttachmentType.CV,
  motivation: CandidateAttachmentType.MOTIVATION,
  certificate: CandidateAttachmentType.CERTIFICATE,
  other: CandidateAttachmentType.OTHER,
}

const sanitizeFileName = (fileName: string) => {
  const cleaned = fileName.replace(/[\\/\r\n\t?%*:|"<>]/g, '_').trim()
  if (!cleaned) {
    return 'priloha'
  }

  return cleaned.slice(0, 180)
}

const ensureCandidateAccess = async (candidateId: string, sessionUser: SessionUser) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      vk: {
        select: {
          id: true,
        },
      },
    },
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

export async function POST(request: NextRequest, { params }: { params: { candidateId: string } }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['SUPERADMIN', 'ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { candidateId } = params

    const candidate = await ensureCandidateAccess(candidateId, session.user)

    const formData = await request.formData()
    const vkId = String(formData.get('vkId') ?? '')

    if (!vkId || vkId !== candidate.vk.id) {
      return NextResponse.json({ error: 'Neplatné výberové konanie' }, { status: 400 })
    }

    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File)
    const documentTypesRaw = formData.getAll('documentTypes').map(entry => String(entry))

    if (files.length === 0) {
      return NextResponse.json({ error: 'Neboli odoslané žiadne súbory' }, { status: 400 })
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Súbor ${file.name} je príliš veľký (max. 25 MB)` }, { status: 400 })
      }
    }

    const uploadDir = path.join(STORAGE_ROOT, candidateId, vkId)
    await fs.mkdir(uploadDir, { recursive: true })

    const relativeStoragePath = [candidateId, vkId].join('/')
    const createdRecordIds: string[] = []
    const createdFiles: string[] = []

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const buffer = Buffer.from(await file.arrayBuffer())
        const originalName = file.name && file.name.trim().length > 0 ? file.name : 'priloha'
        const storedFileName = `${randomUUID()}_${sanitizeFileName(originalName)}`
        const absolutePath = path.join(uploadDir, storedFileName)

        await fs.writeFile(absolutePath, buffer)
        createdFiles.push(path.join(relativeStoragePath, storedFileName))

        const rawType = (documentTypesRaw[index] ?? 'other').toLowerCase() as FormDocumentType
        const documentType = FORM_TO_DB_TYPE[rawType] ?? CandidateAttachmentType.OTHER

        const created = await prisma.candidateAttachment.create({
          data: {
            candidateId,
            vkId,
            documentType,
            originalFileName: originalName,
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
      await Promise.all(
        createdRecordIds.map(async id => {
          try {
            await prisma.candidateAttachment.delete({ where: { id } })
          } catch (cleanupError) {
            console.error('Cleanup error (record) admin attachments:', cleanupError)
          }
        })
      )

      await Promise.all(
        createdFiles.map(async relativePath => {
          try {
            await fs.unlink(path.join(STORAGE_ROOT, relativePath))
          } catch (cleanupError) {
            if ((cleanupError as NodeJS.ErrnoException)?.code !== 'ENOENT') {
              console.error('Cleanup error (file) admin attachments:', cleanupError)
            }
          }
        })
      )

      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/admin/candidates/[candidateId]/attachments error:', error)

    if (error instanceof Error) {
      if (error.message === 'CandidateNotFound') {
        return NextResponse.json({ error: 'Uchádzač neexistuje' }, { status: 404 })
      }

      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ error: 'Chyba pri nahrávaní príloh' }, { status: 500 })
  }
}
