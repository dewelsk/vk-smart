import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedCandidate } from '@/lib/applicant-auth'

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

    const body = await request.json()
    const { vkTestId } = body

    if (!vkTestId) {
      return NextResponse.json(
        { error: 'VKTest ID je povinné' },
        { status: 400 }
      )
    }

    // Get VKTest
    const vkTest = await prisma.vKTest.findUnique({
      where: { id: vkTestId },
      include: {
        test: true,
        vk: true
      }
    })

    if (!vkTest) {
      return NextResponse.json(
        { error: 'Test neexistuje' },
        { status: 404 }
      )
    }

    // SECURITY: Check if candidate belongs to this VK
    if (vkTest.vkId !== candidate.vkId) {
      return NextResponse.json(
        { error: 'Tento test nie je priradený k vášmu VK' },
        { status: 403 }
      )
    }

    // SECURITY: Check if VK is in TESTOVANIE status
    if (vkTest.vk.status !== 'TESTOVANIE') {
      return NextResponse.json(
        { error: 'Testy ešte nie sú spustené alebo VK už bolo ukončené' },
        { status: 400 }
      )
    }

    // SECURITY: Check if previous level was passed (if this is not level 1)
    if (vkTest.level > 1) {
      const previousVkTest = await prisma.vKTest.findFirst({
        where: {
          vkId: vkTest.vkId,
          level: vkTest.level - 1
        }
      })

      if (previousVkTest) {
        const previousSession = await prisma.testSession.findUnique({
          where: {
            candidateId_vkTestId: {
              candidateId: candidate.id,
              vkTestId: previousVkTest.id
            }
          }
        })

        if (!previousSession || previousSession.status !== 'COMPLETED' || !previousSession.passed) {
          return NextResponse.json(
            { error: 'Musíte najprv úspešne dokončiť predchádzajúci level' },
            { status: 400 }
          )
        }
      }
    }

    // Check if session already exists
    let session = await prisma.testSession.findUnique({
      where: {
        candidateId_vkTestId: {
          candidateId: candidate.id,
          vkTestId: vkTestId
        }
      }
    })

    // SECURITY: If session exists and is completed, return error
    if (session && session.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Tento test už bol dokončený' },
        { status: 400 }
      )
    }

    // If session doesn't exist or is NOT_STARTED, create/update it
    const now = new Date()
    const durationSeconds = (vkTest.durationMinutes || 20) * 60 // Default to 20 minutes if not set

    if (!session) {
      session = await prisma.testSession.create({
        data: {
          candidateId: candidate.id,
          vkTestId: vkTestId,
          testId: vkTest.testId,
          status: 'IN_PROGRESS',
          answers: {},
          startedAt: now,
          serverStartTime: now,
          durationSeconds: durationSeconds,
          lastAccessedAt: now
        }
      })
    } else if (session.status === 'NOT_STARTED' || session.status === 'PAUSED') {
      // Resume or start the session
      session = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: session.startedAt || now,
          serverStartTime: session.serverStartTime || now,
          durationSeconds: session.durationSeconds || durationSeconds,
          lastAccessedAt: now
        }
      })
    } else {
      // Session is IN_PROGRESS, just update lastAccessedAt
      session = await prisma.testSession.update({
        where: { id: session.id },
        data: {
          lastAccessedAt: now
        }
      })
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      redirectUrl: `/applicant/test/${session.id}`
    })
  } catch (error) {
    console.error('Start test error:', error)
    return NextResponse.json(
      { error: 'Chyba pri spustení testu' },
      { status: 500 }
    )
  }
}
