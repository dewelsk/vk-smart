# Multi-Role FÁZA 1 - Implementačný Plán

## Prehľad

Tento dokument pokrýva **FÁZU 1** multi-role migrácie - základnú infraštruktúru pre správu rolí.

**Cieľ:** Vytvoriť funkčný multi-role systém pre User Management bez implementácie nových obrazoviek pre GESTOR/KOMISIA roly.

**Časový odhad:** 25-30 hodín

---

## ⚠️ KRITICKÉ POŽIADAVKY

**Pred začatím si MUSÍŠ prečítať:**
- `CLAUDE.md` - Všetky pravidlá a požiadavky
- `docs/patterns/backend-testing.md` - Ako písať backend testy
- `docs/patterns/e2e-form-tests.md` - Ako písať E2E testy
- `docs/patterns/form-validation.md` - Formulárový pattern

**Kľúčové body:**
- ❌ **ŽIADNE EMOJI** v React komponentoch - len Heroicons
- ✅ **Backend testy** pre každý API endpoint
- ✅ **E2E testy** pre každý formulár
- ✅ **data-testid** všade namiesto text-based selectors
- ✅ **Smoke test** po každej fáze: `npm run test:e2e -- tests/e2e/admin/dashboard.spec.ts`

---

## Scope FÁZY 1

### ✅ Čo sa IMPLEMENTUJE:

1. **Databáza:**
   - UserRoleAssignment M:N tabuľka
   - Migrácia existujúcich rolí

2. **Backend:**
   - Auth system (session s roles array)
   - User Management API (CRUD + role management)
   - Helper funkcie pre role checking

3. **Frontend:**
   - User List (zobrazenie viacerých rolí)
   - User Detail (správa rolí)
   - User Create (pridanie rolí)
   - Role Badge komponenty
   - Sidebar (multi-role aware)

4. **VK Selectors:**
   - Gestor selector (filter podľa multi-role)
   - Commission member selector (filter podľa multi-role)

5. **Testy:**
   - Backend testy pre všetky API endpoints
   - E2E testy pre všetky formuláre

### ❌ Čo sa NEIMPLEMENTUJE (odložené):

- Dashboard pre GESTOR/KOMISIA
- "Moje VK" stránka pre GESTOR
- "Hodnotenia" stránka pre KOMISIA
- Role Switching (prepínanie aktívnej role)
- Role Delegation (dočasné delegovanie)

---

## Krok po kroku implementácia

### 1. Príprava a DB migrácia (2-3 hodiny)

#### 1.1 Aktualizovať Prisma schému

**Súbor:** `prisma/schema.prisma`

```prisma
// Keep UserRole enum as before
enum UserRole {
  SUPERADMIN
  ADMIN
  GESTOR
  KOMISIA
  UCHADZAC
}

model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String?  @unique
  password      String?
  name          String
  surname       String

  // KEEP this field for backward compatibility (will be removed in PHASE 2)
  role          UserRole

  // NEW: M:N relation to roles
  userRoles     UserRoleAssignment[]

  // ... existing fields
}

// NEW: Many-to-Many join table
model UserRoleAssignment {
  id          String   @id @default(cuid())

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  role        UserRole

  // Optional: Role assignment metadata
  assignedAt  DateTime @default(now())
  assignedBy  String?

  // Optional: Institution-specific role assignment
  institutionId String?
  institution   Institution? @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  @@unique([userId, role, institutionId])
  @@map("user_role_assignments")
}

model Institution {
  id          String   @id @default(cuid())
  // ... existing fields

  roleAssignments UserRoleAssignment[]
}
```

**Checklist:**
- [ ] Pridať `UserRoleAssignment` model
- [ ] Pridať `userRoles` relation do `User`
- [ ] Pridať `roleAssignments` do `Institution`
- [ ] **NEODSTRÁNIŤ** `User.role` field (backwards compatibility)

#### 1.2 Vytvoriť migráciu

```bash
npx prisma migrate dev --name add_multi_role_support
```

**Súbor:** `prisma/migrations/XXX_add_multi_role_support/migration.sql`

```sql
-- 1. Create UserRoleAssignment table
CREATE TABLE "user_role_assignments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" TEXT,
  "institutionId" TEXT,

  CONSTRAINT "user_role_assignments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_role_assignments_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE,
  CONSTRAINT "user_role_assignments_userId_role_institutionId_key"
    UNIQUE ("userId", "role", "institutionId")
);

-- 2. Migrate existing roles to new table
INSERT INTO "user_role_assignments" ("id", "userId", "role", "assignedAt")
SELECT
  gen_random_uuid()::text,
  "id" as "userId",
  "role",
  "createdAt" as "assignedAt"
FROM "users"
WHERE "role" IS NOT NULL AND "deleted" = false;

-- 3. Add indexes
CREATE INDEX "user_role_assignments_userId_idx" ON "user_role_assignments"("userId");
CREATE INDEX "user_role_assignments_role_idx" ON "user_role_assignments"("role");
CREATE INDEX "user_role_assignments_institutionId_idx" ON "user_role_assignments"("institutionId");
```

**Checklist:**
- [ ] Spustiť migráciu
- [ ] Overiť že všetky roly boli skopírované: `SELECT COUNT(*) FROM user_role_assignments;`
- [ ] Overiť že pôvodný `User.role` stále existuje

#### 1.3 Aktualizovať seed.ts

**Súbor:** `prisma/seed.ts`

Pri vytváraní test používateľov pridať aj role cez `userRoles`:

```typescript
const admin = await prisma.user.create({
  data: {
    username: 'admin',
    name: 'Admin',
    surname: 'User',
    role: UserRole.ADMIN, // Keep for backward compatibility
    userRoles: {
      create: [
        { role: UserRole.ADMIN }
      ]
    }
  }
})
```

**Checklist:**
- [ ] Aktualizovať seed pre všetkých test používateľov
- [ ] Spustiť: `npx prisma db seed`
- [ ] Overiť že seed funguje

---

### 2. Auth Core (3-4 hodiny)

#### 2.1 Aktualizovať NextAuth typy

**Súbor:** `types/next-auth.d.ts`

```typescript
import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    email: string | null
    name: string
    surname: string

    // NEW: Array of roles instead of single role
    roles: Array<{
      role: UserRole
      institutionId?: string | null
    }>

    institutions: Array<{
      id: string
      code: string
      name: string
    }>
  }

  interface Session {
    user: {
      id: string
      username: string

      // NEW: Array of roles
      roles: Array<{
        role: UserRole
        institutionId?: string | null
      }>

      institutions: Array<{
        id: string
        code: string
        name: string
      }>
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string

    // NEW: Array of roles
    roles: Array<{
      role: UserRole
      institutionId?: string | null
    }>

    institutions: Array<{
      id: string
      code: string
      name: string
    }>
  }
}
```

**Checklist:**
- [ ] Zmeniť `role: UserRole` na `roles: Array<...>`
- [ ] Aktualizovať `User`, `Session`, `JWT` interfaces

#### 2.2 Aktualizovať auth.ts callbacks

**Súbor:** `auth.ts`

```typescript
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        // ... existing validation

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: login },
              { username: login },
            ],
            deleted: false,
            active: true,
          },
          include: {
            institutions: {
              include: {
                institution: true,
              },
            },
            // NEW: Include role assignments
            userRoles: {
              select: {
                role: true,
                institutionId: true,
              },
            },
          },
        })

        if (!user || !user.password) {
          return null
        }

        // ... password validation

        // NEW: Return user with roles array
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          surname: user.surname,
          roles: user.userRoles.map(ur => ({
            role: ur.role,
            institutionId: ur.institutionId,
          })),
          institutions: user.institutions.map((ui) => ({
            id: ui.institution.id,
            code: ui.institution.code,
            name: ui.institution.name,
          })),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.roles = user.roles  // Store roles array in JWT
        token.institutions = user.institutions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.roles = token.roles as Array<{
          role: UserRole
          institutionId?: string | null
        }>
        session.user.institutions = token.institutions as Array<{
          id: string
          code: string
          name: string
        }>
      }
      return session
    },
  },
}
```

**Checklist:**
- [ ] Include `userRoles` v Prisma query
- [ ] Map `userRoles` na `roles` array
- [ ] Uložiť `roles` do JWT
- [ ] Uložiť `roles` do session

#### 2.3 Prepísať lib/auth.ts helper funkcie

**Súbor:** `lib/auth.ts`

```typescript
import { auth } from '@/auth'
import { UserRole } from '@prisma/client'

export async function getSession() {
  return await auth()
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Check if user has specific role
 * @param role - Role to check
 * @param institutionId - Optional institution ID for institution-specific role check
 */
export async function hasRole(role: UserRole, institutionId?: string) {
  const user = await getCurrentUser()
  if (!user) return false

  return user.roles.some(r => {
    if (r.role !== role) return false
    if (institutionId && r.institutionId !== institutionId) return false
    return true
  })
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[], institutionId?: string) {
  const user = await getCurrentUser()
  if (!user) return false

  return user.roles.some(r => {
    if (!roles.includes(r.role)) return false
    if (institutionId && r.institutionId !== institutionId) return false
    return true
  })
}

/**
 * Check if user has ALL specified roles
 */
export async function hasAllRoles(roles: UserRole[]) {
  const user = await getCurrentUser()
  if (!user) return false

  const userRoleSet = new Set(user.roles.map(r => r.role))
  return roles.every(role => userRoleSet.has(role))
}

/**
 * Get all user's roles
 */
export async function getUserRoles() {
  const user = await getCurrentUser()
  return user?.roles ?? []
}

/**
 * Get user's roles for specific institution
 */
export async function getUserRolesForInstitution(institutionId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  return user.roles.filter(r =>
    r.institutionId === institutionId || r.institutionId === null
  )
}

export async function isSuperadmin() {
  return hasRole(UserRole.SUPERADMIN)
}

export async function isAdminOrAbove() {
  return hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
}

export async function belongsToInstitution(institutionId: string) {
  const user = await getCurrentUser()
  return user?.institutions.some((i) => i.id === institutionId) ?? false
}

export async function getUserInstitutions() {
  const user = await getCurrentUser()
  return user?.institutions ?? []
}
```

**Checklist:**
- [ ] Prepísať všetky funkcie pre multi-role
- [ ] Pridať `institutionId` parameter kde je relevantný
- [ ] Vytvoriť `getUserRoles()`, `hasAllRoles()`

---

### 3. User Management API + Backend Testy (6-8 hodín)

#### 3.1 Aktualizovať GET /api/admin/users

**Súbor:** `app/api/admin/users/route.ts`

**Zmeny:**
- Include `userRoles` v Prisma query
- Vrátiť `roles` array namiesto single `role`

```typescript
const users = await prisma.user.findMany({
  where,
  orderBy,
  skip: (page - 1) * limit,
  take: limit,
  include: {
    institutions: {
      include: {
        institution: true,
      },
    },
    // NEW: Include role assignments
    userRoles: {
      select: {
        id: true,
        role: true,
        institutionId: true,
      },
    },
    gestorVKs: {
      select: { id: true },
    },
  },
})

const formattedUsers = users.map((user) => ({
  id: user.id,
  name: user.name,
  surname: user.surname,
  email: user.email,
  username: user.username,

  // NEW: Return roles array
  roles: user.userRoles.map(ur => ({
    id: ur.id,
    role: ur.role,
    institutionId: ur.institutionId,
  })),

  active: user.active,
  // ... rest of fields
}))
```

**Backend test:** `tests/backend/users-api.test.ts`

```typescript
describe('GET /api/admin/users', () => {
  it('should return users with multiple roles', async () => {
    // Create user with multiple roles
    const user = await prisma.user.create({
      data: {
        username: `test-${Date.now()}`,
        name: 'Test',
        surname: 'User',
        role: UserRole.ADMIN,
        userRoles: {
          create: [
            { role: UserRole.ADMIN },
            { role: UserRole.GESTOR },
          ]
        }
      }
    })

    const res = await fetch('http://localhost:5600/api/admin/users', {
      headers: { Cookie: adminCookie }
    })

    const data = await res.json()
    const foundUser = data.users.find(u => u.id === user.id)

    expect(foundUser).toBeDefined()
    expect(foundUser.roles).toHaveLength(2)
    expect(foundUser.roles.map(r => r.role)).toContain(UserRole.ADMIN)
    expect(foundUser.roles.map(r => r.role)).toContain(UserRole.GESTOR)
  })
})
```

**Checklist:**
- [ ] Aktualizovať API endpoint
- [ ] Napísať backend test pre multi-role

#### 3.2 Vytvoriť POST /api/admin/users/[id]/roles

**Nový súbor:** `app/api/admin/users/[id]/roles/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasRole, hasAnyRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// POST /api/admin/users/:id/roles - Add role to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    const canManageRoles = await hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
    if (!canManageRoles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, institutionId } = await request.json()

    // Only SUPERADMIN can assign SUPERADMIN role
    if (role === UserRole.SUPERADMIN) {
      const isSuperadmin = await hasRole(UserRole.SUPERADMIN)
      if (!isSuperadmin) {
        return NextResponse.json(
          { error: 'Only superadmin can assign superadmin role' },
          { status: 403 }
        )
      }
    }

    // Create role assignment
    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId: params.id,
        role,
        institutionId: institutionId || null,
        assignedBy: session.user.id,
      },
    })

    return NextResponse.json({ roleAssignment })
  } catch (error) {
    console.error('POST /api/admin/users/:id/roles error:', error)
    return NextResponse.json(
      { error: 'Failed to add role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/:id/roles/:roleId - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const roleId = searchParams.get('roleId')

  if (!roleId) {
    return NextResponse.json({ error: 'roleId is required' }, { status: 400 })
  }

  try {
    const canManageRoles = await hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
    if (!canManageRoles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleAssignment = await prisma.userRoleAssignment.findUnique({
      where: { id: roleId },
    })

    if (!roleAssignment || roleAssignment.userId !== params.id) {
      return NextResponse.json(
        { error: 'Role assignment not found' },
        { status: 404 }
      )
    }

    // Only SUPERADMIN can remove SUPERADMIN role
    if (roleAssignment.role === UserRole.SUPERADMIN) {
      const isSuperadmin = await hasRole(UserRole.SUPERADMIN)
      if (!isSuperadmin) {
        return NextResponse.json(
          { error: 'Only superadmin can remove superadmin role' },
          { status: 403 }
        )
      }
    }

    await prisma.userRoleAssignment.delete({
      where: { id: roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/users/:id/roles error:', error)
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    )
  }
}
```

**Backend test:** `tests/backend/users-roles-api.test.ts` (NOVÝ súbor)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

describe('/api/admin/users/[id]/roles', () => {
  let adminCookie: string
  let testUser: any

  beforeAll(async () => {
    // Login as admin
    // Create test user
  })

  afterAll(async () => {
    // Cleanup
  })

  it('should add role to user', async () => {
    const res = await fetch(`http://localhost:5600/api/admin/users/${testUser.id}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        role: UserRole.GESTOR,
      }),
    })

    expect(res.ok).toBe(true)

    const data = await res.json()
    expect(data.roleAssignment).toBeDefined()
    expect(data.roleAssignment.role).toBe(UserRole.GESTOR)

    // Verify in DB
    const roles = await prisma.userRoleAssignment.findMany({
      where: { userId: testUser.id },
    })
    expect(roles).toHaveLength(2) // Original + new
  })

  it('should remove role from user', async () => {
    // Create role assignment
    const roleAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId: testUser.id,
        role: UserRole.KOMISIA,
      },
    })

    const res = await fetch(
      `http://localhost:5600/api/admin/users/${testUser.id}/roles?roleId=${roleAssignment.id}`,
      {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      }
    )

    expect(res.ok).toBe(true)

    // Verify in DB
    const deleted = await prisma.userRoleAssignment.findUnique({
      where: { id: roleAssignment.id },
    })
    expect(deleted).toBeNull()
  })

  it('should prevent ADMIN from assigning SUPERADMIN role', async () => {
    const res = await fetch(`http://localhost:5600/api/admin/users/${testUser.id}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        role: UserRole.SUPERADMIN,
      }),
    })

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('Only superadmin')
  })
})
```

**Checklist:**
- [ ] Vytvoriť POST endpoint pre pridanie roly
- [ ] Vytvoriť DELETE endpoint pre odobratie roly
- [ ] Napísať backend testy (minimálne 6 testov)

---

### 4. User Management UI + E2E Testy (8-10 hodín)

#### 4.1 Vytvoriť RoleBadge komponent

**Nový súbor:** `components/users/RoleBadge.tsx`

```typescript
import { UserRole } from '@prisma/client'

interface RoleBadgeProps {
  role: UserRole
  institutionName?: string
  size?: 'sm' | 'md' | 'lg'
}

export function RoleBadge({ role, institutionName, size = 'md' }: RoleBadgeProps) {
  const colors = {
    SUPERADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    GESTOR: 'bg-green-100 text-green-800',
    KOMISIA: 'bg-orange-100 text-orange-800',
    UCHADZAC: 'bg-gray-100 text-gray-800',
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors[role]} ${sizeClasses[size]}`}
      data-testid={`role-badge-${role.toLowerCase()}`}
    >
      <span>{role}</span>
      {institutionName && (
        <span className="text-xs opacity-75">({institutionName})</span>
      )}
    </span>
  )
}
```

**Checklist:**
- [ ] Vytvoriť komponent
- [ ] Použiť Tailwind classy (NIE emoji!)
- [ ] Pridať `data-testid`

#### 4.2 Aktualizovať User List

**Súbor:** `app/(admin-protected)/users/page.tsx`

V DataTable columns pridať:

```typescript
{
  header: 'Roly',
  accessorKey: 'roles',
  cell: ({ row }) => (
    <div className="flex flex-wrap gap-1" data-testid={`user-roles-${row.original.id}`}>
      {row.original.roles.map((roleAssignment, idx) => (
        <RoleBadge
          key={idx}
          role={roleAssignment.role}
          institutionName={roleAssignment.institutionId ? '...' : undefined}
          size="sm"
        />
      ))}
    </div>
  ),
}
```

**E2E test:** `tests/e2e/admin/users-list.spec.ts`

```typescript
test('should display multiple roles for users', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('http://localhost:5600/users')

  // Find user with multiple roles
  const userRoles = page.getByTestId(/user-roles-/)
  await expect(userRoles.first()).toBeVisible()

  // Check role badges
  const badge = page.getByTestId('role-badge-admin').first()
  await expect(badge).toBeVisible()
})
```

**Checklist:**
- [ ] Aktualizovať DataTable columns
- [ ] Použiť RoleBadge komponent
- [ ] Napísať E2E test

#### 4.3 Vytvoriť User Detail s Role Management

**Súbor:** `app/(admin-protected)/users/[id]/page.tsx`

Pridať sekciu pre správu rolí:

```typescript
<div className="bg-white shadow rounded-lg p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold" data-testid="roles-section-title">
      Roly
    </h2>
    <button
      onClick={() => setShowAddRoleModal(true)}
      className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700"
      data-testid="add-role-button"
    >
      Pridať rolu
    </button>
  </div>

  <div className="space-y-3">
    {user.roles.map((roleAssignment) => (
      <div
        key={roleAssignment.id}
        className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
        data-testid={`role-card-${roleAssignment.id}`}
      >
        <div className="flex items-center gap-3">
          <RoleBadge role={roleAssignment.role} />
          <div className="text-sm text-gray-600">
            {roleAssignment.institutionId ? (
              <span>Pre rezort: {roleAssignment.institutionName}</span>
            ) : (
              <span>Globálna rola</span>
            )}
          </div>
        </div>
        <button
          onClick={() => handleRemoveRole(roleAssignment.id)}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
          data-testid={`remove-role-${roleAssignment.id}`}
        >
          Odstrániť
        </button>
      </div>
    ))}
  </div>
</div>
```

**E2E test:** `tests/e2e/admin/users-detail-roles.spec.ts`

```typescript
test('should add role to user', async ({ page }) => {
  await loginAsSuperadmin(page)

  // Create test user
  const userId = await createTestUser()

  await page.goto(`http://localhost:5600/users/${userId}`)

  // Click "Add Role"
  await page.getByTestId('add-role-button').click()

  // Select role
  await page.getByTestId('role-select').selectOption(UserRole.GESTOR)

  // Submit
  await page.getByTestId('save-role-button').click()

  // Verify role was added
  await expect(page.getByTestId('role-badge-gestor')).toBeVisible()
})

test('should remove role from user', async ({ page }) => {
  await loginAsSuperadmin(page)

  // Create test user with role
  const { userId, roleId } = await createTestUserWithRole()

  await page.goto(`http://localhost:5600/users/${userId}`)

  // Click remove
  await page.getByTestId(`remove-role-${roleId}`).click()

  // Confirm
  await page.getByTestId('confirm-button').click()

  // Verify role was removed
  await expect(page.getByTestId(`role-card-${roleId}`)).not.toBeVisible()
})
```

**Checklist:**
- [ ] Pridať Role Management sekciu
- [ ] Implementovať Add Role modal
- [ ] Implementovať Remove Role s ConfirmModal
- [ ] Napísať E2E testy (minimálne 4 testy)

---

### 5. Sidebar multi-role (2-3 hodiny)

**Súbor:** `components/admin/Sidebar.tsx`

```typescript
// Filter navigation based on user's roles
const userRoles = session.user.roles.map(r => r.role)

const filteredNavigation = navigation.filter(item =>
  item.roles.some(role => userRoles.includes(role))
)
```

**E2E test:** `tests/e2e/admin/sidebar-multirole.spec.ts`

```typescript
test('should show menu items for all user roles', async ({ page }) => {
  // Create user with ADMIN + GESTOR roles
  const { userId, cookie } = await createUserWithRoles([UserRole.ADMIN, UserRole.GESTOR])

  await page.goto('http://localhost:5600/dashboard', {
    headers: { Cookie: cookie }
  })

  // Should see ADMIN menu items
  await expect(page.getByTestId('nav-users')).toBeVisible()

  // Should see GESTOR menu items
  await expect(page.getByTestId('nav-tests')).toBeVisible()
})
```

**Checklist:**
- [ ] Aktualizovať sidebar filtering
- [ ] Napísať E2E test

---

### 6. VK Selectors multi-role (3-4 hodiny)

#### 6.1 Gestor Selector

**Súbor:** `components/vk/GestorSelectModal.tsx`

API call už podporuje multi-role:

```typescript
const res = await fetch('/api/admin/users?roles=GESTOR&status=active')
```

Backend vracia používateľov s GESTOR rolou (už funguje).

**E2E test:** `tests/e2e/admin/vk-gestor-selector.spec.ts`

```typescript
test('should show users with GESTOR role in selector', async ({ page }) => {
  // Create user with multiple roles including GESTOR
  const user = await createUserWithRoles([UserRole.ADMIN, UserRole.GESTOR])

  await loginAsAdmin(page)
  await page.goto('http://localhost:5600/vk/[some-vk-id]')

  // Open gestor selector
  await page.getByTestId('assign-gestor-button').click()

  // User should appear in list
  const userOption = page.getByText(user.name)
  await expect(userOption).toBeVisible()

  // Should show all roles
  await expect(page.getByTestId('role-badge-admin')).toBeVisible()
  await expect(page.getByTestId('role-badge-gestor')).toBeVisible()
})
```

**Checklist:**
- [ ] Overiť že API funguje správne
- [ ] Napísať E2E test

---

### 7. Smoke Tests (1-2 hodiny)

Po dokončení všetkých krokov spustiť:

```bash
# 1. Backend testy
npm run test:backend

# 2. Dashboard smoke test
npm run test:e2e -- tests/e2e/admin/dashboard.spec.ts

# 3. User management tests
npm run test:e2e -- tests/e2e/admin/users-list.spec.ts
npm run test:e2e -- tests/e2e/admin/users-detail-roles.spec.ts

# 4. All E2E tests
npm run test:e2e
```

**Checklist:**
- [ ] Všetky backend testy prechádzajú
- [ ] Dashboard test prechádza
- [ ] User management testy prechádzajú
- [ ] Žiadne regression bugs

---

## Zhrnutie checklist

### Databáza
- [ ] Pridať `UserRoleAssignment` model
- [ ] Vytvoriť migráciu
- [ ] Migrovať existujúce roly
- [ ] Aktualizovať seed.ts

### Auth
- [ ] Aktualizovať NextAuth typy
- [ ] Aktualizovať auth.ts callbacks
- [ ] Prepísať lib/auth.ts

### Backend API
- [ ] Aktualizovať GET /api/admin/users
- [ ] Aktualizovať GET /api/admin/users/[id]
- [ ] Vytvoriť POST /api/admin/users/[id]/roles
- [ ] Vytvoriť DELETE /api/admin/users/[id]/roles

### Backend Testy
- [ ] users-api.test.ts
- [ ] users-roles-api.test.ts (NOVÝ)
- [ ] Minimálne 15 testov

### Frontend
- [ ] RoleBadge komponent
- [ ] User List (zobrazenie rolí)
- [ ] User Detail (správa rolí)
- [ ] Sidebar multi-role

### E2E Testy
- [ ] users-list.spec.ts
- [ ] users-detail-roles.spec.ts (NOVÝ)
- [ ] sidebar-multirole.spec.ts (NOVÝ)
- [ ] vk-gestor-selector.spec.ts
- [ ] Minimálne 10 testov

### Final
- [ ] Všetky backend testy prechádzajú
- [ ] Všetky E2E testy prechádzajú
- [ ] Dashboard smoke test prechádza
- [ ] Žiadne emoji v kóde (len Heroicons)
- [ ] data-testid všade

---

## Časový odhad FÁZY 1

| Krok | Trvanie |
|------|---------|
| 1. DB migrácia | 2-3 h |
| 2. Auth Core | 3-4 h |
| 3. User API + Backend testy | 6-8 h |
| 4. User UI + E2E testy | 8-10 h |
| 5. Sidebar | 2-3 h |
| 6. VK Selectors | 3-4 h |
| 7. Smoke tests | 1-2 h |

**CELKOM:** 25-34 hodín

**S bufferom (+20%):** 30-40 hodín

---

## Poznámky

- Po dokončení FÁZY 1 máme funkčný multi-role systém
- `User.role` field ostáva pre backwards compatibility
- Obrazovky pre GESTOR/KOMISIA sa implementujú v FÁZE 2
- Všetky testy musia prechádzať pred pokračovaním
