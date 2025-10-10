import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('VK Test Assignment', () => {
  let vkId: string
  let testId: string
  let institutionId: string
  let userId: string

  test.beforeAll(async () => {
    await prisma.$connect()

    // Get existing resources
    const institution = await prisma.institution.findFirst()
    if (!institution) throw new Error('No institution found')
    institutionId = institution.id

    // Get superadmin user for createdBy
    const user = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })
    if (!user) throw new Error('No superadmin user found')
    userId = user.id

    // Create test VK in PRIPRAVA status with unique identifier
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: 'VK/2025/E2E-' + Date.now() + '-' + Math.random().toString(36).substring(7),
        selectionType: 'širšie vnútorné výberové konanie',
        organizationalUnit: 'Test Unit',
        serviceField: 'IT',
        position: 'Test Position',
        serviceType: 'stála štátna služba',
        date: new Date(),
        status: 'PRIPRAVA',
        institution: {
          connect: { id: institutionId }
        },
        createdBy: {
          connect: { id: userId }
        }
      }
    })
    vkId = vk.id

    // Get first approved test
    const test = await prisma.test.findFirst({
      where: { approved: true }
    })
    if (test) {
      testId = test.id
    }
  })

  test.afterAll(async () => {
    // Cleanup VK (cascade deletes VKTests)
    if (vkId) {
      await prisma.vyberoveKonanie.delete({
        where: { id: vkId }
      })
    }
    await prisma.$disconnect()
  })

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto(`http://localhost:5600/vk/${vkId}`)
    await page.waitForLoadState('networkidle')

    // Click on Tests tab
    await page.getByTestId('tests-tab').click()
    await page.waitForLoadState('networkidle')
  })

  test('should display VK tests tab', async ({ page }) => {
    await expect(page.getByTestId('tests-tab-content')).toBeVisible()
    await expect(page.getByTestId('add-test-button')).toBeVisible()
  })

  test('should show empty state when no tests assigned', async ({ page }) => {
    const cards = await page.locator('[data-testid^="test-assignment-card-"]').count()

    if (cards === 0) {
      await expect(page.locator('text=Zatiaľ nie sú priradené žiadne testy')).toBeVisible()
    }
  })

  test('should open add test modal', async ({ page }) => {
    await page.getByTestId('add-test-button').click()

    await expect(page.locator('text=Pridať test k VK')).toBeVisible()
    await expect(page.getByTestId('test-select')).toBeVisible()
  })

  test('should close modal on cancel', async ({ page }) => {
    await page.getByTestId('add-test-button').click()
    await expect(page.locator('text=Pridať test k VK')).toBeVisible()

    await page.getByTestId('cancel-button').click()
    await expect(page.locator('text=Pridať test k VK')).not.toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.getByTestId('add-test-button').click()

    // Try to save without selecting test
    await page.getByTestId('save-test-button').click()

    // Should show error toast
    await expect(page.locator('[role="status"]:has-text("Vyberte test")')).toBeVisible()
  })


  test('should successfully add test', async ({ page }) => {
    if (!testId) {
      test.skip()
      return
    }

    await page.getByTestId('add-test-button').click()

    // Select test (configuration is auto-filled from test)
    await page.getByTestId('test-select').selectOption(testId)

    await page.getByTestId('save-test-button').click()

    // Wait for success message
    await expect(page.locator('text=Test bol úspešne pridaný')).toBeVisible()

    // Verify test card appears
    await expect(page.getByTestId('test-assignment-card-1')).toBeVisible()
  })

  test('should display test details in card', async ({ page }) => {
    // Check if at least one test is assigned
    const firstCard = page.getByTestId('test-assignment-card-1')

    if (await firstCard.isVisible()) {
      // Verify card contains details
      await expect(firstCard.locator('text=/Test #1/')).toBeVisible()
      await expect(firstCard.locator('text=/Počet otázok/')).toBeVisible()
      await expect(firstCard.locator('text=/Trvanie/')).toBeVisible()
      await expect(firstCard.locator('text=/Bodovanie/')).toBeVisible()
      await expect(firstCard.locator('text=/Min\\. skóre/')).toBeVisible()

      // Verify delete button
      await expect(page.getByTestId('delete-test-button-1')).toBeVisible()
    }
  })


  test('should show delete confirmation modal', async ({ page }) => {
    const firstCard = page.getByTestId('test-assignment-card-1')

    if (await firstCard.isVisible()) {
      await page.getByTestId('delete-test-button-1').click()

      // Verify confirmation modal appears
      await expect(page.locator('text=Odstrániť test')).toBeVisible()
      await expect(page.locator('text=Naozaj chcete odstrániť tento test z VK?')).toBeVisible()
    }
  })

  test('should cancel delete on confirmation modal', async ({ page }) => {
    const firstCard = page.getByTestId('test-assignment-card-1')

    if (await firstCard.isVisible()) {
      await page.getByTestId('delete-test-button-1').click()
      await expect(page.locator('text=Odstrániť test')).toBeVisible()

      // Click cancel
      await page.locator('button:has-text("Zrušiť")').click()

      // Verify card still exists
      await expect(page.getByTestId('test-assignment-card-1')).toBeVisible()
    }
  })

  test('should successfully delete test', async ({ page }) => {
    const firstCard = page.getByTestId('test-assignment-card-1')

    if (await firstCard.isVisible()) {
      await page.getByTestId('delete-test-button-1').click()

      // Confirm delete
      await page.locator('button:has-text("Odstrániť")').click()

      // Wait for success message
      await expect(page.locator('text=Test bol odstránený')).toBeVisible()

      // Verify card is gone
      await expect(page.getByTestId('test-assignment-card-1')).not.toBeVisible()
    }
  })


  test('should not allow adding test when VK is not in PRIPRAVA status', async ({ page }) => {
    // Create VK in different status using Prisma with unique identifier
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: 'VK/2025/E2E-TEST-' + Date.now() + '-' + Math.random().toString(36).substring(7),
        selectionType: 'širšie vnútorné výberové konanie',
        organizationalUnit: 'Test Unit',
        serviceField: 'IT',
        position: 'Test Position',
        serviceType: 'stála štátna služba',
        date: new Date(),
        status: 'TESTOVANIE',
        institution: {
          connect: { id: institutionId }
        },
        createdBy: {
          connect: { id: userId }
        }
      }
    })

    await page.goto(`http://localhost:5600/vk/${vk.id}`)
    await page.waitForLoadState('networkidle')

    // Click on Tests tab
    await page.getByTestId('tests-tab').click()
    await page.waitForLoadState('networkidle')

    // Verify add button is not visible
    await expect(page.getByTestId('add-test-button')).not.toBeVisible()

    // Cleanup
    await prisma.vyberoveKonanie.delete({
      where: { id: vk.id }
    })
  })

  test('should allow adding multiple tests of same type', async ({ page }) => {
    if (!testId) {
      test.skip()
      return
    }

    // Add first test
    await page.getByTestId('add-test-button').click()
    await page.getByTestId('test-select').selectOption(testId)
    await page.getByTestId('save-test-button').click()
    await expect(page.locator('text=Test bol úspešne pridaný')).toBeVisible()

    // Add second test of same type - should be allowed now
    await page.getByTestId('add-test-button').click()
    await page.getByTestId('test-select').selectOption(testId)
    await page.getByTestId('save-test-button').click()
    await expect(page.locator('text=Test bol úspešne pridaný')).toBeVisible()

    // Verify both tests are visible
    await expect(page.getByTestId('test-assignment-card-1')).toBeVisible()
    await expect(page.getByTestId('test-assignment-card-2')).toBeVisible()
  })

  test('should use Slovak declension for questions', async ({ page }) => {
    const firstCard = page.getByTestId('test-assignment-card-1')

    if (await firstCard.isVisible()) {
      const text = await firstCard.textContent()

      // Check if it uses correct Slovak forms
      // Should be: "1 otázka", "2-4 otázky", "5+ otázok"
      const match = text?.match(/(\d+)\s+(otázka|otázky|otázok)/)

      if (match) {
        const count = Number(match[1])
        const word = match[2]

        if (count === 1) {
          expect(word).toBe('otázka')
        } else if (count >= 2 && count <= 4) {
          expect(word).toBe('otázky')
        } else {
          expect(word).toBe('otázok')
        }
      }
    }
  })
})
