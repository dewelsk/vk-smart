import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    generateSecret,
    verifyToken,
    generateBackupCodes,
    hashBackupCodes,
    verifyBackupCode,
} from '@/lib/auth/totp'

describe('2FA Authentication', () => {
    let testUserId: string
    let testUserEmail: string

    // Setup - create test user
    beforeAll(async () => {
        await prisma.$connect()

        const hashedPassword = await bcrypt.hash('TestPassword123!', 10)
        const testUser = await prisma.user.create({
            data: {
                username: 'test2fa_' + Date.now(),
                email: `test2fa_${Date.now()}@example.com`,
                password: hashedPassword,
                name: 'Test',
                surname: 'User',
                role: 'ADMIN',
            },
        })
        testUserId = testUser.id
        testUserEmail = testUser.email!
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

    describe('TOTP Secret Generation', () => {
        it('should generate a valid TOTP secret', () => {
            const secret = generateSecret()

            expect(secret).toBeDefined()
            expect(typeof secret).toBe('string')
            expect(secret.length).toBeGreaterThan(0)
        })

        it('should generate unique secrets', () => {
            const secret1 = generateSecret()
            const secret2 = generateSecret()

            expect(secret1).not.toBe(secret2)
        })
    })

    describe('TOTP Token Verification', () => {
        it('should verify valid TOTP token', () => {
            const secret = generateSecret()
            const authenticator = require('otplib').authenticator

            // Generate a valid token
            const token = authenticator.generate(secret)

            // Verify it
            const isValid = verifyToken(secret, token)

            expect(isValid).toBe(true)
        })

        it('should reject invalid TOTP token', () => {
            const secret = generateSecret()
            const invalidToken = '000000'

            const isValid = verifyToken(secret, invalidToken)

            expect(isValid).toBe(false)
        })

        it('should reject token with wrong secret', () => {
            const secret1 = generateSecret()
            const secret2 = generateSecret()
            const authenticator = require('otplib').authenticator

            const token = authenticator.generate(secret1)
            const isValid = verifyToken(secret2, token)

            expect(isValid).toBe(false)
        })
    })

    describe('Backup Codes', () => {
        it('should generate backup codes', () => {
            const codes = generateBackupCodes(10)

            expect(codes).toBeDefined()
            expect(Array.isArray(codes)).toBe(true)
            expect(codes.length).toBe(10)
            codes.forEach(code => {
                expect(typeof code).toBe('string')
                expect(code.length).toBeGreaterThan(0)
            })
        })

        it('should generate unique backup codes', () => {
            const codes = generateBackupCodes(10)
            const uniqueCodes = new Set(codes)

            expect(uniqueCodes.size).toBe(codes.length)
        })

        it('should hash backup codes', async () => {
            const codes = generateBackupCodes(5)
            const hashed = await hashBackupCodes(codes)

            expect(hashed).toBeDefined()
            expect(Array.isArray(hashed)).toBe(true)
            expect(hashed.length).toBe(5)
            hashed.forEach(hash => {
                expect(typeof hash).toBe('string')
                expect(hash).not.toBe(codes[0]) // Verify it's actually hashed
            })
        })

        it('should verify backup code against hashed codes', async () => {
            const codes = generateBackupCodes(5)
            const hashed = await hashBackupCodes(codes)

            // Test first code
            const index = await verifyBackupCode(hashed, codes[0])

            expect(index).toBe(0)
        })

        it('should return -1 for invalid backup code', async () => {
            const codes = generateBackupCodes(5)
            const hashed = await hashBackupCodes(codes)

            const index = await verifyBackupCode(hashed, 'invalid-code')

            expect(index).toBe(-1)
        })
    })

    describe('2FA Setup and Verification', () => {
        afterEach(async () => {
            // Reset 2FA for test user
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    otpSecret: null,
                    otpEnabled: false,
                    twoFactorBackupCodes: [],
                    twoFactorLastUsedAt: null,
                },
            })
        })

        it('should enable 2FA for user', async () => {
            const secret = generateSecret()
            const backupCodes = generateBackupCodes(10)
            const hashedCodes = await hashBackupCodes(backupCodes)

            const updated = await prisma.user.update({
                where: { id: testUserId },
                data: {
                    otpSecret: secret,
                    otpEnabled: true,
                    twoFactorBackupCodes: hashedCodes,
                    twoFactorLastUsedAt: new Date(),
                },
            })

            expect(updated.otpSecret).toBe(secret)
            expect(updated.otpEnabled).toBe(true)
            expect(updated.twoFactorBackupCodes.length).toBe(10)
            expect(updated.twoFactorLastUsedAt).toBeDefined()
        })

        it('should disable 2FA for user', async () => {
            // First enable it
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    otpSecret: generateSecret(),
                    otpEnabled: true,
                    twoFactorBackupCodes: ['hash1', 'hash2'],
                },
            })

            // Then disable
            const updated = await prisma.user.update({
                where: { id: testUserId },
                data: {
                    otpSecret: null,
                    otpEnabled: false,
                    twoFactorBackupCodes: [],
                    twoFactorLastUsedAt: null,
                },
            })

            expect(updated.otpSecret).toBeNull()
            expect(updated.otpEnabled).toBe(false)
            expect(updated.twoFactorBackupCodes.length).toBe(0)
        })

        it('should update last used timestamp', async () => {
            const before = new Date()
            await new Promise(resolve => setTimeout(resolve, 10))

            const updated = await prisma.user.update({
                where: { id: testUserId },
                data: { twoFactorLastUsedAt: new Date() },
            })

            expect(updated.twoFactorLastUsedAt).toBeDefined()
            expect(updated.twoFactorLastUsedAt! > before).toBe(true)
        })
    })

    describe('2FA Required Flag', () => {
        afterEach(async () => {
            await prisma.user.update({
                where: { id: testUserId },
                data: { twoFactorRequired: false },
            })
        })

        it('should set 2FA as required for ADMIN users', async () => {
            const updated = await prisma.user.update({
                where: { id: testUserId },
                data: { twoFactorRequired: true },
            })

            expect(updated.twoFactorRequired).toBe(true)
        })

        it('should query users with 2FA required', async () => {
            await prisma.user.update({
                where: { id: testUserId },
                data: { twoFactorRequired: true },
            })

            const users = await prisma.user.findMany({
                where: { twoFactorRequired: true },
            })

            expect(users.length).toBeGreaterThan(0)
            expect(users.some(u => u.id === testUserId)).toBe(true)
        })
    })
})
