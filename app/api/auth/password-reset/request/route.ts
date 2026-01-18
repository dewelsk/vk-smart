import { NextRequest, NextResponse } from 'next/server'
import { generatePasswordResetToken } from '@/lib/auth/password-reset'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/mailgun'
import { passwordResetEmail } from '@/lib/email/templates'

/**
 * POST /api/auth/password-reset/request
 * Request a password reset token
 * Body: { email }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                deleted: true,
                active: true,
            },
        })

        // Always return success to prevent email enumeration
        if (!user || user.deleted || !user.active) {
            return NextResponse.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent',
            })
        }

        // Generate reset token
        const { token } = await generatePasswordResetToken(user.id)

        // Send email with reset link
        const emailContent = passwordResetEmail({
            firstName: user.name || '',
            lastName: user.surname || '',
            token,
        })

        const emailResult = await sendEmail({
            to: user.email!,
            subject: emailContent.subject,
            html: emailContent.html,
        })

        if (!emailResult.success) {
            console.error('[PASSWORD_RESET] Email send failed:', emailResult.error)
            // Continue anyway - user might try again
        }

        // TODO: Audit log
        // await logAudit({
        //   userId: user.id,
        //   akcia: 'PASSWORD_RESET_REQUESTED',
        //   details: { email: user.email },
        // })

        return NextResponse.json({
            success: true,
            message: 'If the email exists, a password reset link has been sent',
            // For development only - remove in production
            ...(process.env.NODE_ENV === 'development' && { token }),
        })
    } catch (error) {
        console.error('Password reset request error:', error)
        return NextResponse.json(
            { error: 'Failed to process password reset request' },
            { status: 500 }
        )
    }
}
