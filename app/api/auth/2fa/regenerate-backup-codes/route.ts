import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateBackupCodes, hashBackupCodes } from '@/lib/auth/totp'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Generate new backup codes for a user with 2FA enabled
 * Old codes are invalidated
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Neautorizovaný prístup' },
                { status: 401 }
            )
        }

        const userId = session.user.id

        // Check if user has 2FA enabled
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { otpEnabled: true },
        })

        if (!user?.otpEnabled) {
            return NextResponse.json(
                { error: '2FA nie je aktivovaná' },
                { status: 400 }
            )
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes(10)
        const hashedCodes = await hashBackupCodes(backupCodes)

        // Save to database (replaces old codes)
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorBackupCodes: hashedCodes,
            },
        })

        // TODO: Audit log
        // await logAudit({
        //   userId,
        //   akcia: '2FA_BACKUP_CODES_REGENERATED',
        //   details: { codesCount: backupCodes.length },
        // })

        return NextResponse.json({
            success: true,
            backupCodes, // Return plain codes (only shown once)
            message: 'Záložné kódy boli úspešne vygenerované',
        })
    } catch (error) {
        console.error('Regenerate backup codes error:', error)
        return NextResponse.json(
            { error: 'Nepodarilo sa vygenerovať záložné kódy' },
            { status: 500 }
        )
    }
}
