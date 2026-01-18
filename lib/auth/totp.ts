import {
    generateSecret as otplibGenerateSecret,
    generateURI,
    verifySync,
} from 'otplib'
import * as QRCode from 'qrcode'
import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'

/**
 * Generate a new TOTP secret for a user
 */
export function generateSecret(): string {
    return otplibGenerateSecret()
}

/**
 * Generate a QR code data URL for TOTP setup
 * @param secret - The TOTP secret
 * @param email - User's email address
 * @param issuer - Application name (default: "VK Smart")
 */
export async function generateQRCode(
    secret: string,
    email: string,
    issuer: string = 'VK Smart'
): Promise<string> {
    const otpauth = generateURI({
        secret,
        label: email,
        issuer,
        algorithm: 'sha1',
        digits: 6,
        period: 30,
    })
    const qrCodeDataURL = await QRCode.toDataURL(otpauth)
    return qrCodeDataURL
}

/**
 * Verify a TOTP token
 * @param secret - The user's TOTP secret
 * @param token - The 6-digit token to verify
 * @param window - Time window for verification (default: 1 = ±30 seconds)
 */
export function verifyToken(
    secret: string,
    token: string,
    window: number = 1
): boolean {
    try {
        // epochTolerance is in seconds, window * 30 converts steps to seconds
        const result = verifySync({
            token,
            secret,
            epochTolerance: window * 30,
        })
        return result.valid
    } catch (error) {
        console.error('TOTP verification error:', error)
        return false
    }
}

/**
 * Generate backup codes for 2FA recovery
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []

    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = crypto.randomBytes(4).toString('hex').toUpperCase()
        codes.push(code)
    }

    return codes
}

/**
 * Hash backup codes for secure storage
 * @param codes - Array of plain text backup codes
 * @returns Array of hashed backup codes
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes = await Promise.all(
        codes.map((code) => bcrypt.hash(code, 10))
    )
    return hashedCodes
}

/**
 * Verify a backup code against hashed codes
 * @param hashedCodes - Array of hashed backup codes
 * @param code - Plain text code to verify
 * @returns Index of matched code, or -1 if not found
 */
export async function verifyBackupCode(
    hashedCodes: string[],
    code: string
): Promise<number> {
    for (let i = 0; i < hashedCodes.length; i++) {
        const isMatch = await bcrypt.compare(code, hashedCodes[i])
        if (isMatch) {
            return i
        }
    }
    return -1
}

/**
 * Remove a used backup code from the array
 * @param hashedCodes - Array of hashed backup codes
 * @param index - Index of the code to remove
 * @returns Updated array without the used code
 */
export function removeBackupCode(hashedCodes: string[], index: number): string[] {
    return hashedCodes.filter((_, i) => i !== index)
}
