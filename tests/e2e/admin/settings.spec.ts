import { test, expect } from '@playwright/test'
import { loginAsSuperadmin, loginAsAdmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

const DEFAULTS = {
  maxFailedAttempts: 5,
  blockDurationMinutes: 15,
  blockWindowMinutes: 15,
}

test.describe('Security Settings Administration @admin @settings', () => {
  let settingsId: string
  let originalValues: {
    maxFailedAttempts: number
    blockDurationMinutes: number
    blockWindowMinutes: number
    updatedById: string | null
  } | null = null
  let superadminId: string
  let settingsExisted = false

  test.beforeAll(async () => {
    await prisma.$connect()

    const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } })
    if (!superadmin) {
      throw new Error('No superadmin found in database')
    }
    superadminId = superadmin.id

    const existing = await prisma.securitySettings.findFirst()
    if (existing) {
      settingsExisted = true
      settingsId = existing.id
      originalValues = {
        maxFailedAttempts: existing.maxFailedAttempts,
        blockDurationMinutes: existing.blockDurationMinutes,
        blockWindowMinutes: existing.blockWindowMinutes,
        updatedById: existing.updatedById,
      }

      await prisma.securitySettings.update({
        where: { id: existing.id },
        data: {
          ...DEFAULTS,
          updatedById: superadmin.id,
        },
      })
    } else {
      const created = await prisma.securitySettings.create({
        data: {
          ...DEFAULTS,
          updatedById: superadmin.id,
        },
      })
      settingsId = created.id
      originalValues = null
    }
  })

  test.afterAll(async () => {
    if (settingsId) {
      if (settingsExisted) {
        await prisma.securitySettings.update({
          where: { id: settingsId },
          data: {
            maxFailedAttempts: originalValues!.maxFailedAttempts,
            blockDurationMinutes: originalValues!.blockDurationMinutes,
            blockWindowMinutes: originalValues!.blockWindowMinutes,
            updatedById: originalValues!.updatedById,
          },
        })
      } else {
        await prisma.securitySettings.delete({ where: { id: settingsId } }).catch(() => {})
      }
    }

    await prisma.$disconnect()
  })

  test('superadmin sees settings navigation and can update values', async ({ page }) => {
    await loginAsSuperadmin(page)

    const settingsLink = page.getByRole('link', { name: 'Nastavenia' })
    await expect(settingsLink).toBeVisible()

    await settingsLink.click()
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByTestId('settings-page')).toBeVisible()

    await expect(page.getByTestId('input-max-failed-attempts')).toHaveValue(String(DEFAULTS.maxFailedAttempts))
    await expect(page.getByTestId('input-block-duration')).toHaveValue(String(DEFAULTS.blockDurationMinutes))
    await expect(page.getByTestId('input-block-window')).toHaveValue(String(DEFAULTS.blockWindowMinutes))

    await page.getByTestId('input-max-failed-attempts').fill('7')
    await page.getByTestId('input-block-duration').fill('30')
    await page.getByTestId('input-block-window').fill('20')

    await page.getByTestId('submit-security-settings').click()

    await expect(page.getByText('Nastavenia boli aktualizované')).toBeVisible({ timeout: 5000 })

    await expect(page.getByTestId('input-max-failed-attempts')).toHaveValue('7')
    await expect(page.getByTestId('input-block-duration')).toHaveValue('30')
    await expect(page.getByTestId('input-block-window')).toHaveValue('20')

    const stored = await prisma.securitySettings.findUnique({ where: { id: settingsId } })
    expect(stored).toBeTruthy()
    expect(stored?.maxFailedAttempts).toBe(7)
    expect(stored?.blockDurationMinutes).toBe(30)
    expect(stored?.blockWindowMinutes).toBe(20)

    // Reset to defaults for subsequent tests
    await prisma.securitySettings.update({
      where: { id: settingsId },
      data: {
        ...DEFAULTS,
        updatedById: superadminId,
      },
    })
  })

  test('admin does not see settings navigation and cannot access page', async ({ page }) => {
    await loginAsAdmin(page)

    const navLink = page.getByRole('link', { name: 'Nastavenia' })
    await expect(navLink).toHaveCount(0)

    await page.goto('/settings')
    await expect(page).toHaveURL(/\/unauthorized$/)
  })
})
