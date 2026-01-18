import { test, expect } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') })

import { prisma } from '../../lib/prisma'

test.describe('Prisma testadmin status', () => {
    test('should check testadmin 2FA status', async () => {
        const user = await prisma.user.findFirst({
            where: { email: 'testadmin@retry.sk' },
            select: {
                email: true,
                twoFactorRequired: true,
                otpEnabled: true,
                otpSecret: true,
                mustChangePassword: true,
            }
        })
        console.log('testadmin user:', JSON.stringify(user, null, 2))
        expect(user).not.toBeNull()
    })

    test('should check superadmin 2FA status', async () => {
        const user = await prisma.user.findFirst({
            where: { email: 'superadmin@retry.sk' },
            select: {
                email: true,
                twoFactorRequired: true,
                otpEnabled: true,
                otpSecret: true,
                mustChangePassword: true,
            }
        })
        console.log('superadmin user:', JSON.stringify(user, null, 2))
        expect(user).not.toBeNull()
    })

    test.afterAll(async () => {
        await prisma.$disconnect()
    })
})
