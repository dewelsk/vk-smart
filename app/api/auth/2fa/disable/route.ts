import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for a user (admin/superadmin only, or self)
 * Body: { userId } (optional, defaults to current user)
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

        const currentUserId = session.user.id
        const currentUserRole = session.user.role

        const body = await request.json()
        const targetUserId = body.userId || currentUserId

        // Check permissions
        // Only allow if:
        // 1. User is disabling their own 2FA, OR
        // 2. User is ADMIN/SUPERADMIN disabling someone else's 2FA
        if (targetUserId !== currentUserId) {
            if (
                currentUserRole !== UserRole.ADMIN &&
                currentUserRole !== UserRole.SUPERADMIN
            ) {
                return NextResponse.json(
                    { error: 'Insufficient permissions' },
                    { status: 403 }
                )
            }
        }

        // Disable 2FA
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                otpSecret: null,
                otpEnabled: false,
                twoFactorBackupCodes: [],
                twoFactorLastUsedAt: null,
            },
        })

        // TODO: Audit log
        // await logAudit({
        //   userId: currentUserId,
        //   akcia: '2FA_DISABLED',
        //   entita: 'User',
        //   entitaId: targetUserId,
        //   details: { disabledBy: currentUserId },
        // })

        // TODO: Send email notification
        // await sendEmail({
        //   to: targetUser.email,
        //   template: '2fa-disabled',
        //   data: { disabledBy: currentUser.email },
        // })

        return NextResponse.json({
            success: true,
            message: '2FA has been disabled successfully',
        })
    } catch (error) {
        console.error('2FA disable error:', error)
        return NextResponse.json(
            { error: 'Failed to disable 2FA' },
            { status: 500 }
        )
    }
}
