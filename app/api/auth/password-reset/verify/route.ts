import { NextRequest, NextResponse } from 'next/server'
import { verifyResetToken, setNewPassword } from '@/lib/auth/password-reset'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/mailgun'
import { passwordChangedEmail } from '@/lib/email/templates'

/**
 * POST /api/auth/password-reset/verify
 * Verify reset token (or password set token) and change password
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

        // Verify token (supports both reset and set tokens)
        const tokenResult = await verifyResetToken(token)

        if (!tokenResult) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 400 }
            )
        }

        const { userId, tokenType } = tokenResult

        // Set new password
        try {
            await setNewPassword(userId, newPassword, tokenType)
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to set password' },
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

        // Send confirmation email
        if (user?.email) {
            const ipAddress = request.headers.get('x-forwarded-for') ||
                              request.headers.get('x-real-ip') ||
                              'neznáma'
            const timestamp = new Date().toLocaleString('sk-SK', {
                dateStyle: 'long',
                timeStyle: 'short',
            })

            const emailContent = passwordChangedEmail({
                firstName: user.name || '',
                lastName: user.surname || '',
                timestamp,
                ipAddress,
            })

            const emailResult = await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            })

            if (!emailResult.success) {
                console.error('[PASSWORD_RESET_VERIFY] Email send failed:', emailResult.error)
            }
        }

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
