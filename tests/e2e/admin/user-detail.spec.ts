import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('User Detail Page @admin @user-detail', () => {
  let testUserId: string
  let testInstitutionId: string
  let testRoleId: string

  test.beforeAll(async () => {
    await prisma.$connect()

    // Use unique identifier for parallel test runs
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Create test institution
    const institution = await prisma.institution.create({
      data: {
        code: 'E2E-USER-' + uniqueId,
        name: 'E2E User Test Institution ' + uniqueId,
        active: true,
      },
    })
    testInstitutionId = institution.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: 'e2e-user-detail-' + uniqueId,
        name: 'E2E',
        surname: 'User Detail',
        email: `e2e-user-detail-${uniqueId}@example.com`,
        password: 'dummy-hash',
        role: 'GESTOR',
        active: true,
      },
    })
    testUserId = user.id

    // Create one role assignment for testing
    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId: testUserId,
        role: 'ADMIN',
        institutionId: testInstitutionId,
      },
    })
    testRoleId = roleAssignment.id
  })

  test.afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {})
    }
    if (testInstitutionId) {
      await prisma.institution.delete({ where: { id: testInstitutionId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
  })

  test('should display user detail page with tabs', async ({ page }) => {
    await page.goto(`/users/${testUserId}`)

    await expect(page.getByTestId('user-detail-page')).toBeVisible({ timeout: 10000 })

    // Check header
    await expect(page.getByTestId('user-name')).toContainText('E2E User Detail')
    await expect(page.getByTestId('user-username')).toBeVisible()
    await expect(page.getByTestId('status-badge')).toBeVisible()

    // Check tabs
    await expect(page.getByTestId('overview-tab')).toBeVisible()
    await expect(page.getByTestId('roles-tab')).toBeVisible()
    await expect(page.getByTestId('roles-tab')).toContainText('(1)') // One role assigned in beforeAll
  })

  test('should display user overview information', async ({ page }) => {
    await page.goto(`/users/${testUserId}`)

    await expect(page.getByTestId('overview-content')).toBeVisible({ timeout: 10000 })

    // Check basic fields
    await expect(page.getByTestId('field-name')).toContainText('E2E')
    await expect(page.getByTestId('field-surname')).toContainText('User Detail')
    await expect(page.getByTestId('field-username')).toBeVisible()
    await expect(page.getByTestId('field-email')).toBeVisible()
    await expect(page.getByTestId('field-primary-role')).toContainText('GESTOR')
    await expect(page.getByTestId('field-active')).toContainText('Aktívny')
    await expect(page.getByTestId('field-created')).toBeVisible()
    await expect(page.getByTestId('field-last-login')).toBeVisible()
  })

  test('should navigate to roles tab and display roles', async ({ page }) => {
    await page.goto(`/users/${testUserId}`)

    // Click on roles tab
    await page.getByTestId('roles-tab').click()

    await expect(page.getByTestId('roles-content')).toBeVisible({ timeout: 10000 })

    // Check that add role button is visible (for SUPERADMIN)
    await expect(page.getByTestId('add-role-button')).toBeVisible()

    // Check that role list is visible
    await expect(page.getByTestId('roles-list')).toBeVisible()

    // Check that the test role is displayed
    await expect(page.getByTestId(`role-item-${testRoleId}`)).toBeVisible()
  })

  test('should open role assignment modal when clicking add role', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await expect(page.getByTestId('roles-content')).toBeVisible({ timeout: 10000 })

    // Click add role button
    await page.getByTestId('add-role-button').click()

    // Modal should appear
    await expect(page.getByTestId('role-assignment-modal')).toBeVisible()
    await expect(page.getByTestId('modal-title')).toContainText('Pridať rolu')

    // Check form fields (institution selector is now hidden - auto-inherited)
    await expect(page.locator('#role-select')).toBeVisible()

    // Check buttons
    await expect(page.getByTestId('cancel-button')).toBeVisible()
    await expect(page.getByTestId('assign-role-button')).toBeVisible()
  })

  test('should close role assignment modal when clicking cancel', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await page.getByTestId('add-role-button').click()
    await expect(page.getByTestId('role-assignment-modal')).toBeVisible()

    // Click cancel
    await page.getByTestId('cancel-button').click()

    // Modal should disappear
    await expect(page.getByTestId('role-assignment-modal')).not.toBeVisible()
  })

  test('should close role assignment modal when clicking X button', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await page.getByTestId('add-role-button').click()
    await expect(page.getByTestId('role-assignment-modal')).toBeVisible()

    // Click X button
    await page.getByTestId('close-modal-button').click()

    // Modal should disappear
    await expect(page.getByTestId('role-assignment-modal')).not.toBeVisible()
  })

  test('should disable submit button when no role selected', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await page.getByTestId('add-role-button').click()
    await expect(page.getByTestId('role-assignment-modal')).toBeVisible()

    // Submit button should be disabled when no role is selected
    const submitButton = page.getByTestId('assign-role-button')
    await expect(submitButton).toBeDisabled()
  })

  test('should successfully assign a new role', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    const initialRolesCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()

    // Open modal
    await page.getByTestId('add-role-button').click()
    await expect(page.getByTestId('role-assignment-modal')).toBeVisible()

    // Select KOMISIA role
    await page.locator('#role-select').click()
    await page.locator('.select__option').filter({ hasText: 'Komisia' }).click()

    // Submit
    await page.getByTestId('assign-role-button').click()

    // Wait longer for modal to close (API call + state update)
    await page.waitForTimeout(1500)
    await expect(page.getByTestId('role-assignment-modal')).not.toBeVisible()

    // Check that roles list updated (wait for new role to appear)
    await page.waitForTimeout(500) // Wait for mutation to complete

    const newRolesCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()
    expect(newRolesCount).toBeGreaterThan(initialRolesCount)

    // Check that KOMISIA badge is visible
    await expect(page.locator('[data-testid="role-badge-komisia"]')).toBeVisible()
  })

  test('should show error when assigning duplicate role', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    // Open modal
    await page.getByTestId('add-role-button').click()
    await expect(page.getByTestId('role-assignment-modal')).toBeVisible()

    // Select ADMIN role (already assigned in beforeAll with testInstitutionId)
    // Institution will be auto-inherited, so this will be a duplicate
    await page.locator('#role-select').click()
    await page.getByRole('option', { name: 'Admin', exact: true }).click()

    // Submit (institution is auto-inherited from existing ADMIN role)
    await page.getByTestId('assign-role-button').click()

    // Should show error
    await expect(page.getByTestId('error-message')).toBeVisible()
    await expect(page.getByTestId('error-message')).toContainText('Role already assigned')
  })

  test('should open delete confirmation when clicking delete role', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await expect(page.getByTestId('roles-list')).toBeVisible()

    // Click delete on first role
    const deleteButton = page.getByTestId(`delete-role-${testRoleId}`)
    await deleteButton.click()

    // Confirmation modal should appear
    await expect(page.getByTestId('confirm-modal')).toBeVisible()
    await expect(page.getByTestId('confirm-modal-title')).toContainText('Odstrániť rolu')
    await expect(page.getByTestId('confirm-modal-message')).toContainText('Naozaj chcete odstrániť rolu')
  })

  test('should cancel role deletion', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    // Wait for roles list to load
    await expect(page.getByTestId('roles-list')).toBeVisible()
    await page.waitForTimeout(500) // Wait for roles to render

    const initialRolesCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()

    // Click delete
    const deleteButton = page.getByTestId(`delete-role-${testRoleId}`)
    await deleteButton.click()

    // Wait for modal to appear
    await expect(page.getByTestId('confirm-modal')).toBeVisible()

    // Click cancel in confirmation modal
    await page.getByTestId('confirm-modal-cancel-button').click()

    // Modal should close
    await expect(page.getByTestId('confirm-modal')).not.toBeVisible()

    // Role should still be there
    await page.waitForTimeout(300)
    const newRolesCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()
    expect(newRolesCount).toBe(initialRolesCount)
  })

  test('should successfully delete a role', async ({ page }) => {
    // First, add a role that we can delete
    await page.goto(`/users/${testUserId}?tab=roles`)

    await page.getByTestId('add-role-button').click()
    await page.locator('#role-select').click()
    await page.locator('.select__option').filter({ hasText: 'Gestor' }).click()
    await page.getByTestId('assign-role-button').click()

    // Wait for role to be added
    await expect(page.locator('[data-testid="role-badge-gestor"]')).toBeVisible({ timeout: 10000 })

    const initialRolesCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()

    // Find and delete the GESTOR role
    const gestorRoleItem = page.locator('[data-testid^="role-item-"]').filter({ has: page.locator('[data-testid="role-badge-gestor"]') })
    const gestorDeleteButton = gestorRoleItem.locator('button[data-testid^="delete-role-"]')
    await gestorDeleteButton.click()

    // Wait for modal and confirm deletion
    await expect(page.getByTestId('confirm-modal')).toBeVisible()
    await page.getByTestId('confirm-modal-confirm-button').click()

    // Wait for modal to close and deletion to complete
    await expect(page.getByTestId('confirm-modal')).not.toBeVisible()
    await page.waitForTimeout(500)

    // Check that roles count decreased
    const newRolesCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()
    expect(newRolesCount).toBeLessThan(initialRolesCount)

    // GESTOR badge should be gone
    await expect(page.locator('[data-testid="role-badge-gestor"]')).not.toBeVisible()
  })

  test('should display role badge with institution name', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await expect(page.getByTestId('roles-list')).toBeVisible()

    // The role created in beforeAll has an institution assigned
    const roleItem = page.getByTestId(`role-item-${testRoleId}`)
    await expect(roleItem).toBeVisible()

    // Check that role badge contains ADMIN
    await expect(roleItem.locator('[data-testid="role-badge-admin"]')).toBeVisible()

    // Check that institution name is visible in the role badge
    await expect(roleItem).toContainText('E2E User Test Institution')
  })

  test('should show info note about multi-role system', async ({ page }) => {
    await page.goto(`/users/${testUserId}?tab=roles`)

    await expect(page.getByTestId('roles-content')).toBeVisible()

    // Check for info note
    await expect(page.locator('.bg-blue-50')).toContainText('Používateľ môže mať viacero rolí naraz')
    await expect(page.locator('.bg-blue-50')).toContainText('Role môžu byť globálne alebo viazané na konkrétnu inštitúciu')
  })

  test('should display correct roles count in tab', async ({ page }) => {
    await page.goto(`/users/${testUserId}`)

    // Get count from tab
    const rolesTab = page.getByTestId('roles-tab')
    const tabText = await rolesTab.textContent()
    const tabCount = parseInt(tabText?.match(/\((\d+)\)/)?.[1] || '0')

    // Navigate to roles tab and count actual roles
    await rolesTab.click()
    await expect(page.getByTestId('roles-list')).toBeVisible()
    await page.waitForTimeout(500)

    const actualCount = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').count()

    // Tab count should match actual count
    expect(tabCount).toBe(actualCount)
    expect(tabCount).toBeGreaterThan(0) // At least one role should exist
  })

  test('should navigate back to users list', async ({ page }) => {
    await page.goto(`/users/${testUserId}`)

    await expect(page.getByTestId('user-detail-page')).toBeVisible()

    // Click back button
    await page.getByTestId('back-to-list-link').click()

    // Should navigate to users list
    await expect(page).toHaveURL(/\/users$/)
  })
})
