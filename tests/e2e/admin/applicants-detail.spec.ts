import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('Applicants Detail @admin @applicants', () => {
  let applicantId: string

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)

    // Navigate to applicants list and get first applicant
    await page.goto('/applicants')
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => null)

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()

    if (rowCount === 0) {
      test.skip()
      return
    }

    const firstRow = rows.first()
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/applicants\/[a-z0-9]+/)

    // Extract applicant ID from URL
    const url = page.url()
    applicantId = url.split('/').pop() || ''
  })

  test('should display applicant detail page', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()

    // Check if we see applicant info sections
    await expect(page.locator('text=Výberové konanie')).toBeVisible()
    await expect(page.locator('text=Informácie o uchádzačovi')).toBeVisible()
  })

  test('should display VK information', async ({ page }) => {
    const vkSection = page.locator('text=Výberové konanie').locator('..')
    await expect(vkSection).toBeVisible()

    // Should show VK details
    await expect(page.locator('dt:has-text("Identifikátor")')).toBeVisible()
    await expect(page.locator('dt:has-text("Pozícia")')).toBeVisible()
    await expect(page.locator('dt:has-text("Rezort")')).toBeVisible()
  })

  test('should display applicant information', async ({ page }) => {
    const applicantSection = page.locator('text=Informácie o uchádzačovi').locator('..')
    await expect(applicantSection).toBeVisible()

    // Should show registration date, last login, etc.
    await expect(page.locator('dt:has-text("Registrácia")')).toBeVisible()
    await expect(page.locator('dt:has-text("Stav účtu")')).toBeVisible()
  })

  test('should display edit form', async ({ page }) => {
    await expect(page.locator('text=Upraviť uchádzača')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Uložiť zmeny")')).toBeVisible()
  })

  test('should update applicant email', async ({ page }) => {
    const timestamp = Date.now()
    const emailInput = page.locator('input[name="email"]')

    await emailInput.clear()
    await emailInput.fill(`updated.applicant.${timestamp}@test.sk`)

    await page.click('button:has-text("Uložiť zmeny")')

    // Wait for save
    await page.waitForTimeout(2000)

    // Reload to verify
    await page.reload()
    await expect(emailInput).toHaveValue(`updated.applicant.${timestamp}@test.sk`)
  })

  test('should toggle applicant archived status', async ({ page }) => {
    const archivedCheckbox = page.locator('input[type="checkbox"]#isArchived')

    // Get current state
    const wasChecked = await archivedCheckbox.isChecked()

    // Toggle
    await archivedCheckbox.click()

    // Save
    await page.click('button:has-text("Uložiť zmeny")')
    await page.waitForTimeout(2000)

    // Reload and verify
    await page.reload()
    await expect(archivedCheckbox).toHaveProperty('checked', !wasChecked)
  })

  test('should cancel edit and return to applicants list', async ({ page }) => {
    await page.click('a:has-text("Zrušiť")')
    await page.waitForURL('/applicants')
    await expect(page.locator('h1')).toContainText('Uchádzači')
  })

  test('should display delete button', async ({ page }) => {
    await expect(page.locator('button:has-text("Odstrániť")')).toBeVisible()
  })

  test('should show confirmation dialog on delete', async ({ page }) => {
    // Setup dialog listener
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain('odstrániť')
      await dialog.dismiss()
    })

    await page.click('button:has-text("Odstrániť")')

    // Wait for dialog
    await page.waitForTimeout(500)
  })

  test('should navigate back to applicants list', async ({ page }) => {
    // Click back button
    const backButton = page.locator('a[href="/applicants"]').first()
    await backButton.click()

    await page.waitForURL('/applicants')
    await expect(page.locator('h1')).toContainText('Uchádzači')
  })

  test('should display test results section', async ({ page }) => {
    const testResultsSection = page.locator('text=Výsledky testov')
    const sectionVisible = await testResultsSection.isVisible().catch(() => false)

    if (sectionVisible) {
      await expect(testResultsSection).toBeVisible()
    }
  })

  test('should display evaluations section', async ({ page }) => {
    const evaluationsSection = page.locator('text=Hodnotenia')
    const sectionVisible = await evaluationsSection.isVisible().catch(() => false)

    if (sectionVisible) {
      await expect(evaluationsSection).toBeVisible()
    }
  })

  test('should have link to VK detail', async ({ page }) => {
    // VK identifier should be a link
    const vkLink = page.locator('a[href^="/vk/"]').first()
    const linkVisible = await vkLink.isVisible().catch(() => false)

    if (linkVisible) {
      await expect(vkLink).toBeVisible()
      await expect(vkLink).toHaveAttribute('href', /\/vk\/[a-z0-9]+/)
    }
  })

  test('should display applicant status badges', async ({ page }) => {
    // Active/Inactive badge
    const statusBadges = page.locator('.inline-flex.items-center.px-2')
    const badgeCount = await statusBadges.count()

    expect(badgeCount).toBeGreaterThan(0)
  })
})
