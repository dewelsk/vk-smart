import { prisma } from '@/lib/prisma'

interface SessionMetadata {
    ipAddress?: string
    userAgent?: string
    deviceInfo?: string
}

/**
 * Create a new user session
 * @param userId - User ID
 * @param sessionToken - JWT session token
 * @param metadata - Session metadata (IP, user agent, device info)
 * @param expiresAt - Session expiration date
 */
export async function createSession(
    userId: string,
    sessionToken: string,
    metadata: SessionMetadata,
    expiresAt: Date
) {
    return await prisma.userSession.create({
        data: {
            userId,
            sessionToken,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            deviceInfo: metadata.deviceInfo,
            expiresAt,
            active: true,
        },
    })
}

/**
 * Get all active sessions for a user
 * @param userId - User ID
 * @returns Array of active sessions
 */
export async function getActiveSessions(userId: string) {
    return await prisma.userSession.findMany({
        where: {
            userId,
            active: true,
            expiresAt: {
                gt: new Date(), // Not expired
            },
        },
        orderBy: {
            lastAccessedAt: 'desc',
        },
    })
}

/**
 * Update session last accessed time
 * @param sessionToken - Session token
 */
export async function updateSessionAccess(sessionToken: string) {
    await prisma.userSession.updateMany({
        where: { sessionToken },
        data: { lastAccessedAt: new Date() },
    })
}

/**
 * Terminate a specific session
 * @param sessionId - Session ID
 */
export async function terminateSession(sessionId: string) {
    await prisma.userSession.update({
        where: { id: sessionId },
        data: { active: false },
    })
}

/**
 * Terminate all sessions for a user
 * @param userId - User ID
 * @param exceptSessionToken - Optional session token to keep active (current session)
 */
export async function terminateAllSessions(
    userId: string,
    exceptSessionToken?: string
) {
    await prisma.userSession.updateMany({
        where: {
            userId,
            active: true,
            ...(exceptSessionToken && {
                sessionToken: {
                    not: exceptSessionToken,
                },
            }),
        },
        data: { active: false },
    })
}

/**
 * Cleanup expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions() {
    const result = await prisma.userSession.deleteMany({
        where: {
            OR: [
                {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
                {
                    active: false,
                    createdAt: {
                        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
                    },
                },
            ],
        },
    })

    return result.count
}

/**
 * Get session by token
 * @param sessionToken - Session token
 * @returns Session or null
 */
export async function getSessionByToken(sessionToken: string) {
    return await prisma.userSession.findUnique({
        where: { sessionToken },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                },
            },
        },
    })
}

/**
 * Check if a session is valid
 * @param sessionToken - Session token
 * @returns True if session is valid and active
 */
export async function isSessionValid(sessionToken: string): Promise<boolean> {
    const session = await prisma.userSession.findUnique({
        where: { sessionToken },
        select: {
            active: true,
            expiresAt: true,
        },
    })

    if (!session) {
        return false
    }

    return session.active && session.expiresAt > new Date()
}
