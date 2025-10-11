import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../../helpers/auth'
import { prisma } from '../../../lib/prisma'

test.describe('VK Oral Evaluation Tab @admin @vk @oral', () => {
  let testVkId: string
  let evaluationConfigId: string | null = null
  const timestamp = Date.now()
  const uniqueIdentifier = `VK-ORAL-E2E-${timestamp}`

  test.beforeAll(async () => {
    // Create test VK
    const vk = await prisma.vyberoveKonanie.create({
      data: {
        identifier: uniqueIdentifier,
        name: `Test VK for Oral Tab ${timestamp}`,
        department: 'Test Department',
        description: 'Test VK for E2E testing',
        startDateTime: new Date(Date.now() + 86400000),
        endDateTime: new Date(Date.now() + 172800000),
        gestorId: 'cmgcjdfqa0003rmksnd9f8zws', // admin user ID
      },
    })
    testVkId = vk.id
  })

  test.afterAll(async () => {
    // Cleanup
    if (testVkId) {
      await prisma.vyberoveKonanie.delete({
        where: { id: testVkId },
      })
    }
  })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display Oral tab in VK detail', async ({ page }) => {
    // Navigate to VK detail page
    await page.goto(`http://localhost:5600/vk/${testVkId}`)
    await page.waitForLoadState('networkidle')

    // Check if Oral tab is visible
    const oralTab = page.getByTestId('oral-tab')
    await expect(oralTab).toBeVisible()
    await expect(oralTab).toContainText('Ústna časť')
  })

  test('should show configuration form when clicking Oral tab', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}`)
    await page.waitForLoadState('networkidle')

    // Click on Oral tab
    await page.getByTestId('oral-tab').click()

    // Check if configuration form is displayed
    await expect(page.locator('text=Konfigurácia ústnej časti')).toBeVisible()
    await expect(page.locator('text=Vyberte kategórie otázok')).toBeVisible()

    // Check counter display
    await expect(page.locator('text=Vybrané kategórie')).toBeVisible()
    await expect(page.locator('text=/0 \\/ 10/')).toBeVisible()
  })

  test('should display question categories', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    // Check if at least some categories are displayed
    const categories = page.locator('text=/\\d+ otázok/')
    const count = await categories.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should allow selecting categories', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    // Click on first few categories to select them
    const categoryCards = page.locator('[class*="hover:bg-gray-50"]')
    const totalCategories = await categoryCards.count()

    if (totalCategories >= 3) {
      // Select 3 categories (minimum required)
      for (let i = 0; i < 3; i++) {
        await categoryCards.nth(i).click()
        await page.waitForTimeout(200) // Small delay between clicks
      }

      // Check if counter updated
      await expect(page.locator('text=/3 \\/ 10/')).toBeVisible()

      // Check if validation message shows success
      await expect(page.locator('text=Počet kategórií je v poriadku')).toBeVisible()
    }
  })

  test('should validate minimum 3 categories', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    // Try to save without selecting enough categories
    const saveButton = page.locator('button:has-text("Uložiť konfiguráciu")')

    // Button should be disabled initially (0 selected)
    await expect(saveButton).toBeDisabled()

    // Select only 2 categories
    const categoryCards = page.locator('[class*="hover:bg-gray-50"]')
    const totalCategories = await categoryCards.count()

    if (totalCategories >= 2) {
      await categoryCards.nth(0).click()
      await page.waitForTimeout(200)
      await categoryCards.nth(1).click()

      // Button should still be disabled
      await expect(saveButton).toBeDisabled()

      // Should show warning message
      await expect(page.locator('text=Vyberte minimálne 3 kategórie')).toBeVisible()
    }
  })

  test('should validate maximum 10 categories', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    const categoryCards = page.locator('[class*="hover:bg-gray-50"]')
    const totalCategories = await categoryCards.count()

    // Try to select more than 10 categories if available
    if (totalCategories > 10) {
      // Select first 10 categories
      for (let i = 0; i < 10; i++) {
        await categoryCards.nth(i).click()
        await page.waitForTimeout(100)
      }

      // Try to select 11th category
      await categoryCards.nth(10).click()

      // Should still show only 10 selected
      await expect(page.locator('text=/10 \\/ 10/')).toBeVisible()
    }
  })

  test('should save configuration successfully', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    const categoryCards = page.locator('[class*="hover:bg-gray-50"]')
    const totalCategories = await categoryCards.count()

    if (totalCategories >= 4) {
      // Select 4 categories
      for (let i = 0; i < 4; i++) {
        await categoryCards.nth(i).click()
        await page.waitForTimeout(200)
      }

      // Click save button
      const saveButton = page.locator('button:has-text("Uložiť konfiguráciu")')
      await expect(saveButton).toBeEnabled()
      await saveButton.click()

      // Wait for success message
      await expect(page.locator('text=Konfigurácia ústnej časti bola uložená')).toBeVisible({
        timeout: 5000
      })

      // Store config ID for cleanup if needed
      const config = await prisma.evaluationConfig.findUnique({
        where: { vkId: testVkId }
      })
      if (config) {
        evaluationConfigId = config.id
      }
    }
  })

  test('should load saved configuration', async ({ page }) => {
    // First ensure we have a saved configuration
    const existingConfig = await prisma.evaluationConfig.findUnique({
      where: { vkId: testVkId }
    })

    if (!existingConfig) {
      // Create a config if it doesn't exist
      await prisma.evaluationConfig.create({
        data: {
          vkId: testVkId,
          evaluatedTraits: ['Sebadôvera', 'Motivácia', 'Samostatnosť', 'Adaptabilita a flexibilita'],
          questionBattery: {}
        }
      })
    }

    // Navigate to the page
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    // Check if saved configuration is loaded
    await expect(page.locator('text=/4 \\/ 10/')).toBeVisible()

    // Check for "Vybraté" badges (selected categories should have them)
    const selectedBadges = page.locator('text=Vybraté')
    const badgeCount = await selectedBadges.count()
    expect(badgeCount).toBe(4)
  })

  test('should update existing configuration', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    // Deselect one category (click on a selected one)
    const selectedCategories = page.locator('[class*="bg-blue-50"]')
    const selectedCount = await selectedCategories.count()

    if (selectedCount > 3) {
      // Deselect the first selected category
      await selectedCategories.first().click()
      await page.waitForTimeout(200)

      // Save updated configuration
      const saveButton = page.locator('button:has-text("Uložiť konfiguráciu")')
      await saveButton.click()

      // Wait for success message
      await expect(page.locator('text=Konfigurácia ústnej časti bola aktualizovaná')).toBeVisible({
        timeout: 5000
      })
    }
  })

  test('should show last update date', async ({ page }) => {
    // Ensure configuration exists
    const config = await prisma.evaluationConfig.findUnique({
      where: { vkId: testVkId }
    })

    if (config) {
      await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
      await page.waitForLoadState('networkidle')

      // Check if last update date is displayed
      await expect(page.locator('text=Posledná úprava:')).toBeVisible()
    }
  })

  test('should handle deselecting all categories', async ({ page }) => {
    await page.goto(`http://localhost:5600/vk/${testVkId}?tab=oral`)
    await page.waitForLoadState('networkidle')

    // Wait for categories to load
    await page.waitForSelector('text=otázok', { timeout: 10000 })

    // Deselect all selected categories
    let selectedCategories = page.locator('[class*="bg-blue-50"]')
    let selectedCount = await selectedCategories.count()

    while (selectedCount > 0) {
      await selectedCategories.first().click()
      await page.waitForTimeout(200)
      selectedCategories = page.locator('[class*="bg-blue-50"]')
      selectedCount = await selectedCategories.count()
    }

    // Check counter shows 0
    await expect(page.locator('text=/0 \\/ 10/')).toBeVisible()

    // Save button should be disabled
    const saveButton = page.locator('button:has-text("Uložiť konfiguráciu")')
    await expect(saveButton).toBeDisabled()
  })
})