import { test, expect, Page } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../../.env.local') })

import { prisma } from '../../../lib/prisma'
import { generateTOTPCode, fillTOTPInput } from '../../helpers/totp'
import { generateSecret, generateBackupCodes, hashBackupCodes } from '../../../lib/auth/totp'

/**
 * E2E Tests for Security Settings Page
 *
 * Tests the security settings page functionality:
 * 1. Viewing 2FA status (enabled/disabled)
 * 2. Enabling 2FA (redirects to setup)
 * 3. Disabling 2FA
 * 4. Regenerating backup codes
 */

// Test user credentials
const TEST_USER = {
    email: 'testadmin@retry.sk',
    password: 'Hackaton25',
}

// Helper to login
async function loginAsTestUser(page: Page, expectVerify2FA = false) {
    await page.goto('/admin/login')
    await page.fill('input#login', TEST_USER.email)
    await page.fill('input#password', TEST_USER.password)
    await page.click('button[type="submit"]')

    if (expectVerify2FA) {
        // Wait for 2FA verification page
        await page.waitForURL(/\/auth\/verify-2fa/, { timeout: 15000 })
    } else {
        // Wait for dashboard (no 2FA required)
        await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    }
}

// Helper to reset 2FA for test user (allows access to settings without 2FA setup)
async function reset2FAForTestUser(options: { requireSetup?: boolean } = {}) {
    await prisma.user.updateMany({
        where: { email: TEST_USER.email },
        data: {
            otpEnabled: false,
            otpSecret: null,
            twoFactorBackupCodes: [],
            twoFactorLastUsedAt: null,
            // When testing disabled state, don't require 2FA setup
            twoFactorRequired: options.requireSetup ?? false,
        },
    })
}

// Helper to enable 2FA for test user (skipping UI flow)
async function enable2FAForTestUser() {
    const secret = generateSecret()
    const backupCodes = generateBackupCodes(10)
    const hashedCodes = await hashBackupCodes(backupCodes)

    await prisma.user.updateMany({
        where: { email: TEST_USER.email },
        data: {
            otpEnabled: true,
            otpSecret: secret,
            twoFactorBackupCodes: hashedCodes,
            twoFactorLastUsedAt: new Date(),
            twoFactorRequired: true,
        },
    })

    return { secret, backupCodes }
}

// Run tests serially because they all modify the same user
test.describe.configure({ mode: 'serial' })

test.describe('Security Settings Page - 2FA Disabled', () => {
    test.beforeEach(async () => {
        await reset2FAForTestUser()
    })

    test.afterAll(async () => {
        await reset2FAForTestUser()
        await prisma.$disconnect()
    })

    test('should display 2FA disabled status', async ({ page }) => {
        await loginAsTestUser(page)
        await page.goto('/settings/security')

        // Verify page is loaded
        await expect(page.getByTestId('security-settings-page')).toBeVisible()

        // Verify 2FA is shown as disabled (yellow warning icon/text)
        await expect(page.getByText('2FA nie je zapnutá')).toBeVisible()

        // Verify enable button is visible
        await expect(page.getByTestId('enable-2fa-button')).toBeVisible()
    })

    test('should redirect to 2FA setup when clicking enable', async ({ page }) => {
        await loginAsTestUser(page)
        await page.goto('/settings/security')

        // Click enable 2FA button
        await page.getByTestId('enable-2fa-button').click()

        // Should redirect to setup page with callback URL
        await page.waitForURL(/\/auth\/setup-2fa/, { timeout: 10000 })
        expect(page.url()).toContain('callbackUrl')
    })
})

test.describe('Security Settings Page - 2FA Enabled', () => {
    let testSecret: string

    test.beforeEach(async () => {
        // Enable 2FA before each test
        const { secret } = await enable2FAForTestUser()
        testSecret = secret
    })

    test.afterEach(async () => {
        await reset2FAForTestUser()
    })

    test.afterAll(async () => {
        await prisma.$disconnect()
    })

    test('should display 2FA enabled status', async ({ page }) => {
        // Login - will redirect to 2FA verification
        await loginAsTestUser(page, true)

        // Verify 2FA
        const totpCode = generateTOTPCode(testSecret)
        await fillTOTPInput(page, totpCode)
        await page.waitForURL(/\/dashboard/, { timeout: 10000 })

        await page.goto('/settings/security')

        // Verify page is loaded
        await expect(page.getByTestId('security-settings-page')).toBeVisible()

        // Verify 2FA is shown as enabled (green check icon/text)
        await expect(page.getByText('2FA je zapnutá')).toBeVisible()

        // Verify disable button is visible
        await expect(page.getByTestId('disable-2fa-button')).toBeVisible()

        // Verify regenerate codes button is visible
        await expect(page.getByTestId('regenerate-codes-button')).toBeVisible()
    })

    test('should show confirmation dialog when clicking disable', async ({ page }) => {
        // Login - will redirect to 2FA verification
        await loginAsTestUser(page, true)

        // Verify 2FA
        const totpCode = generateTOTPCode(testSecret)
        await fillTOTPInput(page, totpCode)
        await page.waitForURL(/\/dashboard/, { timeout: 10000 })

        await page.goto('/settings/security')

        // Click disable button
        await page.getByTestId('disable-2fa-button').click()

        // Should show confirmation
        await expect(page.getByText('Naozaj vypnúť?')).toBeVisible()
        await expect(page.getByTestId('confirm-disable-button')).toBeVisible()
        await expect(page.getByTestId('cancel-disable-button')).toBeVisible()
    })

    test('should cancel disable confirmation', async ({ page }) => {
        // Login - will redirect to 2FA verification
        await loginAsTestUser(page, true)

        // Verify 2FA
        const totpCode = generateTOTPCode(testSecret)
        await fillTOTPInput(page, totpCode)
        await page.waitForURL(/\/dashboard/, { timeout: 10000 })

        await page.goto('/settings/security')

        // Click disable, then cancel
        await page.getByTestId('disable-2fa-button').click()
        await expect(page.getByTestId('cancel-disable-button')).toBeVisible()
        await page.getByTestId('cancel-disable-button').click()

        // Confirmation should disappear
        await expect(page.getByText('Naozaj vypnúť?')).not.toBeVisible()

        // Original disable button should be visible again
        await expect(page.getByTestId('disable-2fa-button')).toBeVisible()
    })

    test('should disable 2FA when confirming', async ({ page }) => {
        // Login - will redirect to 2FA verification
        await loginAsTestUser(page, true)

        // Verify 2FA
        const totpCode = generateTOTPCode(testSecret)
        await fillTOTPInput(page, totpCode)
        await page.waitForURL(/\/dashboard/, { timeout: 10000 })

        await page.goto('/settings/security')

        // Click disable, then confirm
        await page.getByTestId('disable-2fa-button').click()
        await page.getByTestId('confirm-disable-button').click()

        // Should show success toast and update UI
        await expect(page.getByText('2FA bola úspešne vypnutá')).toBeVisible({ timeout: 5000 })

        // UI should show 2FA as disabled
        await expect(page.getByText('2FA nie je zapnutá')).toBeVisible({ timeout: 5000 })
        await expect(page.getByTestId('enable-2fa-button')).toBeVisible()
    })

    test('should regenerate backup codes', async ({ page }) => {
        // Login - will redirect to 2FA verification
        await loginAsTestUser(page, true)

        // Verify 2FA
        const totpCode = generateTOTPCode(testSecret)
        await fillTOTPInput(page, totpCode)
        await page.waitForURL(/\/dashboard/, { timeout: 10000 })

        await page.goto('/settings/security')

        // Click regenerate codes
        await page.getByTestId('regenerate-codes-button').click()

        // Should show modal with new backup codes
        await expect(page.getByRole('heading', { name: 'Nové záložné kódy' })).toBeVisible({ timeout: 10000 })
        await expect(page.getByTestId('backup-code-0')).toBeVisible()

        // Close modal
        await page.getByTestId('close-backup-codes-button').click()

        // Modal should close
        await expect(page.getByRole('heading', { name: 'Nové záložné kódy' })).not.toBeVisible()
    })
})
