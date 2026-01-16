import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { terminateAllSessions } from '@/lib/auth/session-manager'

/**
 * POST /api/auth/sessions/terminate-all
 * Terminate all sessions for the authenticated user (except current)
 */
export async function POST(request: NextRequest) {
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

        // Get current session ID from request (if available)
        // This would typically come from the session token
        const body = await request.json().catch(() => ({}))
        const { currentSessionId } = body

        // Terminate all sessions except current
        const count = await terminateAllSessions(userId, currentSessionId)

        // TODO: Audit log
        // await logAudit({
        //   userId,
        //   akcia: 'ALL_SESSIONS_TERMINATED',
        //   details: { count },
        // })

        return NextResponse.json({
            success: true,
            message: `${count} session(s) terminated successfully`,
            count,
        })
    } catch (error) {
        console.error('Terminate all sessions error:', error)
        return NextResponse.json(
            { error: 'Failed to terminate sessions' },
            { status: 500 }
        )
    }
}
