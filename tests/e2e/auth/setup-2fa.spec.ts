import { test, expect, Page } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../../.env.local') })

import { prisma } from '../../../lib/prisma'
import { generateTOTPCode, fillTOTPInput } from '../../helpers/totp'

/**
 * E2E Tests for 2FA Setup Flow
 *
 * Tests the complete flow of setting up two-factor authentication:
 * 1. Starting the setup process
 * 2. Scanning QR code / copying secret
 * 3. Entering verification code
 * 4. Viewing and saving backup codes
 * 5. Completing setup
 */

// Test user credentials
const TEST_USER = {
    email: 'testadmin@retry.sk',
    password: 'Hackaton25',
}

// Helper to login
async function loginAsTestUser(page: Page) {
    await page.goto('/admin/login')
    await page.fill('input#login', TEST_USER.email)
    await page.fill('input#password', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|auth\/setup-2fa|auth\/verify-2fa)/, { timeout: 15000 })
}

// Helper to reset 2FA for test user
async function reset2FAForTestUser() {
    await prisma.user.updateMany({
        where: { email: TEST_USER.email },
        data: {
            otpEnabled: false,
            otpSecret: null,
            twoFactorBackupCodes: [],
            twoFactorLastUsedAt: null,
        },
    })
}

test.describe('2FA Setup Flow', () => {
    test.beforeEach(async () => {
        // Reset 2FA before each test
        await reset2FAForTestUser()
    })

    test.afterAll(async () => {
        // Clean up - disable 2FA after all tests
        await reset2FAForTestUser()
        await prisma.$disconnect()
    })

    test('should display setup page with start button', async ({ page }) => {
        await loginAsTestUser(page)

        // Navigate to 2FA setup
        await page.goto('/auth/setup-2fa')

        // Verify page title
        await expect(page.getByTestId('page-title')).toBeVisible()
        await expect(page.getByTestId('page-title')).toContainText('Nastavenie dvojfaktorovej autentifikácie')

        // Verify start button is visible
        await expect(page.getByTestId('start-setup-button')).toBeVisible()
        await expect(page.getByTestId('start-setup-button')).toContainText('Začať nastavenie')
    })

    test('should show QR code and secret after clicking start', async ({ page }) => {
        await loginAsTestUser(page)
        await page.goto('/auth/setup-2fa')

        // Click start setup
        await page.getByTestId('start-setup-button').click()

        // Wait for QR code to appear
        await expect(page.getByTestId('qr-code-image')).toBeVisible({ timeout: 10000 })

        // Verify secret code is displayed
        await expect(page.getByTestId('secret-code')).toBeVisible()

        // Verify TOTP input is displayed
        await expect(page.getByTestId('totp-input-0')).toBeVisible()
    })

    test('should complete full 2FA setup flow', async ({ page }) => {
        await loginAsTestUser(page)
        await page.goto('/auth/setup-2fa')

        // Step 1: Start setup
        await page.getByTestId('start-setup-button').click()

        // Wait for secret to be displayed
        await expect(page.getByTestId('secret-code')).toBeVisible({ timeout: 10000 })

        // Extract secret from the page
        const secret = await page.getByTestId('secret-code').textContent()
        expect(secret).toBeTruthy()

        // Step 2: Generate valid TOTP code and enter it
        const totpCode = generateTOTPCode(secret!)
        await fillTOTPInput(page, totpCode)

        // Wait for verification and backup codes to appear
        await expect(page.getByTestId('backup-codes-display')).toBeVisible({ timeout: 10000 })

        // Verify backup codes are displayed (should have 10 codes)
        await expect(page.getByTestId('backup-code-0')).toBeVisible()
        await expect(page.getByTestId('backup-code-9')).toBeVisible()

        // Step 3: Finish setup
        await expect(page.getByTestId('finish-button')).toBeVisible()
        await page.getByTestId('finish-button').click()

        // Should redirect to dashboard or callback URL
        await page.waitForURL(/\/(dashboard|settings)/, { timeout: 10000 })
    })

    test('should show error for invalid TOTP code', async ({ page }) => {
        await loginAsTestUser(page)
        await page.goto('/auth/setup-2fa')

        // Start setup
        await page.getByTestId('start-setup-button').click()
        await expect(page.getByTestId('secret-code')).toBeVisible({ timeout: 10000 })

        // Enter invalid code
        await fillTOTPInput(page, '000000')

        // Should show error
        await expect(page.getByTestId('totp-input-error')).toBeVisible({ timeout: 5000 })
    })

    test('should redirect to callback URL after setup', async ({ page }) => {
        await loginAsTestUser(page)

        // Navigate to setup with callback URL
        await page.goto('/auth/setup-2fa?callbackUrl=/settings/security')

        // Complete setup
        await page.getByTestId('start-setup-button').click()
        await expect(page.getByTestId('secret-code')).toBeVisible({ timeout: 10000 })

        const secret = await page.getByTestId('secret-code').textContent()
        const totpCode = generateTOTPCode(secret!)
        await fillTOTPInput(page, totpCode)

        await expect(page.getByTestId('finish-button')).toBeVisible({ timeout: 10000 })
        await page.getByTestId('finish-button').click()

        // Should redirect to security settings
        await page.waitForURL(/\/settings\/security/, { timeout: 10000 })
    })

    test('should display copy all codes button', async ({ page }) => {
        await loginAsTestUser(page)
        await page.goto('/auth/setup-2fa')

        // Complete setup to backup codes step
        await page.getByTestId('start-setup-button').click()
        await expect(page.getByTestId('secret-code')).toBeVisible({ timeout: 10000 })

        const secret = await page.getByTestId('secret-code').textContent()
        const totpCode = generateTOTPCode(secret!)
        await fillTOTPInput(page, totpCode)

        await expect(page.getByTestId('backup-codes-display')).toBeVisible({ timeout: 10000 })

        // Verify copy all button is visible
        await expect(page.getByTestId('copy-all-codes-button')).toBeVisible()
        await expect(page.getByTestId('download-codes-button')).toBeVisible()
        await expect(page.getByTestId('print-codes-button')).toBeVisible()
    })
})
