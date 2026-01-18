import { test, expect } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') })

import { prisma } from '../../lib/prisma'

test.describe('Redirect Test', () => {
    test.beforeAll(async () => {
        // Reset 2FA for testadmin (keep twoFactorRequired as is)
        await prisma.user.updateMany({
            where: { email: 'testadmin@retry.sk' },
            data: {
                otpEnabled: false,
                otpSecret: null,
                twoFactorBackupCodes: [],
                twoFactorLastUsedAt: null,
            },
        })
    })

    test('should login testadmin and see redirect', async ({ page }) => {
        // Enable request/response logging
        page.on('request', request => {
            console.log('>> Request:', request.method(), request.url())
        })
        page.on('response', response => {
            console.log('<< Response:', response.status(), response.url())
        })

        await page.goto('/admin/login')
        await page.fill('input#login', 'testadmin@retry.sk')
        await page.fill('input#password', 'Hackaton25')

        console.log('--- Clicking submit ---')
        await page.click('button[type="submit"]')

        // Wait for any navigation
        await page.waitForTimeout(5000)

        console.log('--- Final URL:', page.url())
        console.log('--- Page title:', await page.title())

        // Take screenshot
        await page.screenshot({ path: 'test-results/redirect-test.png' })
    })

    test.afterAll(async () => {
        await prisma.$disconnect()
    })
})
