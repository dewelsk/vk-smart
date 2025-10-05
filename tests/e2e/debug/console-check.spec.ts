import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Console Errors Check', () => {
  test('should check for console errors on VK page', async ({ page }) => {
    const consoleMessages: string[] = []
    const consoleErrors: string[] = []
    const consoleWarnings: string[] = []

    // Listen to all console events
    page.on('console', (msg) => {
      const type = msg.type()
      const text = msg.text()

      consoleMessages.push(`[${type}] ${text}`)

      if (type === 'error') {
        consoleErrors.push(text)
      } else if (type === 'warning') {
        consoleWarnings.push(text)
      }
    })

    // Listen to page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`)
    })

    // Login and navigate
    await loginAsSuperadmin(page)
    await page.goto('/vk')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Wait a bit more for any async operations
    await page.waitForTimeout(2000)

    // Log all console messages
    console.log('\n=== CONSOLE MESSAGES ===')
    consoleMessages.forEach(msg => console.log(msg))

    console.log('\n=== CONSOLE ERRORS ===')
    if (consoleErrors.length === 0) {
      console.log('✅ No errors found')
    } else {
      consoleErrors.forEach(error => console.log('❌', error))
    }

    console.log('\n=== CONSOLE WARNINGS ===')
    if (consoleWarnings.length === 0) {
      console.log('✅ No warnings found')
    } else {
      consoleWarnings.forEach(warning => console.log('⚠️', warning))
    }

    // Fail test if there are errors
    if (consoleErrors.length > 0) {
      throw new Error(`Found ${consoleErrors.length} console errors:\n${consoleErrors.join('\n')}`)
    }
  })
})
