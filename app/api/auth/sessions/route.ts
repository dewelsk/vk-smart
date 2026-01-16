import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserSessions, terminateSession } from '@/lib/auth/session-manager'

/**
 * GET /api/auth/sessions
 * Get all active sessions for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const userId = session.user.id

        // Get all sessions
        const sessions = await getUserSessions(userId)

        return NextResponse.json({
            sessions,
            count: sessions.length,
        })
    } catch (error) {
        console.error('Get sessions error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve sessions' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/auth/sessions
 * Terminate a specific session
 * Body: { sessionId }
 */
export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const userId = session.user.id
        const body = await request.json()
        const { sessionId } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            )
        }

        // Terminate session
        await terminateSession(sessionId, userId)

        // TODO: Audit log
        // await logAudit({
        //   userId,
        //   akcia: 'SESSION_TERMINATED',
        //   details: { sessionId },
        // })

        return NextResponse.json({
            success: true,
            message: 'Session terminated successfully',
        })
    } catch (error) {
        console.error('Terminate session error:', error)
        return NextResponse.json(
            { error: 'Failed to terminate session' },
            { status: 500 }
        )
    }
}
