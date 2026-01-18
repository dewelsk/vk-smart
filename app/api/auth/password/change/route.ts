import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { changePassword } from '@/lib/auth/password-reset'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/mailgun'
import { passwordChangedEmail } from '@/lib/email/templates'

/**
 * POST /api/auth/password/change
 * Change password for authenticated user
 * Body: { currentPassword, newPassword }
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
        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        // Get user with current password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true,
                email: true,
                name: true,
                surname: true,
            },
        })

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify current password
        const bcrypt = require('bcryptjs')
        const isValid = await bcrypt.compare(currentPassword, user.password)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            )
        }

        // Change password (function throws on error, no return value)
        await changePassword(userId, currentPassword, newPassword)

        // Send confirmation email
        if (user.email) {
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
                console.error('[PASSWORD_CHANGE] Email send failed:', emailResult.error)
            }
        }

        // TODO: Audit log
        // await logAudit({
        //   userId,
        //   akcia: 'PASSWORD_CHANGED',
        //   details: {},
        // })

        return NextResponse.json({
            success: true,
            message: 'Password has been changed successfully',
        })
    } catch (error) {
        console.error('Password change error:', error)
        return NextResponse.json(
            { error: 'Failed to change password' },
            { status: 500 }
        )
    }
}
