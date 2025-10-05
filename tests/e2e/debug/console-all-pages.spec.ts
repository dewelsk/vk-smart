import { test } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

const pages = [
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'VK List', url: '/vk' },
  { name: 'Users List', url: '/users' },
  { name: 'Applicants List', url: '/applicants' },
]

test.describe('Console Errors Check - All Pages', () => {
  for (const pageInfo of pages) {
    test(`should check console on ${pageInfo.name}`, async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      page.on('pageerror', (error) => {
        consoleErrors.push(`PAGE ERROR: ${error.message}`)
      })

      await loginAsSuperadmin(page)
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      console.log(`\n📄 ${pageInfo.name} (${pageInfo.url}):`)
      if (consoleErrors.length === 0) {
        console.log('  ✅ No errors')
      } else {
        console.log(`  ❌ ${consoleErrors.length} errors:`)
        consoleErrors.forEach(err => console.log(`     - ${err}`))
        throw new Error(`Found ${consoleErrors.length} errors on ${pageInfo.name}`)
      }
    })
  }
})
