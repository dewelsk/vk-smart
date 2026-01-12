import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'
import { encode } from 'next-auth/jwt'

/**
 * POST /api/admin/applicants/[id]/switch
 *
 * Temporarily switch admin/superadmin session to candidate view
 *
 * Authorization: ADMIN, SUPERADMIN
 * - Switches to Candidate (not User)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current session
    const session = await auth()
    if (!session?.user || !session.user.role) {
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Only ADMIN or SUPERADMIN can use this feature
    const hasPermission = session.user.roles?.some(
      (r) => r.role === 'ADMIN' || r.role === 'SUPERADMIN'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na túto akciu' },
        { status: 403 }
      )
    }

    // Check if already switched
    if (session.user.switchedToCandidateId) {
      return NextResponse.json(
        { error: 'Už ste prepnutý na iného používateľa. Najprv sa vráťte späť.' },
        { status: 400 }
      )
    }

    // Get target candidate
    const targetCandidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        vk: {
          select: {
            id: true,
            identifier: true,
          },
        },
      },
    })

    if (!targetCandidate || targetCandidate.deleted || !targetCandidate.active) {
      return NextResponse.json(
        { error: 'Kandidát nenájdený alebo nie je aktívny' },
        { status: 404 }
      )
    }

    // Get current token
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieName = isProduction
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName: cookieName,
    })

    if (!token) {
      console.error('Failed to get token. Cookie name:', cookieName, 'Environment:', process.env.NODE_ENV)
      return NextResponse.json(
        { error: 'Chyba pri získaní tokenu' },
        { status: 500 }
      )
    }

    // Create new token with switched session
    const newToken = {
      ...token,
      // Save original session
      originalUserId: token.id,
      originalRole: token.role,
      originalUsername: token.username,
      // Switch to candidate
      id: targetCandidate.id,
      candidateId: targetCandidate.id,
      vkId: targetCandidate.vkId,
      type: 'candidate',
      name: targetCandidate.name,
      surname: targetCandidate.surname,
      switchedToCandidateId: targetCandidate.id,
      switchedToName: `${targetCandidate.name} ${targetCandidate.surname}`,
    }

    // Encode new token
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('AUTH_SECRET or NEXTAUTH_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const encodedToken = await encode({
      token: newToken,
      secret: secret,
      salt: 'authjs.session-token',
    })

    // Update candidate last login
    await prisma.candidate.update({
      where: { id: targetCandidate.id },
      data: { lastLoginAt: new Date() },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SWITCH_TO_APPLICANT',
        userId: session.user.id!,
        entity: 'Candidate',
        entityId: targetCandidate.id,
        details: {
          adminUsername: session.user.username,
          adminRole: session.user.role,
          candidateId: targetCandidate.id,
          candidateName: `${targetCandidate.name} ${targetCandidate.surname}`,
          candidateCIS: targetCandidate.cisIdentifier,
          vkId: targetCandidate.vkId,
          vkIdentifier: targetCandidate.vk.identifier,
        },
      },
    })

    // Create response with new cookie
    const response = NextResponse.json({
      success: true,
      redirectTo: '/applicant/dashboard',
      message: `Prepnuté na ${targetCandidate.name} ${targetCandidate.surname}`,
    })

    // Set new session cookie (use __Secure- prefix in production for HTTPS)
    response.cookies.set({
      name: cookieName,
      value: encodedToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Switch to candidate error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prepínaní na uchádzača' },
      { status: 500 }
    )
  }
}
