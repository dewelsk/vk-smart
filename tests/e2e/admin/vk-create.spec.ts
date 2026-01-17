import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

test.describe('VK Create @admin @vk @critical', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/vk/new')
  })

  test('should display create VK wizard page', async ({ page }) => {
    // Check page loaded
    await expect(page.getByTestId('vk-new-page')).toBeVisible()
    await expect(page.getByTestId('page-title')).toBeVisible()

    // Check process sidebar with steps
    await expect(page.getByTestId('process-sidebar')).toBeVisible()
    await expect(page.getByTestId('step-hlavicka')).toBeVisible()
    await expect(page.getByTestId('step-nastavenie')).toBeVisible()
    await expect(page.getByTestId('step-komisia')).toBeVisible()
    await expect(page.getByTestId('step-testy')).toBeVisible()
    await expect(page.getByTestId('step-ustna')).toBeVisible()
    await expect(page.getByTestId('step-uchadzaci')).toBeVisible()

    // Check PDF upload zone
    await expect(page.getByTestId('pdf-upload-zone')).toBeVisible()

    // Check form fields
    await expect(page.getByTestId('identifier-input')).toBeVisible()
    await expect(page.getByTestId('selection-type-input')).toBeVisible()
    await expect(page.getByTestId('organizational-unit-input')).toBeVisible()
    await expect(page.getByTestId('service-field-input')).toBeVisible()
    await expect(page.getByTestId('position-input')).toBeVisible()
    await expect(page.getByTestId('number-of-positions-input')).toBeVisible()

    // Check buttons
    await expect(page.getByTestId('continue-button')).toBeVisible()
    await expect(page.getByTestId('save-draft-button')).toBeVisible()
    await expect(page.getByTestId('back-button')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByTestId('continue-button').click()

    // Should show validation errors under inputs
    await expect(page.getByTestId('identifier-error')).toBeVisible()
    await expect(page.getByTestId('selection-type-error')).toBeVisible()
    await expect(page.getByTestId('organizational-unit-error')).toBeVisible()
    await expect(page.getByTestId('service-field-error')).toBeVisible()
    await expect(page.getByTestId('position-error')).toBeVisible()
  })

  test('should show errors in sidebar navigation', async ({ page }) => {
    await page.getByTestId('continue-button').click()

    // Should show errors under the step in sidebar
    await expect(page.getByTestId('step-error-hlavicka-0')).toBeVisible()
  })

  test('should clear error when input is filled', async ({ page }) => {
    // Submit empty form to trigger errors
    await page.getByTestId('continue-button').click()
    await expect(page.getByTestId('identifier-error')).toBeVisible()

    // Fill the field
    await page.getByTestId('identifier-input').fill('VK-TEST-123')

    // Error should be cleared
    await expect(page.getByTestId('identifier-error')).not.toBeVisible()
  })

  test('should create new VK successfully', async ({ page }) => {
    const timestamp = Date.now()

    // Fill form using data-testid
    await page.getByTestId('identifier-input').fill(`VK-TEST-${timestamp}`)
    await page.getByTestId('selection-type-input').fill('Vonkajšie výberové konanie')
    await page.getByTestId('organizational-unit-input').fill('Test Unit')
    await page.getByTestId('service-field-input').fill('IT špecialista')
    await page.getByTestId('position-input').fill('1.03 - Medzinárodná spolupráca')
    await page.getByTestId('number-of-positions-input').clear()
    await page.getByTestId('number-of-positions-input').fill('2')

    // Submit form
    await page.getByTestId('continue-button').click()

    // Should redirect to VK detail
    await page.waitForURL(/\/vk\/[a-z0-9]+$/, { timeout: 10000 })

    // Verify we're on VK detail page
    await page.waitForLoadState('networkidle')
  })

  test('should navigate back to VK list', async ({ page }) => {
    await page.getByTestId('back-button').click()
    await page.waitForURL('/vk')
    await expect(page.getByTestId('vk-page')).toBeVisible()
  })

  test('should save draft with minimal data', async ({ page }) => {
    await page.getByTestId('save-draft-button').click()

    // Should redirect to VK detail (draft is saved with default values)
    await page.waitForURL(/\/vk\/[a-z0-9]+$/, { timeout: 10000 })
  })

  test('should set default numberOfPositions to 1', async ({ page }) => {
    const numberOfPositionsInput = page.getByTestId('number-of-positions-input')
    await expect(numberOfPositionsInput).toHaveValue('1')
  })

  test('should change numberOfPositions', async ({ page }) => {
    const numberOfPositionsInput = page.getByTestId('number-of-positions-input')
    await numberOfPositionsInput.clear()
    await numberOfPositionsInput.fill('5')
    await expect(numberOfPositionsInput).toHaveValue('5')
  })

  test('should switch between wizard steps', async ({ page }) => {
    // Click on step 2
    await page.getByTestId('step-nastavenie').click()

    // Should show step 2 form fields
    await expect(page.getByTestId('event-date-input')).toBeVisible()
    await expect(page.getByTestId('event-time-input')).toBeVisible()
    await expect(page.getByTestId('room-input')).toBeVisible()

    // Click back to step 1
    await page.getByTestId('step-hlavicka').click()

    // Should show form fields again
    await expect(page.getByTestId('identifier-input')).toBeVisible()
  })

  test('should display PDF upload zone with correct text', async ({ page }) => {
    const uploadZone = page.getByTestId('pdf-upload-zone')
    await expect(uploadZone).toBeVisible()
    await expect(uploadZone).toContainText('Vložte PDF súbor s údajmi o výberovom konaní')
    await expect(uploadZone).toContainText('Max. veľkosť: 50MB')
  })
})
