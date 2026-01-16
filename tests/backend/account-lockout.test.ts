import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    recordFailedAttempt,
    resetFailedAttempts,
    isAccountLocked,
    unlockAccount,
    getAccountLockoutInfo,
} from '@/lib/auth/account-lockout'

describe('Account Lockout', () => {
    let testUserId: string

    // Setup - create test user
    beforeAll(async () => {
        await prisma.$connect()

        const hashedPassword = await bcrypt.hash('TestPassword123!', 10)
        const testUser = await prisma.user.create({
            data: {
                username: 'testlockout_' + Date.now(),
                email: `testlockout_${Date.now()}@example.com`,
                password: hashedPassword,
                name: 'Test',
                surname: 'Lockout',
                role: 'ADMIN',
            },
        })
        testUserId = testUser.id
    })

    // Cleanup
    afterAll(async () => {
        if (testUserId) {
            await prisma.user.delete({
                where: { id: testUserId },
            }).catch(() => { })
        }
        await prisma.$disconnect()
    })

    // Reset user state before each test
    beforeEach(async () => {
        await prisma.user.update({
            where: { id: testUserId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lockReason: null,
            },
        })
    })

    describe('Failed Login Attempts', () => {
        it('should record failed login attempt', async () => {
            await recordFailedAttempt(testUserId)

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.failedLoginAttempts).toBe(1)
        })

        it('should increment failed attempts', async () => {
            await recordFailedAttempt(testUserId)
            await recordFailedAttempt(testUserId)
            await recordFailedAttempt(testUserId)

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.failedLoginAttempts).toBe(3)
        })

        it('should lock account after max attempts', async () => {
            // Record 5 failed attempts (default max)
            for (let i = 0; i < 5; i++) {
                await recordFailedAttempt(testUserId)
            }

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.failedLoginAttempts).toBeGreaterThanOrEqual(5)
            expect(user?.lockedUntil).toBeDefined()
            expect(user?.lockReason).toContain('Too many failed login attempts')
        })

        it('should reset failed attempts on successful login', async () => {
            // Record some failed attempts
            await recordFailedAttempt(testUserId)
            await recordFailedAttempt(testUserId)

            // Reset on successful login
            await resetFailedAttempts(testUserId)

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.failedLoginAttempts).toBe(0)
            expect(user?.lockedUntil).toBeNull()
            expect(user?.lockReason).toBeNull()
        })
    })

    describe('Account Lock Status', () => {
        it('should return false for unlocked account', async () => {
            const locked = await isAccountLocked(testUserId)

            expect(locked).toBe(false)
        })

        it('should return true for locked account', async () => {
            // Lock the account
            const futureDate = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    lockedUntil: futureDate,
                    lockReason: 'Test lock',
                },
            })

            const locked = await isAccountLocked(testUserId)

            expect(locked).toBe(true)
        })

        it('should return false for expired lock', async () => {
            // Set lock in the past
            const pastDate = new Date(Date.now() - 1000) // 1 second ago
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    lockedUntil: pastDate,
                    lockReason: 'Test lock',
                },
            })

            const locked = await isAccountLocked(testUserId)

            expect(locked).toBe(false)

            // Verify it was auto-unlocked
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })
            expect(user?.lockedUntil).toBeNull()
        })

        it('should get lockout info', async () => {
            await recordFailedAttempt(testUserId)
            await recordFailedAttempt(testUserId)

            const info = await getAccountLockoutInfo(testUserId)

            expect(info.failedAttempts).toBe(2)
            expect(info.isLocked).toBe(false)
            expect(info.lockedUntil).toBeNull()
            expect(info.lockReason).toBeNull()
        })

        it('should get lockout info for locked account', async () => {
            // Lock the account
            for (let i = 0; i < 5; i++) {
                await recordFailedAttempt(testUserId)
            }

            const info = await getAccountLockoutInfo(testUserId)

            expect(info.failedAttempts).toBeGreaterThanOrEqual(5)
            expect(info.isLocked).toBe(true)
            expect(info.lockedUntil).toBeDefined()
            expect(info.lockReason).toBeDefined()
        })
    })

    describe('Manual Unlock', () => {
        it('should manually unlock account', async () => {
            // Lock the account
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    failedLoginAttempts: 5,
                    lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
                    lockReason: 'Test lock',
                },
            })

            // Unlock it
            await unlockAccount(testUserId)

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.failedLoginAttempts).toBe(0)
            expect(user?.lockedUntil).toBeNull()
            expect(user?.lockReason).toBeNull()
        })
    })

    describe('Lock Duration', () => {
        it('should set lock duration based on settings', async () => {
            const before = new Date()

            // Record max attempts to trigger lock
            for (let i = 0; i < 5; i++) {
                await recordFailedAttempt(testUserId)
            }

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.lockedUntil).toBeDefined()

            // Default lock duration is 15 minutes
            const expectedLockUntil = new Date(before.getTime() + 15 * 60 * 1000)
            const actualLockUntil = user!.lockedUntil!

            // Allow 1 second tolerance
            const diff = Math.abs(actualLockUntil.getTime() - expectedLockUntil.getTime())
            expect(diff).toBeLessThan(2000)
        })
    })
})
