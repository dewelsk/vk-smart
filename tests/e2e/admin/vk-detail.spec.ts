import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('VK Detail @admin @vk @smoke', () => {
  let testVkId: string | null = null

  test.beforeAll(async () => {
    // Get an existing VK from database instead of creating one
    await prisma.$connect()

    const existingVk = await prisma.vyberoveKonanie.findFirst({
      where: {
        status: 'PRIPRAVA'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!existingVk) {
      throw new Error('No VK found in database - run seed first')
    }

    testVkId = existingVk.id
    console.log('Using existing VK for test:', existingVk.identifier, 'ID:', testVkId)
    await prisma.$disconnect()
  })

  test('should load VK detail page successfully', async ({ page }) => {
    await loginAsSuperadmin(page)

    console.log('Navigating to VK detail:', testVkId)
    // Navigate to VK detail page
    await page.goto(`/vk/${testVkId}`)

    // Wait a bit and check what's on the page
    await page.waitForTimeout(2000)

    // Take screenshot for debugging
    await page.screenshot({ path: 'vk-detail-debug.png', fullPage: true })

    // Verify VK detail page loaded
    await expect(page.getByTestId('vk-detail-page')).toBeVisible({ timeout: 10000 })

    // Verify VK identifier is displayed
    await expect(page.getByTestId('vk-identifier')).toBeVisible({ timeout: 5000 })
  })

  test('should display VK basic information', async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto(`/vk/${testVkId}`)

    await expect(page.getByTestId('vk-detail-page')).toBeVisible()

    // Check that basic VK info is displayed
    await expect(page.getByTestId('vk-identifier')).toBeVisible()
  })
})
