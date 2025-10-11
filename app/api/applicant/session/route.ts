import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getToken } from 'next-auth/jwt'

/**
 * GET /api/applicant/session
 *
 * Returns current candidate session info from JWT token
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Get token to extract candidate data
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    })

    if (!token || token.type !== 'candidate') {
      return NextResponse.json(
        { error: 'Prístup len pre uchádzačov' },
        { status: 403 }
      )
    }

    const candidateId = token.candidateId as string
    const vkId = token.vkId as string
    const name = token.name as string
    const surname = token.surname as string

    if (!candidateId || !vkId) {
      return NextResponse.json(
        { error: 'Neplatná session kandidáta' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      candidateId,
      vkId,
      name,
      surname,
      switchedFrom: token.switchedToCandidateId ? {
        originalUsername: token.originalUsername,
        originalUserId: token.originalUserId,
      } : null
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní session' },
      { status: 500 }
    )
  }
}
