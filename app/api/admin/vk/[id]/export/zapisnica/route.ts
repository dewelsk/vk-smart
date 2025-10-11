import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { renderZapisnicaHtml, ZapisnicaData } from '@/lib/pdf/zapisnicaTemplate'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'exports')

function formatDate(date: Date | string | null | undefined) {
  if (!date) return '*** TODO: doplniť dátum a čas ***'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) {
    return '*** TODO: doplniť dátum a čas ***'
  }
  return d.toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

function formatFullName(user?: { name: string | null; surname: string | null }) {
  const name = user?.name ?? ''
  const surname = user?.surname ?? ''
  const combined = `${name} ${surname}`.trim()
  return combined || '*** bez mena ***'
}

function fallback(value: string | null | undefined, placeholder: string) {
  if (value && value.trim().length > 0) {
    return value.trim()
  }
  return placeholder
}

function buildDownloadToken(relativePath: string) {
  return Buffer.from(relativePath).toString('base64url')
}

async function generatePdfFromHtml(html: string, outputPath: string) {
  const { default: puppeteer } = await import('puppeteer')

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '25mm',
        bottom: '25mm',
        left: '20mm',
        right: '20mm',
      },
      printBackground: true,
    })
  } finally {
    await browser.close()
  }
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vkId = params.id

    const vk = await prisma.vyberoveKonanie.findUnique({
      where: { id: vkId },
      include: {
        gestor: true,
        commission: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        assignedTests: {
          include: {
            test: true,
          },
        },
      },
    })

    if (!vk) {
      return NextResponse.json({ error: 'Výberové konanie neexistuje' }, { status: 404 })
    }

    // ADMIN can access any VK (no institution restrictions anymore)

    const candidates = await prisma.candidate.findMany({
      where: {
        vkId,
        deleted: false,
      },
      include: {
        user: true,
        testResults: true,
      },
    })

    const data: ZapisnicaData = {
      header: {
        identifier: fallback(vk.identifier, '*** bez identifikátora ***'),
        institutionName: '*** TODO: doplniť názov inštitúcie ***',
        institutionAddress: '*** TODO: doplniť adresu služobného úradu ***',
        serviceType: fallback(vk.serviceType, '*** druh štátnej služby nie je k dispozícii ***'),
        selectionType: fallback(vk.selectionType, '*** druh výberového konania nie je k dispozícii ***'),
        positionsCount: String(vk.numberOfPositions ?? '***'),
        functionName: fallback(vk.position, '*** obsadzovaná funkcia nie je k dispozícii ***'),
        leadingFunction: '*** TODO: doplniť informáciu o vedúcom zamestnancovi ***',
        serviceField: fallback(vk.serviceField, '*** odbor štátnej služby nie je k dispozícii ***'),
        organisationalUnit: fallback(vk.organizationalUnit, '*** organizačný útvar nie je k dispozícii ***'),
        meetingDate: `${formatDate(vk.date)} – *** TODO: doplniť čas ***`,
        meetingPlace: '*** TODO: doplniť miesto výberového konania ***',
      },
  commission: (vk.commission?.members || []).map(member => ({
    roleLabel: member.isChairman ? 'predseda' : 'člen',
    name: formatFullName(member.user),
    position: '*** TODO: doplniť funkciu člena komisie ***',
  })),
      commissionerTrainingNote: '*** TODO: doplniť informáciu o absolvovaní školenia členov komisie ***',
      applicantsApplied: candidates.map(candidate => ({
        fullName: formatFullName(candidate.user),
        identifier: fallback(candidate.cisIdentifier, `*** identifikátor chýba (${candidate.id}) ***`),
      })),
      applicantsRejected: [
        {
          fullName: '*** TODO: doplniť uchádzačov, ktorí neboli zaradení ***',
          identifier: '***',
          statusLabel: '*** dôvod nezaradenia ***',
        },
      ],
      applicantsNotPresent: [
        {
          fullName: '*** TODO: doplniť uchádzačov, ktorí sa nezúčastnili ***',
          identifier: '***',
        },
      ],
      forms: vk.assignedTests.map((vkTest, index) => {
        const applicantRows = candidates.map(candidate => {
          const result = candidate.testResults.find(tr => tr.testId === vkTest.testId)
          const value = result
            ? `${result.score ?? 0} b / ${result.maxScore ?? '***'} b`
            : '*** výsledok nie je k dispozícii ***'

          return {
            fullName: formatFullName(candidate.user),
            identifier: fallback(candidate.cisIdentifier, candidate.id),
            value,
            secondaryValue: result ? `${Math.round(((result.score ?? 0) / (result.maxScore || 1)) * 100)} %` : undefined,
          }
        })

        return {
          title: `Forma overenia ${index + 1}: ${vkTest.test?.name ?? '*** názov testu chýba ***'}`,
          description: '*** TODO: doplniť presný opis formy overenia podľa interných pravidiel ***',
          pointsInfo: '*** TODO: doplniť pravidlá bodového hodnotenia ***',
          applicants: applicantRows,
        }
      }),
      ranking: candidates.map(candidate => {
        const totalScore = candidate.testResults.reduce((sum, result) => sum + (result.score ?? 0), 0)
        const totalMax = candidate.testResults.reduce((sum, result) => sum + (result.maxScore ?? 0), 0)
        const rank = '*** TODO: vypočítať poradie podľa metodiky ***'
        return {
          fullName: formatFullName(candidate.user),
          identifier: fallback(candidate.cisIdentifier, candidate.id),
          totalPoints: `${totalScore} b / ${totalMax || '***'} b`,
          rank,
        }
      }),
      resultLabel: '*** TODO: určiť výsledok výberového konania podľa metodiky ***',
  signatures: (vk.commission?.members || []).map(member => ({
    roleLabel: member.isChairman ? 'predseda' : 'člen',
    name: formatFullName(member.user),
    position: '*** podpis ***',
  })),
      cityAndDate: 'V ................................ dňa: *** TODO: doplniť dátum ***',
      preparedBy: '*** TODO: doplniť meno a funkciu osoby, ktorá zápisnicu vyhotovila ***',
    }

    if (data.forms.length === 0) {
      data.forms.push({
        title: '*** TODO: doplniť formy overenia ***',
        description: 'Výberové konanie pozostávalo z písomnej a ústnej časti.',
        pointsInfo: '*** TODO: doplniť bodové hodnotenie ***',
        applicants: candidates.map(candidate => ({
          fullName: formatFullName(candidate.user),
          identifier: fallback(candidate.cisIdentifier, candidate.id),
          value: '*** výsledok nie je k dispozícii ***',
        })),
      })
    }

    const html = renderZapisnicaHtml(data)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0]
    const safeIdentifier = fallback(vk.identifier, vk.id).replace(/[^a-zA-Z0-9-_]/g, '_')
    const relativeDir = path.join('vk', safeIdentifier)
    const relativePath = path.join(relativeDir, `zapisnica_${timestamp}_${randomUUID()}.pdf`)
    const absoluteDir = path.join(STORAGE_ROOT, relativeDir)
    const absolutePath = path.join(STORAGE_ROOT, relativePath)

    await fs.mkdir(absoluteDir, { recursive: true })
    await generatePdfFromHtml(html, absolutePath)

    const downloadToken = buildDownloadToken(relativePath)

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/admin/vk/${vkId}/exports/${downloadToken}`,
    })
  } catch (error) {
    console.error('POST /api/admin/vk/[id]/export/zapisnica error:', error)
    return NextResponse.json({ error: 'Nepodarilo sa vygenerovať PDF zápisnicu' }, { status: 500 })
  }
}
