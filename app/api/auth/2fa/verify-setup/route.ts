import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyToken, hashBackupCodes } from '@/lib/auth/totp'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/2fa/verify-setup
 * Verify and activate 2FA for a user
 * Body: { secret, token, backupCodes }
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
        const { secret, token, backupCodes } = body

        if (!secret || !token || !backupCodes || !Array.isArray(backupCodes)) {
            return NextResponse.json(
                { error: 'Chýbajúce povinné údaje' },
                { status: 400 }
            )
        }

        // Verify TOTP token
        const isValid = verifyToken(secret, token)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Nesprávny overovací kód' },
                { status: 400 }
            )
        }

        // Hash backup codes
        const hashedCodes = await hashBackupCodes(backupCodes)

        // Save to database
        await prisma.user.update({
            where: { id: userId },
            data: {
                otpSecret: secret,
                otpEnabled: true,
                twoFactorBackupCodes: hashedCodes,
                twoFactorLastUsedAt: new Date(),
            },
        })

        // TODO: Audit log
        // await logAudit({
        //   userId,
        //   akcia: '2FA_ENABLED',
        //   details: { method: 'TOTP' },
        // })

        return NextResponse.json({
            success: true,
            message: '2FA has been enabled successfully',
        })
    } catch (error) {
        console.error('2FA verification error:', error)
        return NextResponse.json(
            { error: 'Nepodarilo sa aktivovať 2FA' },
            { status: 500 }
        )
    }
}
