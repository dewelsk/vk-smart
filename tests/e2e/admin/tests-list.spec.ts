import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'

// Run tests serially to avoid overwhelming the server
test.describe.configure({ mode: 'serial' })

// Helper to wait for loading state to finish
async function waitForLoadingToComplete(page: import('@playwright/test').Page) {
  // Wait for "Načítavam..." to disappear
  const loadingText = page.locator('text=Načítavam...')
  await loadingText.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
    // Loading might not appear or might finish quickly
  })
  // Additional small wait for UI to stabilize
  await page.waitForTimeout(300)
}

test.describe('Tests List Page @admin @tests-list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/tests')
    // Wait for page to load
    await expect(page.getByTestId('tests-page')).toBeVisible({ timeout: 10000 })
    // Wait for loading to complete
    await waitForLoadingToComplete(page)
  })

  test('should display tests list page with title', async ({ page }) => {
    await expect(page.getByTestId('page-title')).toBeVisible()
    await expect(page.getByTestId('page-title')).toHaveText('Testy')
  })

  test('should display create test button', async ({ page }) => {
    const createButton = page.getByTestId('create-test-button')
    await expect(createButton).toBeVisible()
    await expect(createButton).toHaveAttribute('href', '/tests/new')
  })

  test('should display search input', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', 'Vyhľadávať')
  })

  test('should display filters', async ({ page }) => {
    await expect(page.getByTestId('type-filter')).toBeVisible()
    await expect(page.getByTestId('status-filter')).toBeVisible()
    await expect(page.getByTestId('sort-dropdown')).toBeVisible()
  })

  test('should display tests list or empty state', async ({ page }) => {
    const testsList = page.getByTestId('tests-list')
    const emptyState = page.getByTestId('empty-state')

    const testsListVisible = await testsList.isVisible().catch(() => false)
    const emptyStateVisible = await emptyState.isVisible().catch(() => false)

    // One of them should be visible
    expect(testsListVisible || emptyStateVisible).toBe(true)
  })

  test('should display tests list with header when tests exist', async ({ page }) => {
    const testsList = page.getByTestId('tests-list')
    const testsListVisible = await testsList.isVisible().catch(() => false)

    if (testsListVisible) {
      // Header should be visible
      await expect(page.getByTestId('tests-list-header')).toBeVisible()

      // At least one test row should exist
      const testRows = page.locator('[data-testid^="test-row-"]')
      const count = await testRows.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should search tests and show clear button', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')

    // Type search query
    await searchInput.fill('test')

    // Clear button should appear
    await expect(page.getByTestId('clear-search-button')).toBeVisible()

    // Wait for debounce and loading
    await page.waitForTimeout(600)
    await waitForLoadingToComplete(page)

    // Click clear button
    await page.getByTestId('clear-search-button').click()

    // Search input should be empty
    await expect(searchInput).toHaveValue('')

    // Clear button should disappear
    await expect(page.getByTestId('clear-search-button')).not.toBeVisible()
  })

  test('should show no results message when search returns nothing', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')

    // Search for non-existing test
    await searchInput.fill('xyznonexistent12345')

    // Wait for debounce
    await page.waitForTimeout(600)

    // Wait for loading to complete
    await waitForLoadingToComplete(page)

    // Should show "no results" message (not "no tests")
    await expect(page.getByTestId('no-results-title')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('no-results-message')).toBeVisible()
  })

  test('should filter by type', async ({ page }) => {
    // Open type filter dropdown
    const typeFilter = page.getByTestId('type-filter')
    await typeFilter.click()

    // Wait for dropdown to open
    await page.waitForTimeout(300)

    // Check if any options are available
    const options = page.locator('[class*="option"]')
    const optionsCount = await options.count()

    if (optionsCount > 0) {
      // Click first option
      await options.first().click()

      // Wait for filter to apply and loading
      await waitForLoadingToComplete(page)

      // Either tests list or empty state should be visible
      const testsList = page.getByTestId('tests-list')
      const emptyState = page.getByTestId('empty-state')
      const testsListVisible = await testsList.isVisible().catch(() => false)
      const emptyStateVisible = await emptyState.isVisible().catch(() => false)
      expect(testsListVisible || emptyStateVisible).toBe(true)
    }
  })

  test('should filter by status', async ({ page }) => {
    // Open status filter dropdown
    const statusFilter = page.getByTestId('status-filter')
    await statusFilter.click()

    // Wait for dropdown to open
    await page.waitForTimeout(300)

    // Click "Schválené" option using exact match via role
    await page.getByRole('option', { name: 'Schválené', exact: true }).click()

    // Wait for filter to apply and loading
    await waitForLoadingToComplete(page)

    // Either tests list or empty state should be visible
    const testsList = page.getByTestId('tests-list')
    const emptyState = page.getByTestId('empty-state')
    const testsListVisible = await testsList.isVisible().catch(() => false)
    const emptyStateVisible = await emptyState.isVisible().catch(() => false)
    expect(testsListVisible || emptyStateVisible).toBe(true)
  })

  test('should navigate to test detail when clicking a row', async ({ page }) => {
    const testsList = page.getByTestId('tests-list')
    const testsListVisible = await testsList.isVisible().catch(() => false)

    if (testsListVisible) {
      // Click first test row
      const firstRow = page.locator('[data-testid^="test-row-"]').first()
      const testId = await firstRow.getAttribute('data-testid')
      const id = testId?.replace('test-row-', '')

      await firstRow.click()

      // Should navigate to test detail
      await page.waitForURL(`/tests/${id}`, { timeout: 10000 })
    }
  })

  test('should sort by oldest first', async ({ page }) => {
    // Check if we have tests to sort
    const testsList = page.getByTestId('tests-list')
    const testsListVisible = await testsList.isVisible().catch(() => false)

    if (testsListVisible) {
      // Open sort dropdown
      const sortDropdown = page.getByTestId('sort-dropdown')
      await sortDropdown.click()

      // Wait for dropdown to open
      await page.waitForTimeout(300)

      // Click "Zoradiť od najstarších" option
      await page.getByRole('option', { name: 'Zoradiť od najstarších' }).click()

      // Wait for loading to complete
      await waitForLoadingToComplete(page)

      // Tests list should still be visible
      await expect(page.getByTestId('tests-list')).toBeVisible()
    }
  })

  test('should sort by name A-Z', async ({ page }) => {
    const testsList = page.getByTestId('tests-list')
    const testsListVisible = await testsList.isVisible().catch(() => false)

    if (testsListVisible) {
      // Open sort dropdown
      const sortDropdown = page.getByTestId('sort-dropdown')
      await sortDropdown.click()

      // Wait for dropdown to open
      await page.waitForTimeout(300)

      // Click "Podľa názvu A-Z" option
      await page.getByRole('option', { name: 'Podľa názvu A-Z' }).click()

      // Wait for loading to complete
      await waitForLoadingToComplete(page)

      // Tests list should still be visible
      await expect(page.getByTestId('tests-list')).toBeVisible()
    }
  })

  test('should sort by name Z-A', async ({ page }) => {
    const testsList = page.getByTestId('tests-list')
    const testsListVisible = await testsList.isVisible().catch(() => false)

    if (testsListVisible) {
      // Open sort dropdown
      const sortDropdown = page.getByTestId('sort-dropdown')
      await sortDropdown.click()

      // Wait for dropdown to open
      await page.waitForTimeout(300)

      // Click "Podľa názvu Z-A" option
      await page.getByRole('option', { name: 'Podľa názvu Z-A' }).click()

      // Wait for loading to complete
      await waitForLoadingToComplete(page)

      // Tests list should still be visible
      await expect(page.getByTestId('tests-list')).toBeVisible()
    }
  })
})

test.describe('Tests List Pagination @admin @tests-list @pagination', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('/tests')
    await expect(page.getByTestId('tests-page')).toBeVisible({ timeout: 10000 })
    await waitForLoadingToComplete(page)
  })

  test('should display pagination when there are multiple pages', async ({ page }) => {
    // Check if pagination exists (only visible when there are enough tests)
    const pagination = page.getByTestId('pagination')
    const paginationVisible = await pagination.isVisible().catch(() => false)

    // Pagination should exist if we have enough tests (more than page size)
    // This test just verifies pagination component renders properly when needed
    if (paginationVisible) {
      // Previous button should exist
      await expect(page.getByTestId('pagination-prev')).toBeVisible()
      // Next button should exist
      await expect(page.getByTestId('pagination-next')).toBeVisible()
    }
  })

  test('should navigate between pages', async ({ page }) => {
    // Check if pagination is visible
    const nextButton = page.getByTestId('pagination-next')
    const nextButtonVisible = await nextButton.isVisible().catch(() => false)

    if (nextButtonVisible) {
      // Check if next button is enabled (not on last page)
      const isDisabled = await nextButton.evaluate((el) => el.classList.contains('opacity-30'))

      if (!isDisabled) {
        // Click next page
        await nextButton.click()

        // Wait for loading to complete
        await waitForLoadingToComplete(page)

        // Previous button should now be enabled (not on first page anymore)
        const prevButton = page.getByTestId('pagination-prev')
        const prevDisabled = await prevButton.evaluate((el) => el.classList.contains('opacity-30'))
        expect(prevDisabled).toBe(false)

        // Click previous to go back
        await prevButton.click()

        // Wait for loading to complete
        await waitForLoadingToComplete(page)

        // Previous should now be disabled (back on first page)
        const prevDisabledAgain = await prevButton.evaluate((el) => el.classList.contains('opacity-30'))
        expect(prevDisabledAgain).toBe(true)
      }
    }
  })
})
