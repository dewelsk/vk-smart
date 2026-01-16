import { NextRequest, NextResponse } from 'next/server'
import { generateResetToken } from '@/lib/auth/password-reset'
import { prisma } from '@/lib/prisma'

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
        const token = await generateResetToken(user.id)

        // TODO: Send email with reset link
        // const resetLink = `${process.env.NEXTAUTH_URL}/auth/password-reset/${token}`
        // await sendEmail({
        //   to: user.email!,
        //   template: 'password-reset',
        //   data: {
        //     name: `${user.name} ${user.surname}`,
        //     resetLink,
        //     expiryHours: 1,
        //   },
        // })

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
