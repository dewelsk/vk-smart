import { test, expect } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') })

import { prisma } from '../../lib/prisma'

test.describe('Prisma Connection Test', () => {
    test('should connect to database', async () => {
        // Try to query users
        const users = await prisma.user.findMany({ take: 1 })
        console.log('Found users:', users.length)
        expect(users).toBeDefined()
    })

    test('should find testadmin user', async () => {
        const user = await prisma.user.findFirst({
            where: { email: 'testadmin@retry.sk' }
        })
        console.log('testadmin user:', user ? 'found' : 'NOT FOUND')
        console.log('otpEnabled:', user?.otpEnabled)
        expect(user).not.toBeNull()
    })

    test.afterAll(async () => {
        await prisma.$disconnect()
    })
})
