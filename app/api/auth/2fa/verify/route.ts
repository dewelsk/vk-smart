import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyToken, verifyBackupCode, removeBackupCode } from '@/lib/auth/totp'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token during login
 * Body: { token, useBackupCode }
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
        const { token, useBackupCode = false } = body

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Get user's 2FA settings
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                otpSecret: true,
                otpEnabled: true,
                twoFactorBackupCodes: true,
            },
        })

        if (!user || !user.otpEnabled || !user.otpSecret) {
            return NextResponse.json(
                { error: '2FA is not enabled for this user' },
                { status: 400 }
            )
        }

        let isValid = false
        let usedBackupCode = false

        if (useBackupCode) {
            // Verify backup code
            const backupCodeIndex = await verifyBackupCode(
                user.twoFactorBackupCodes,
                token
            )

            if (backupCodeIndex >= 0) {
                isValid = true
                usedBackupCode = true

                // Remove used backup code
                const updatedCodes = removeBackupCode(
                    user.twoFactorBackupCodes,
                    backupCodeIndex
                )

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        twoFactorBackupCodes: updatedCodes,
                        twoFactorLastUsedAt: new Date(),
                    },
                })

                // TODO: Audit log
                // await logAudit({
                //   userId,
                //   akcia: '2FA_BACKUP_USED',
                //   details: { remainingCodes: updatedCodes.length },
                // })
            }
        } else {
            // Verify TOTP token
            isValid = verifyToken(user.otpSecret, token)

            if (isValid) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { twoFactorLastUsedAt: new Date() },
                })

                // TODO: Audit log
                // await logAudit({
                //   userId,
                //   akcia: '2FA_VERIFIED',
                //   details: { method: 'TOTP' },
                // })
            }
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            usedBackupCode,
            remainingBackupCodes: usedBackupCode
                ? user.twoFactorBackupCodes.length - 1
                : user.twoFactorBackupCodes.length,
        })
    } catch (error) {
        console.error('2FA verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify 2FA token' },
            { status: 500 }
        )
    }
}
