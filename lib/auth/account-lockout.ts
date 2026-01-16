import { prisma } from '@/lib/prisma'

/**
 * Record a failed login attempt for a user
 * @param userId - User ID
 * @returns Updated user with incremented failed attempts
 */
export async function recordFailedAttempt(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { failedLoginAttempts: true, lockedUntil: true },
    })

    if (!user) {
        throw new Error('User not found')
    }

    // Get security settings
    const settings = await prisma.securitySettings.findFirst({
        orderBy: { createdAt: 'desc' },
    })

    const maxAttempts = settings?.maxFailedAttempts || 5
    const blockDuration = settings?.blockDurationMinutes || 15

    const newAttempts = user.failedLoginAttempts + 1

    // Lock account if max attempts reached
    if (newAttempts >= maxAttempts) {
        const lockedUntil = new Date(Date.now() + blockDuration * 60 * 1000)

        await prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: newAttempts,
                lockedUntil,
                lockReason: `Too many failed login attempts (${newAttempts})`,
            },
        })

        return { locked: true, lockedUntil }
    }

    // Increment failed attempts
    await prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: newAttempts },
    })

    return { locked: false, attempts: newAttempts }
}

/**
 * Reset failed login attempts after successful login
 * @param userId - User ID
 */
export async function resetFailedAttempts(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lockReason: null,
        },
    })
}

/**
 * Check if an account is currently locked
 * @param userId - User ID
 * @returns True if account is locked, false otherwise
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockedUntil: true },
    })

    if (!user || !user.lockedUntil) {
        return false
    }

    // Check if lock has expired
    if (user.lockedUntil < new Date()) {
        // Automatically unlock expired locks
        await unlockAccount(userId)
        return false
    }

    return true
}

/**
 * Manually unlock a user account
 * @param userId - User ID
 */
export async function unlockAccount(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lockReason: null,
        },
    })
}

/**
 * Get account lockout info
 * @param userId - User ID
 * @returns Lockout information
 */
export async function getAccountLockoutInfo(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            failedLoginAttempts: true,
            lockedUntil: true,
            lockReason: true,
        },
    })

    if (!user) {
        throw new Error('User not found')
    }

    const isLocked = user.lockedUntil ? user.lockedUntil > new Date() : false

    return {
        failedAttempts: user.failedLoginAttempts,
        isLocked,
        lockedUntil: user.lockedUntil,
        lockReason: user.lockReason,
    }
}
