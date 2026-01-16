import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Generate a password reset token for a user
 * @param userId - User ID
 * @returns Reset token and expiry date
 */
export async function generatePasswordResetToken(userId: string) {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save token to database
    await prisma.user.update({
        where: { id: userId },
        data: {
            passwordResetToken: token,
            passwordResetExpiry: expiry,
        },
    })

    return { token, expiry }
}

/**
 * Verify a password reset token
 * @param token - Reset token
 * @returns User ID if valid, null otherwise
 */
export async function verifyPasswordResetToken(
    token: string
): Promise<string | null> {
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: token,
            passwordResetExpiry: {
                gt: new Date(), // Token not expired
            },
            deleted: false,
            active: true,
        },
        select: { id: true },
    })

    return user?.id || null
}

/**
 * Set a new password for a user
 * @param userId - User ID
 * @param newPassword - New password (plain text)
 */
export async function setNewPassword(userId: string, newPassword: string) {
    // Validate password strength
    const validation = validatePasswordStrength(newPassword)
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null,
            passwordChangedAt: new Date(),
            mustChangePassword: false,
        },
    })
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
    strength: 'weak' | 'medium' | 'strong'
} {
    const errors: string[] = []

    // Minimum length
    if (password.length < 8) {
        errors.push('Heslo musí mať aspoň 8 znakov')
    }

    // Must contain uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Heslo musí obsahovať aspoň jedno veľké písmeno')
    }

    // Must contain lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Heslo musí obsahovať aspoň jedno malé písmeno')
    }

    // Must contain number
    if (!/\d/.test(password)) {
        errors.push('Heslo musí obsahovať aspoň jedno číslo')
    }

    // Must contain special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Heslo musí obsahovať aspoň jeden špeciálny znak')
    }

    // Calculate strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak'
    if (errors.length === 0) {
        if (password.length >= 12) {
            strength = 'strong'
        } else if (password.length >= 10) {
            strength = 'medium'
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength,
    }
}

/**
 * Change password (for logged-in users)
 * @param userId - User ID
 * @param oldPassword - Current password
 * @param newPassword - New password
 */
export async function changePassword(
    userId: string,
    oldPassword: string | null,
    newPassword: string
) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, mustChangePassword: true },
    })

    if (!user) {
        throw new Error('User not found')
    }

    // Verify old password (unless first-time password change)
    if (!user.mustChangePassword && oldPassword) {
        if (!user.password) {
            throw new Error('User has no password set')
        }

        const isValid = await bcrypt.compare(oldPassword, user.password)
        if (!isValid) {
            throw new Error('Current password is incorrect')
        }
    }

    // Set new password
    await setNewPassword(userId, newPassword)
}
