import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'
import { encode } from 'next-auth/jwt'

/**
 * POST /api/admin/switch-back
 *
 * Switch back from candidate view to original admin/superadmin session
 *
 * Authorization: Any user with originalUserId in session (switched session)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SWITCH-BACK] Request received')

    // Get current session
    const session = await auth()
    console.log('[SWITCH-BACK] Session:', session?.user?.id, session?.user?.role)

    if (!session?.user) {
      console.log('[SWITCH-BACK] ERROR: No session')
      return NextResponse.json(
        { error: 'Neautorizovaný prístup' },
        { status: 401 }
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

    console.log('[SWITCH-BACK] Token:', {
      hasToken: !!token,
      originalUserId: token?.originalUserId,
      originalRole: token?.originalRole,
      originalUsername: token?.originalUsername,
    })

    // Check if user is currently switched
    if (!token.originalUserId || !token.originalRole || !token.originalUsername) {
      console.log('[SWITCH-BACK] ERROR: Not switched (originalUserId, originalRole, originalUsername missing)')
      return NextResponse.json(
        { error: 'Nie ste prepnutý na iného používateľa' },
        { status: 400 }
      )
    }

    // Get original user to restore roles
    const originalUser = await prisma.user.findUnique({
      where: { id: token.originalUserId as string },
      include: {
        userRoles: true,
      },
    })

    if (!originalUser) {
      return NextResponse.json(
        { error: 'Pôvodný používateľ nenájdený' },
        { status: 404 }
      )
    }

    // Restore original session
    const restoredToken = {
      ...token,
      // Restore original user data
      id: token.originalUserId,
      username: token.originalUsername,
      role: token.originalRole,
      roles: originalUser.userRoles.map((ur) => ({
        role: ur.role,
      })),
      type: 'user',
      // Clear switched data
      originalUserId: undefined,
      originalRole: undefined,
      originalUsername: undefined,
      candidateId: undefined,
      vkId: undefined,
      switchedToCandidateId: undefined,
      switchedToName: undefined,
      name: undefined,
      surname: undefined,
    }

    // Encode restored token
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('AUTH_SECRET or NEXTAUTH_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const encodedToken = await encode({
      token: restoredToken,
      secret: secret,
      salt: 'authjs.session-token',
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'SWITCH_BACK_TO_ADMIN',
        userId: token.originalUserId as string,
        entity: 'User',
        entityId: token.originalUserId as string,
        details: {
          adminUsername: token.originalUsername,
          adminRole: token.originalRole,
          switchedFromCandidateId: token.switchedToCandidateId,
          switchedFromName: token.switchedToName,
        },
      },
    })

    // Create response with restored cookie
    const response = NextResponse.json({
      success: true,
      redirectTo: '/dashboard',
      message: `Prepnuté späť na ${token.originalUsername}`,
    })

    // Set restored session cookie (use __Secure- prefix in production for HTTPS)
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
    console.error('Switch back error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prepínaní späť' },
      { status: 500 }
    )
  }
}
