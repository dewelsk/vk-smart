import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateSecret, generateQRCode, generateBackupCodes, hashBackupCodes } from '@/lib/auth/totp'

/**
 * POST /api/auth/2fa/setup
 * Initialize 2FA setup for a user
 * Returns QR code and backup codes (not saved to DB yet)
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
        const userEmail = session.user.email || session.user.username || 'user'

        // Generate OTP secret
        const secret = generateSecret()

        // Generate QR code
        const qrCodeDataURL = await generateQRCode(secret, userEmail)

        // Generate backup codes
        const backupCodes = generateBackupCodes(10)

        // Return setup data (NOT saved to DB yet - will be saved on verification)
        return NextResponse.json({
            secret,
            qrCode: qrCodeDataURL,
            backupCodes,
        })
    } catch (error) {
        console.error('2FA setup error:', error)
        return NextResponse.json(
            { error: 'Failed to initialize 2FA setup' },
            { status: 500 }
        )
    }
}
