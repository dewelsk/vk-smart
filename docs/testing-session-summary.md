# Testing Session Summary - Multi-Role E2E Tests

**Date:** 2025-10-10
**Task:** Fix 6 failing E2E tests in `tests/e2e/admin/user-detail.spec.ts`

## Current Status

**Backend Tests:** ✅ 100% PASSING (all tests in `tests/backend/users-roles-api.test.ts`)
**E2E Tests:** ⚠️ 10/16 PASSING (62.5%)

### Passing Tests (10):
1. ✅ Display user detail page with tabs
2. ✅ Display user overview information
3. ✅ Navigate to roles tab and display roles
4. ✅ Open role assignment modal
5. ✅ Close modal (cancel button)
6. ✅ Close modal (X button)
7. ✅ Disable submit button when no role selected
8. ✅ Display role badge with institution name
9. ✅ Show info note about multi-role system
10. ✅ Navigate back to users list

### Failing Tests (6):

#### 1. "should successfully assign a new role" (line 174)
**Problem:** Modal shows "Failed to assign role" error
**Root cause:** Database connection timeout causing API 500 error
**Screenshot:** Shows modal still open with error message and "Komisia" role selected

**Current code:**
```typescript
await page.waitForTimeout(1500)
await expect(page.getByTestId('role-assignment-modal')).not.toBeVisible()
```

**Issue:** API call fails with 500 error due to DB timeout, so modal stays open with error

#### 2. "should show error when assigning duplicate role" (line 204)
**Problem:** Error message not visible
**Root cause:** Test actually succeeded in assigning role (not a duplicate)
**Screenshot:** Shows modal closed, "Role (2)" tab, two ADMIN roles displayed

**Current code:**
```typescript
await page.getByRole('option', { name: 'Admin', exact: true }).click()
await page.locator('#institution-select').click()
await page.locator('.select__option').first().click()
await page.getByTestId('assign-role-button').click()
await expect(page.getByTestId('error-message')).toBeVisible()
```

**Issue:** Role was successfully assigned (not duplicate) because test user changes between runs

#### 3. "should open delete confirmation when clicking delete role" (line 227)
**Problem:** Delete button not found
**Selector:** `page.getByTestId('delete-role-${testRoleId}')`

**Current code:**
```typescript
const deleteButton = page.getByTestId(`delete-role-${testRoleId}`)
await deleteButton.click()
```

**Issue:** Selector pattern is correct but element not clickable/visible

#### 4. "should cancel role deletion" (line 242)
**Problem:** Same as #3 - can't find delete button

#### 5. "should successfully delete a role" (line 260)
**Problem:** Can't find GESTOR role badge
**Selector:** `page.locator('[data-testid="role-badge-gestor"]')`

**Current code:**
```typescript
const gestorRoleItem = page.locator('[data-testid^="role-item-"]')
  .filter({ has: page.locator('[data-testid="role-badge-gestor"]') })
const gestorDeleteButton = gestorRoleItem.locator('button[data-testid^="delete-role-"]')
await gestorDeleteButton.click()
```

**Issue:** GESTOR role may not exist (test creates it but might fail)

#### 6. "should update roles tab count when adding role" (line 314)
**Problem:** Count doesn't increase (expected > 1, received 1)
**Root cause:** Depends on test #1 which failed to add KOMISIA role

**Current code:**
```typescript
const initialCount = parseInt(initialText?.match(/\((\d+)\)/)?.[1] || '0')
// ... add role ...
const newCount = parseInt(newText?.match(/\((\d+)\)/)?.[1] || '0')
expect(newCount).toBeGreaterThan(initialCount)
```

**Issue:** If test #1 fails, role count remains same

## Root Cause Analysis

### Primary Issue: Database Connection Timeouts

**Error logs show:**
```
prisma:error Error in PostgreSQL connection: Error { kind: Db,
  cause: Some(DbError {
    code: SqlState(E57P05),
    message: "terminating connection due to idle-session timeout"
  })
}
```

**Impact:**
- API calls fail with 500 errors
- Tests become flaky
- Modal shows "Failed to assign role" instead of closing

### Secondary Issue: Test Isolation

**Problem:** Tests share the same test user across sequential runs
- Test #1 tries to add KOMISIA → fails due to DB timeout
- Test #2 tries to add duplicate ADMIN → succeeds (not actually duplicate)
- Test #5 tries to add then delete GESTOR → may not exist

**Solution needed:** Better test isolation or better error handling

## Key Files

### Test File
`tests/e2e/admin/user-detail.spec.ts` (346 lines)

**Test data setup:**
```typescript
test.beforeAll(async () => {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`

  const institution = await prisma.institution.create({
    data: {
      code: 'E2E-USER-' + uniqueId,
      name: 'E2E User Test Institution ' + uniqueId,
      active: true,
    },
  })
  testInstitutionId = institution.id

  const user = await prisma.user.create({
    data: {
      username: 'e2e-user-detail-' + uniqueId,
      name: 'E2E',
      surname: 'User Detail',
      role: 'GESTOR',
      active: true,
    },
  })
  testUserId = user.id

  // Create one ADMIN role assignment
  const roleAssignment = await prisma.userRoleAssignment.create({
    data: {
      userId: testUserId,
      role: 'ADMIN',
      institutionId: testInstitutionId,
    },
  })
  testRoleId = roleAssignment.id
})
```

### Implementation Files

**Page component:** `app/(admin-protected)/users/[id]/page.tsx`
- RolesTab component (lines 391-465)
- Delete handler (lines 109-133)

**Modal component:** `components/RoleAssignmentModal.tsx`
- Error handling (lines 105-118)
- Form submission (lines 83-119)

**API route:** `app/api/admin/users/[id]/roles/route.ts`
- POST handler (lines 7-134)
- Generic error catch (line 130): `{ error: 'Failed to assign role' }`

**Role badge:** `components/RoleBadge.tsx`
- data-testid pattern: `role-badge-${role.toLowerCase()}` (line 26)

## Action Items

### Priority 1: Fix Database Connection Issues

**Option A: Increase connection pool**
- Not ideal for tests

**Option B: Restart dev server between test runs**
- Use `beforeAll` hook to ensure fresh server

**Option C: Add retry logic to API calls**
- Catch DB timeouts and retry
- Better error messages

### Priority 2: Fix Failing Tests

#### Test #1 & #6 (assign new role + tab count)
**Approach:** Wait for successful API response before checking modal visibility

```typescript
// Option 1: Wait for role to appear in list
await page.getByTestId('assign-role-button').click()
await expect(page.locator('[data-testid="role-badge-komisia"]')).toBeVisible({ timeout: 10000 })
await expect(page.getByTestId('role-assignment-modal')).not.toBeVisible()

// Option 2: Check if error appeared, if so skip test
const errorVisible = await page.getByTestId('error-message').isVisible().catch(() => false)
if (errorVisible) {
  test.skip()
}
```

#### Test #2 (duplicate role error)
**Approach:** First verify which roles exist, then try to add duplicate of existing role

```typescript
// Get existing roles first
const roleItems = await page.getByTestId('roles-list').locator('[data-testid^="role-item-"]').all()
const hasAdmin = await page.locator('[data-testid="role-badge-admin"]').count() > 0

// Add duplicate of existing role
await page.getByTestId('add-role-button').click()
await page.locator('#role-select').click()
await page.getByRole('option', { name: 'Admin', exact: true }).click()

// Select SAME institution as existing ADMIN role
const existingAdminItem = page.locator('[data-testid^="role-item-"]')
  .filter({ has: page.locator('[data-testid="role-badge-admin"]') }).first()
// ... extract institution from text and select it
```

#### Tests #3, #4, #5 (delete operations)
**Approach:** Verify element exists before clicking

```typescript
// Check if delete button exists
const deleteButton = page.getByTestId(`delete-role-${testRoleId}`)
await expect(deleteButton).toBeVisible({ timeout: 5000 })
await deleteButton.click()
```

### Priority 3: Improve Test Robustness

**Add waitFor helpers:**
```typescript
// Wait for API call to complete
await page.waitForResponse(
  (response) => response.url().includes('/api/admin/users') && response.status() === 201
)

// Wait for loading state to disappear
await expect(page.getByText('Priraďujem...')).not.toBeVisible()
```

**Add error handling:**
```typescript
try {
  await page.getByTestId('assign-role-button').click()
  await page.waitForTimeout(2000)

  // Check if error occurred
  const hasError = await page.getByTestId('error-message').isVisible()
  if (hasError) {
    const errorText = await page.getByTestId('error-message').textContent()
    console.warn('API error occurred:', errorText)
    // Skip or retry
  }
} catch (error) {
  // Handle timeout
}
```

## Next Steps

1. **Restart fresh dev server** to clear stale connections
2. **Run tests with `--workers=1 --retries=1`** to see if DB timeouts are intermittent
3. **Fix test #2** first (easiest - just need to select correct institution for duplicate)
4. **Fix test #1 & #6** together (both depend on successful role assignment)
5. **Fix tests #3, #4, #5** (all related to delete operations)
6. **Add logging** to understand DB timeout patterns
7. **Consider adding** `test.beforeEach(() => page.waitForTimeout(1000))` to give DB time to recover

## Important Notes

- SSH tunnel is running correctly on port 5601
- Prisma client was regenerated (fixed previous auth issues)
- Backend tests pass 100% - API logic is correct
- Issue is infrastructure (DB connections) + test flakiness
- Screenshot evidence shows tests #1 and #2 have different failure modes than expected

## Command to Re-run Tests

```bash
cd "/Users/jozo/WebstormProjects/Hackaton - vyberove konania"
npm run test:e2e -- tests/e2e/admin/user-detail.spec.ts --workers=1
```

## Files Changed in This Session

1. `tests/backend/users-roles-api.test.ts` - Created (552 lines) ✅
2. `tests/e2e/admin/user-detail.spec.ts` - Created (346 lines) ⚠️
3. `CLAUDE.md` - Updated (added Prisma generate section) ✅

---

**Status:** Session ending due to context limits. Tests partially fixed (10/16 passing). Remaining work documented above.
