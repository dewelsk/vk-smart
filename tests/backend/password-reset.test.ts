import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    generateResetToken,
    verifyResetToken,
    validatePassword,
    changePassword,
} from '@/lib/auth/password-reset'

describe('Password Reset', () => {
    let testUserId: string
    let testUserEmail: string

    // Setup - create test user
    beforeAll(async () => {
        await prisma.$connect()

        const hashedPassword = await bcrypt.hash('OldPassword123!', 10)
        const testUser = await prisma.user.create({
            data: {
                username: 'testpwreset_' + Date.now(),
                email: `testpwreset_${Date.now()}@example.com`,
                password: hashedPassword,
                name: 'Test',
                surname: 'Reset',
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

    // Reset user state before each test
    beforeEach(async () => {
        await prisma.user.update({
            where: { id: testUserId },
            data: {
                passwordResetToken: null,
                passwordResetExpiry: null,
                mustChangePassword: false,
            },
        })
    })

    describe('Password Validation', () => {
        it('should accept valid password', () => {
            const result = validatePassword('ValidPass123!')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject password without uppercase', () => {
            const result = validatePassword('validpass123!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one uppercase letter')
        })

        it('should reject password without lowercase', () => {
            const result = validatePassword('VALIDPASS123!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one lowercase letter')
        })

        it('should reject password without number', () => {
            const result = validatePassword('ValidPassword!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one number')
        })

        it('should reject password without special character', () => {
            const result = validatePassword('ValidPass123')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must contain at least one special character')
        })

        it('should reject short password', () => {
            const result = validatePassword('Val1!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must be at least 8 characters long')
        })

        it('should reject very long password', () => {
            const longPassword = 'A'.repeat(129) + '1!'

            const result = validatePassword(longPassword)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Password must not exceed 128 characters')
        })
    })

    describe('Reset Token Generation', () => {
        it('should generate reset token', async () => {
            const token = await generateResetToken(testUserId)

            expect(token).toBeDefined()
            expect(typeof token).toBe('string')
            expect(token.length).toBeGreaterThan(0)

            // Verify token was saved to database
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.passwordResetToken).toBeDefined()
            expect(user?.passwordResetExpiry).toBeDefined()
        })

        it('should set expiry time correctly', async () => {
            const before = new Date()
            await generateResetToken(testUserId)

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.passwordResetExpiry).toBeDefined()

            // Default expiry is 1 hour
            const expectedExpiry = new Date(before.getTime() + 60 * 60 * 1000)
            const actualExpiry = user!.passwordResetExpiry!

            // Allow 1 second tolerance
            const diff = Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())
            expect(diff).toBeLessThan(2000)
        })

        it('should generate unique tokens', async () => {
            const token1 = await generateResetToken(testUserId)

            // Wait a bit to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10))

            const token2 = await generateResetToken(testUserId)

            expect(token1).not.toBe(token2)
        })
    })

    describe('Reset Token Verification', () => {
        it('should verify valid token', async () => {
            const token = await generateResetToken(testUserId)

            const userId = await verifyResetToken(token)

            expect(userId).toBe(testUserId)
        })

        it('should reject invalid token', async () => {
            const userId = await verifyResetToken('invalid-token-123')

            expect(userId).toBeNull()
        })

        it('should reject expired token', async () => {
            // Create token with past expiry
            const token = 'expired-token-' + Date.now()
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    passwordResetToken: await bcrypt.hash(token, 10),
                    passwordResetExpiry: new Date(Date.now() - 1000), // 1 second ago
                },
            })

            const userId = await verifyResetToken(token)

            expect(userId).toBeNull()
        })

        it('should clear token after verification', async () => {
            const token = await generateResetToken(testUserId)

            await verifyResetToken(token)

            // Try to use same token again
            const userId = await verifyResetToken(token)

            expect(userId).toBeNull()
        })
    })

    describe('Password Change', () => {
        it('should change password successfully', async () => {
            const newPassword = 'NewPassword123!'

            const result = await changePassword(testUserId, newPassword)

            expect(result.success).toBe(true)

            // Verify password was changed
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.password).toBeDefined()

            // Verify new password works
            const isValid = await bcrypt.compare(newPassword, user!.password!)
            expect(isValid).toBe(true)
        })

        it('should update passwordChangedAt timestamp', async () => {
            const before = new Date()
            await new Promise(resolve => setTimeout(resolve, 10))

            await changePassword(testUserId, 'NewPassword123!')

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.passwordChangedAt).toBeDefined()
            expect(user!.passwordChangedAt! > before).toBe(true)
        })

        it('should clear mustChangePassword flag', async () => {
            // Set flag first
            await prisma.user.update({
                where: { id: testUserId },
                data: { mustChangePassword: true },
            })

            await changePassword(testUserId, 'NewPassword123!')

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.mustChangePassword).toBe(false)
        })

        it('should reject invalid password', async () => {
            const result = await changePassword(testUserId, 'weak')

            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })

        it('should clear reset token after password change', async () => {
            // Generate reset token
            await generateResetToken(testUserId)

            // Change password
            await changePassword(testUserId, 'NewPassword123!')

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.passwordResetToken).toBeNull()
            expect(user?.passwordResetExpiry).toBeNull()
        })
    })

    describe('Must Change Password Flag', () => {
        it('should set mustChangePassword flag', async () => {
            const updated = await prisma.user.update({
                where: { id: testUserId },
                data: { mustChangePassword: true },
            })

            expect(updated.mustChangePassword).toBe(true)
        })

        it('should query users who must change password', async () => {
            await prisma.user.update({
                where: { id: testUserId },
                data: { mustChangePassword: true },
            })

            const users = await prisma.user.findMany({
                where: { mustChangePassword: true },
            })

            expect(users.length).toBeGreaterThan(0)
            expect(users.some(u => u.id === testUserId)).toBe(true)
        })
    })
})
