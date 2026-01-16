import { NextRequest, NextResponse } from 'next/server'
import { verifyResetToken, changePassword } from '@/lib/auth/password-reset'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/password-reset/verify
 * Verify reset token and change password
 * Body: { token, newPassword }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, newPassword } = body

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: 'Token and new password are required' },
                { status: 400 }
            )
        }

        // Verify token
        const userId = await verifyResetToken(token)

        if (!userId) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            )
        }

        // Change password
        const result = await changePassword(userId, newPassword)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to change password' },
                { status: 400 }
            )
        }

        // Get user details for email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                email: true,
                name: true,
                surname: true,
            },
        })

        // TODO: Send confirmation email
        // if (user?.email) {
        //   await sendEmail({
        //     to: user.email,
        //     template: 'password-changed',
        //     data: {
        //       name: `${user.name} ${user.surname}`,
        //     },
        //   })
        // }

        // TODO: Audit log
        // await logAudit({
        //   userId,
        //   akcia: 'PASSWORD_RESET_COMPLETED',
        //   details: {},
        // })

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully',
        })
    } catch (error) {
        console.error('Password reset verify error:', error)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
