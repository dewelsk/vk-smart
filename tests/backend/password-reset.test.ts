import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
    generatePasswordResetToken,
    verifyResetToken,
    verifyPasswordResetToken,
    validatePasswordStrength,
    changePassword,
    setNewPassword,
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
        const hashedPassword = await bcrypt.hash('OldPassword123!', 10)
        await prisma.user.update({
            where: { id: testUserId },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
                mustChangePassword: false,
            },
        })
    })

    describe('Password Validation', () => {
        it('should accept valid password', () => {
            const result = validatePasswordStrength('ValidPass123!')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject password without uppercase', () => {
            const result = validatePasswordStrength('validpass123!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Heslo musí obsahovať aspoň jedno veľké písmeno')
        })

        it('should reject password without lowercase', () => {
            const result = validatePasswordStrength('VALIDPASS123!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Heslo musí obsahovať aspoň jedno malé písmeno')
        })

        it('should reject password without number', () => {
            const result = validatePasswordStrength('ValidPassword!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Heslo musí obsahovať aspoň jedno číslo')
        })

        it('should reject password without special character', () => {
            const result = validatePasswordStrength('ValidPass123')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Heslo musí obsahovať aspoň jeden špeciálny znak')
        })

        it('should reject short password', () => {
            const result = validatePasswordStrength('Val1!')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Heslo musí mať aspoň 8 znakov')
        })

        it('should return strength indicator', () => {
            // Weak (8-9 chars)
            const weak = validatePasswordStrength('Valid1!a')
            expect(weak.isValid).toBe(true)
            expect(weak.strength).toBe('weak')

            // Medium (10-11 chars)
            const medium = validatePasswordStrength('Valid1!abc')
            expect(medium.isValid).toBe(true)
            expect(medium.strength).toBe('medium')

            // Strong (12+ chars)
            const strong = validatePasswordStrength('Valid1!abcdef')
            expect(strong.isValid).toBe(true)
            expect(strong.strength).toBe('strong')
        })
    })

    describe('Reset Token Generation', () => {
        it('should generate reset token', async () => {
            const result = await generatePasswordResetToken(testUserId)

            expect(result.token).toBeDefined()
            expect(typeof result.token).toBe('string')
            expect(result.token.length).toBeGreaterThan(0)
            expect(result.expiry).toBeInstanceOf(Date)

            // Verify token was saved to database
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.passwordResetToken).toBeDefined()
            expect(user?.passwordResetExpiry).toBeDefined()
        })

        it('should set expiry time correctly (24 hours)', async () => {
            const before = new Date()
            const result = await generatePasswordResetToken(testUserId)

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.passwordResetExpiry).toBeDefined()

            // Default expiry is 24 hours
            const expectedExpiry = new Date(before.getTime() + 24 * 60 * 60 * 1000)
            const actualExpiry = user!.passwordResetExpiry!

            // Allow 2 second tolerance
            const diff = Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())
            expect(diff).toBeLessThan(2000)
        })

        it('should generate unique tokens', async () => {
            const result1 = await generatePasswordResetToken(testUserId)

            // Wait a bit to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10))

            const result2 = await generatePasswordResetToken(testUserId)

            expect(result1.token).not.toBe(result2.token)
        })
    })

    describe('Reset Token Verification', () => {
        it('should verify valid token and return userId with tokenType', async () => {
            const { token } = await generatePasswordResetToken(testUserId)

            const result = await verifyResetToken(token)

            expect(result).not.toBeNull()
            expect(result?.userId).toBe(testUserId)
            expect(result?.tokenType).toBe('reset')
        })

        it('should verify valid token with verifyPasswordResetToken', async () => {
            const { token } = await generatePasswordResetToken(testUserId)

            const userId = await verifyPasswordResetToken(token)

            expect(userId).toBe(testUserId)
        })

        it('should reject invalid token', async () => {
            const result = await verifyResetToken('invalid-token-123')

            expect(result).toBeNull()
        })

        it('should reject expired token', async () => {
            // Create token with past expiry
            const token = 'expired-token-' + Date.now()
            await prisma.user.update({
                where: { id: testUserId },
                data: {
                    passwordResetToken: token,
                    passwordResetExpiry: new Date(Date.now() - 1000), // 1 second ago
                },
            })

            const result = await verifyResetToken(token)

            expect(result).toBeNull()
        })

        it('should NOT clear token after verification (token cleared by setNewPassword)', async () => {
            const { token } = await generatePasswordResetToken(testUserId)

            // Verify token
            await verifyResetToken(token)

            // Token should still be valid (not cleared by verify)
            const result = await verifyResetToken(token)

            expect(result).not.toBeNull()
            expect(result?.userId).toBe(testUserId)
        })
    })

    describe('Set New Password (via token)', () => {
        it('should set new password and clear reset token', async () => {
            const { token } = await generatePasswordResetToken(testUserId)
            const newPassword = 'NewPassword123!'

            await setNewPassword(testUserId, newPassword, 'reset')

            // Verify password was changed
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.password).toBeDefined()

            // Verify new password works
            const isValid = await bcrypt.compare(newPassword, user!.password!)
            expect(isValid).toBe(true)

            // Verify token was cleared
            expect(user?.passwordResetToken).toBeNull()
            expect(user?.passwordResetExpiry).toBeNull()
        })

        it('should update passwordChangedAt timestamp', async () => {
            const before = new Date()
            await new Promise(resolve => setTimeout(resolve, 10))

            await setNewPassword(testUserId, 'NewPassword123!', 'reset')

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

            await setNewPassword(testUserId, 'NewPassword123!', 'reset')

            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            expect(user?.mustChangePassword).toBe(false)
        })

        it('should reject invalid password', async () => {
            await expect(
                setNewPassword(testUserId, 'weak', 'reset')
            ).rejects.toThrow()
        })
    })

    describe('Change Password (for logged-in users)', () => {
        it('should change password with correct old password', async () => {
            const oldPassword = 'OldPassword123!'
            const newPassword = 'NewPassword456!'

            await changePassword(testUserId, oldPassword, newPassword)

            // Verify password was changed
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            const isValid = await bcrypt.compare(newPassword, user!.password!)
            expect(isValid).toBe(true)
        })

        it('should reject wrong old password', async () => {
            await expect(
                changePassword(testUserId, 'WrongPassword123!', 'NewPassword456!')
            ).rejects.toThrow('Current password is incorrect')
        })

        it('should allow password change without old password when mustChangePassword is true', async () => {
            // Set mustChangePassword flag
            await prisma.user.update({
                where: { id: testUserId },
                data: { mustChangePassword: true },
            })

            // Should work without old password
            await changePassword(testUserId, null, 'NewPassword456!')

            // Verify password was changed
            const user = await prisma.user.findUnique({
                where: { id: testUserId },
            })

            const isValid = await bcrypt.compare('NewPassword456!', user!.password!)
            expect(isValid).toBe(true)
        })

        it('should reject invalid new password', async () => {
            await expect(
                changePassword(testUserId, 'OldPassword123!', 'weak')
            ).rejects.toThrow()
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
