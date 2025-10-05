import { test } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Create Test VKs', () => {
  test('should create 5 test VKs', async ({ page }) => {
    await loginAsSuperadmin(page)

    for (let i = 1; i <= 5; i++) {
      const timestamp = Date.now() + i

      // Navigate to create VK page
      await page.goto('/vk/new')

      // Wait for page to load
      await page.waitForSelector('input#identifier')

      // Fill identifier
      await page.fill('input#identifier', `VK/2025/${timestamp}`)

      // Select institution (first one)
      await page.click('.select__control')
      await page.waitForTimeout(500)
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      // Fill selection type
      await page.fill('input#selectionType', 'Výberové konanie')

      // Fill organizational unit
      await page.fill('input#organizationalUnit', `Útvar ${i}`)

      // Fill service field
      await page.fill('input#serviceField', `Odbor ${i}`)

      // Fill position
      await page.fill('input#position', `Pozícia ${i} - Testovacia`)

      // Fill service type
      await page.fill('input#serviceType', 'Trvalá štátna služba')

      // Fill date
      await page.fill('input#date', '2025-12-31')

      // Set number of positions
      await page.fill('input#numberOfPositions', i.toString())

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for redirect
      await page.waitForURL(/\/vk\/[a-z0-9]+/, { timeout: 10000 })

      console.log(`Created VK ${i}/5: VK/2025/${timestamp}`)

      // Small delay between creates
      await page.waitForTimeout(500)
    }

    console.log('All 5 VKs created successfully!')
  })
})
