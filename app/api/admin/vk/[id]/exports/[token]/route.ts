import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'exports')

function decodeToken(token: string) {
  try {
    return Buffer.from(token, 'base64url').toString('utf8')
  } catch (error) {
    return null
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string; token: string } }) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vkId = params.id
    const relativePath = decodeToken(params.token)

    if (!relativePath) {
      return NextResponse.json({ error: 'Neplatný token' }, { status: 400 })
    }

    const absolutePath = path.join(STORAGE_ROOT, relativePath)

    if (!absolutePath.startsWith(STORAGE_ROOT)) {
      return NextResponse.json({ error: 'Neplatná cesta' }, { status: 400 })
    }

    const fileExists = await fs
      .stat(absolutePath)
      .then((stats) => stats.isFile())
      .catch(() => false)

    if (!fileExists) {
      return NextResponse.json({ error: 'Súbor neexistuje' }, { status: 404 })
    }

    // ADMIN can access any VK (no institution restrictions anymore)

    const fileBuffer = await fs.readFile(absolutePath)
    const fileName = path.basename(absolutePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('GET /api/admin/vk/[id]/exports/[token] error:', error)
    return NextResponse.json({ error: 'Nepodarilo sa stiahnuť súbor' }, { status: 500 })
  }
}
