# Multi-Role Migrácia - Analýza a Implementačný Plán

## Súhrn

Aktuálne systém podporuje **jednu rolu na používateľa** (`User.role: UserRole`).
Cieľ: Migrovať na **multi-role systém**, kde jeden používateľ môže mať viacero rolí súčasne.

**Príklady use-cases:**
- Používateľ môže byť súčasne `ADMIN` + `GESTOR` + `KOMISIA`
- Používateľ môže byť `GESTOR` pre jednu inštitúciu a `KOMISIA` pre inú

---

## ⚠️ KRITICKÉ POŽIADAVKY (z CLAUDE.md)

**Pred implementáciou si MUSÍŠ prečítať tieto pravidlá z CLAUDE.md:**

### 1. Žiadne Emoji v UI kóde
- ❌ **NEPOUŽÍVAŤ** emoji v React komponentoch
- ✅ **POUŽIŤ** Heroicons z `@heroicons/react/24/outline`
- Emoji v obrazovkách/dokumentácii sú len **ilustračné**
- Dokumentácia: https://heroicons.com/

### 2. Povinné testovanie po každej zmene
- ✅ **Backend testy** pre každý API endpoint (vitest)
- ✅ **E2E testy** pre každý formulár (playwright)
- ✅ **Smoke test** po každej fáze: `npm run test:e2e -- tests/e2e/admin/dashboard.spec.ts`

### 3. Backend API testy - Minimálne coverage
Pre každý CRUD endpoint:
- **GET (list):** search, filter, sort, pagination, count, relations
- **POST (create):** all fields, required only, duplicate error, invalid FK
- **PATCH (update):** each field, set null, duplicate error, updatedAt check
- **DELETE:** success, cascade behavior, count related records
- **GET (single):** by ID, non-existent ID, relations

Návod: `docs/patterns/backend-testing.md`

### 4. E2E testy - Minimálne coverage
Pre každý formulár:
1. Otvorenie modalu/formulára
2. Validácia každého povinného poľa (samostatný test!)
3. **Úspešné vytvorenie LEN s povinnými poľami** (nepovinné prázdne!)
4. **Úspešné vytvorenie so VŠETKÝMI poľami**
5. Zatvorenie modalu (cancel)
6. Duplikát (ak relevantné)

Návod: `docs/patterns/e2e-form-tests.md`

### 5. Formuláre - Konzistentný pattern
- ✅ Inline validácia (error message pod každým inputom)
- ✅ Auto-scroll na prvý error
- ✅ `data-testid` pre všetky elementy
- ✅ Toast notifikácie (`react-hot-toast`)
- ❌ **NIKDY** `alert()`, `confirm()`, `prompt()`
- ✅ Používať `ConfirmModal` komponent

### 6. data-testid všade
- ✅ Každá stránka: `data-testid="[názov]-page"`
- ✅ Každý input: `data-testid="[názov]-input"`
- ✅ Každý button: `data-testid="[akcia]-button"`
- ✅ Každá error správa: `data-testid="[názov]-error"`
- ❌ **90% testov NESMIE** používať text-based selectors

### 7. Existujúce test patterny
- ✅ **VŽDY** sa pozri na existujúce testy pred písaním nových
- ✅ Použiť `loginAsAdmin`, `loginAsSuperadmin` z `tests/helpers/auth.ts`
- ✅ Skopírovať pattern z `tests/e2e/admin/test-detail.spec.ts`
- ❌ **NIKDY** nevymýšľaj vlastné login patterny

---

## 1. Aktuálny Stav Systému

### 1.1 Databázová Schéma

**Aktuálna definícia:**

```prisma
// prisma/schema.prisma

enum UserRole {
  SUPERADMIN  // Správca celého systému, spravuje rezorty a adminov
  ADMIN       // Správca rezortu, vytvára VK
  GESTOR      // Spravuje konkrétne VK
  KOMISIA     // Hodnotí uchádzačov
  UCHADZAC    // Dočasný účet pre VK
}

model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String?  @unique
  password      String?
  name          String
  surname       String
  role          UserRole  // ❌ Single role - toto je hlavný problém
  // ... ďalšie fieldy
}
```

**Problém:**
- `role` je jednoduchý enum field, nie relation
- Jeden používateľ môže mať len jednu rolu
- Zmena roly prepíše starú rolu

---

### 1.2 Autentifikácia a Session (NextAuth.js)

**Session typ:**

```typescript
// types/next-auth.d.ts

interface Session {
  user: {
    id: string
    username: string
    role: UserRole  // ❌ Single role
    institutions: Array<{
      id: string
      code: string
      name: string
    }>
  } & DefaultSession['user']
}
```

**Auth callback:**

```typescript
// auth.ts

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id
      token.username = user.username
      token.role = user.role  // ❌ Single role stored in JWT
      token.institutions = user.institutions
    }
    return token
  },
  async session({ session, token }) {
    if (token) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.role = token.role as UserRole  // ❌ Single role in session
      session.user.institutions = token.institutions as Array<...>
    }
    return session
  }
}
```

---

### 1.3 Autorizačné Helper Funkcie

**lib/auth.ts:**

```typescript
// ❌ Pôvodné funkcie kontrolujú len jednu rolu
export async function hasRole(role: UserRole) {
  const user = await getCurrentUser()
  return user?.role === role
}

export async function hasAnyRole(roles: UserRole[]) {
  const user = await getCurrentUser()
  return user && roles.includes(user.role)
}

export async function isSuperadmin() {
  return hasRole(UserRole.SUPERADMIN)
}

export async function isAdminOrAbove() {
  return hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
}
```

**Problém:**
- Všetky funkcie predpokladajú `user.role` ako single value
- Po migrácii na multi-role prestanú fungovať

---

### 1.4 API Routes - Autorizácia

**Príklad zo 116 súborov s `user.role` kontrolou:**

```typescript
// app/api/admin/users/route.ts

export async function GET(request: NextRequest) {
  const session = await auth()

  // ❌ Kontrola single role
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ❌ RBAC kontrola single role
  if (session.user.role === 'ADMIN') {
    // Filter data based on institutions
  }
}

export async function POST(request: NextRequest) {
  // ❌ Kontrola single role
  if (role === 'SUPERADMIN' && session.user.role !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: 'Only superadmin can create superadmin users' },
      { status: 403 }
    )
  }
}
```

**Podobné kontroly v:**
- `app/api/admin/tests/route.ts`
- `app/api/admin/vk/[id]/route.ts`
- `app/api/superadmin/institutions/route.ts`
- A ďalších ~113 súboroch

---

### 1.5 Frontend - UI Komponenty

**components/admin/Sidebar.tsx:**

```typescript
type NavItem = {
  name: string
  href?: string
  icon: any
  roles: string[]  // ❌ Array rolí, ale kontrola je single role
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon,
    roles: ['SUPERADMIN', 'ADMIN'] },
  { name: 'Rezorty', href: '/institutions', icon: BuildingOfficeIcon,
    roles: ['SUPERADMIN'] },
  // ...
]

// ❌ Kontrola single role
const filteredNavigation = navigation.filter(item =>
  item.roles.includes(session.user.role)
)
```

**Problém:**
- UI sa filtruje podľa single role
- Používateľ s viacerými rolami by videl len položky pre svoju "hlavnú" rolu

---

## 2. Cieľový Stav - Multi-Role Systém

### 2.1 Nová Databázová Schéma

**Vytvorenie UserRole join tabuľky:**

```prisma
// prisma/schema.prisma

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

  // ❌ REMOVE this field:
  // role          UserRole

  // ✅ NEW: M:N relation to roles
  userRoles     UserRoleAssignment[]

  // ... ďalšie fieldy
}

// ✅ NEW: Many-to-Many join table
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

// Update Institution model to include role assignments
model Institution {
  id          String   @id @default(cuid())
  // ... existing fields

  roleAssignments UserRoleAssignment[]
}
```

**Dôležité:**
- Enum `UserRole` ostáva nezmenený (backward compatibility)
- `User.role` field sa **odstráni** (breaking change!)
- Nová tabuľka `UserRoleAssignment` pre M:N vzťah
- Možnosť priradenia roly pre konkrétnu inštitúciu

---

### 2.2 Migračný Script

```sql
-- Migration: Add multi-role support

-- 1. Create new UserRoleAssignment table
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
WHERE "role" IS NOT NULL;

-- 3. Drop old role column
ALTER TABLE "users" DROP COLUMN "role";

-- 4. Add indexes
CREATE INDEX "user_role_assignments_userId_idx" ON "user_role_assignments"("userId");
CREATE INDEX "user_role_assignments_role_idx" ON "user_role_assignments"("role");
CREATE INDEX "user_role_assignments_institutionId_idx" ON "user_role_assignments"("institutionId");
```

---

### 2.3 Nová Session Štruktúra

```typescript
// types/next-auth.d.ts

import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    username: string
    email: string | null
    name: string
    surname: string

    // ✅ NEW: Array of roles instead of single role
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

      // ✅ NEW: Array of roles
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

    // ✅ NEW: Array of roles
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

---

### 2.4 Nový Auth Callback

```typescript
// auth.ts

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
            // ✅ NEW: Include role assignments
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

        // ✅ NEW: Return user with roles array
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
        token.roles = user.roles  // ✅ Store roles array in JWT
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

---

### 2.5 Nové Autorizačné Helper Funkcie

```typescript
// lib/auth.ts

import { auth } from '@/auth'
import { UserRole } from '@prisma/client'

/**
 * Get the current session on the server
 */
export async function getSession() {
  return await auth()
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * ✅ NEW: Check if user has specific role
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
 * ✅ NEW: Check if user has any of the specified roles
 * @param roles - Array of roles to check
 * @param institutionId - Optional institution ID for institution-specific role check
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
 * ✅ NEW: Check if user has ALL specified roles
 */
export async function hasAllRoles(roles: UserRole[]) {
  const user = await getCurrentUser()
  if (!user) return false

  const userRoleSet = new Set(user.roles.map(r => r.role))
  return roles.every(role => userRoleSet.has(role))
}

/**
 * ✅ NEW: Get all user's roles
 */
export async function getUserRoles() {
  const user = await getCurrentUser()
  return user?.roles ?? []
}

/**
 * ✅ NEW: Get user's roles for specific institution
 */
export async function getUserRolesForInstitution(institutionId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  return user.roles.filter(r =>
    r.institutionId === institutionId || r.institutionId === null
  )
}

/**
 * Check if user is superadmin
 */
export async function isSuperadmin() {
  return hasRole(UserRole.SUPERADMIN)
}

/**
 * ✅ UPDATED: Check if user is admin or superadmin
 * Checks for global roles (not institution-specific)
 */
export async function isAdminOrAbove() {
  return hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
}

/**
 * Check if user belongs to specific institution
 */
export async function belongsToInstitution(institutionId: string) {
  const user = await getCurrentUser()
  return user?.institutions.some((i) => i.id === institutionId) ?? false
}

/**
 * Get user's institutions
 */
export async function getUserInstitutions() {
  const user = await getCurrentUser()
  return user?.institutions ?? []
}

/**
 * ✅ NEW: Check if user has higher role than specified role
 * Role hierarchy: SUPERADMIN > ADMIN > GESTOR > KOMISIA > UCHADZAC
 */
export async function hasHigherRoleThan(targetRole: UserRole) {
  const roleHierarchy: Record<UserRole, number> = {
    SUPERADMIN: 5,
    ADMIN: 4,
    GESTOR: 3,
    KOMISIA: 2,
    UCHADZAC: 1,
  }

  const user = await getCurrentUser()
  if (!user) return false

  const userHighestRole = Math.max(
    ...user.roles.map(r => roleHierarchy[r.role])
  )
  const targetRoleLevel = roleHierarchy[targetRole]

  return userHighestRole > targetRoleLevel
}
```

---

## 3. Zmeny v API Routes

### 3.1 Príklad: User Management API

**PRED (single role):**

```typescript
// app/api/admin/users/route.ts

export async function GET(request: NextRequest) {
  const session = await auth()

  // ❌ Old: Single role check
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ❌ Old: RBAC based on single role
  if (session.user.role === 'ADMIN') {
    const userInstitutionIds = session.user.institutions.map(i => i.id)
    where.institutions = {
      some: {
        institutionId: {
          in: userInstitutionIds,
        },
      },
    }
  }
}
```

**PO (multi-role):**

```typescript
// app/api/admin/users/route.ts

import { hasAnyRole, hasRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()

  // ✅ NEW: Multi-role check using helper
  const canAccess = await hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
  if (!canAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ NEW: RBAC based on highest role
  const isSuperadmin = await hasRole(UserRole.SUPERADMIN)
  if (!isSuperadmin) {
    // User is ADMIN (or lower) - filter by institutions
    const userInstitutionIds = session.user.institutions.map(i => i.id)
    where.institutions = {
      some: {
        institutionId: {
          in: userInstitutionIds,
        },
      },
    }
  }
}

export async function POST(request: NextRequest) {
  const { role } = await request.json()

  // ✅ NEW: Only users with SUPERADMIN role can create SUPERADMIN users
  if (role === 'SUPERADMIN') {
    const isSuperadmin = await hasRole(UserRole.SUPERADMIN)
    if (!isSuperadmin) {
      return NextResponse.json(
        { error: 'Only superadmin can create superadmin users' },
        { status: 403 }
      )
    }
  }
}
```

---

### 3.2 Príklad: VK Detail API

**PRED (single role):**

```typescript
// app/api/admin/vk/[id]/route.ts

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()

  // ❌ Old: Single role check
  if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

**PO (multi-role):**

```typescript
// app/api/admin/vk/[id]/route.ts

import { hasAnyRole } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()

  // ✅ NEW: Multi-role check
  const canAccess = await hasAnyRole([
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.GESTOR
  ])

  if (!canAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

---

## 4. Zmeny vo Frontend Komponentoch

### 4.1 Sidebar Navigation

**PRED (single role):**

```typescript
// components/admin/Sidebar.tsx

const filteredNavigation = navigation.filter(item =>
  item.roles.includes(session.user.role)  // ❌ Single role check
)
```

**PO (multi-role):**

```typescript
// components/admin/Sidebar.tsx

const userRoles = session.user.roles.map(r => r.role)

const filteredNavigation = navigation.filter(item =>
  item.roles.some(role => userRoles.includes(role))  // ✅ Multi-role check
)
```

---

### 4.2 User Detail Page

**Nové UI komponenty:**

```typescript
// app/(admin-protected)/users/[id]/page.tsx

// ✅ Display all user roles
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Roly používateľa
  </label>
  <div className="flex flex-wrap gap-2">
    {user.roles.map((roleAssignment, idx) => (
      <div
        key={idx}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
      >
        <span>{roleAssignment.role}</span>
        {roleAssignment.institutionId && (
          <span className="text-xs text-blue-600">
            ({institutions.find(i => i.id === roleAssignment.institutionId)?.name})
          </span>
        )}
      </div>
    ))}
  </div>
</div>
```

---

## 5. Zmeny v API Endpoints

### 5.1 User Create/Update API

**Nový endpoint na pridanie/odobratie role:**

```typescript
// app/api/admin/users/[id]/roles/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// POST /api/admin/users/:id/roles - Add role to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // Only SUPERADMIN and ADMIN can manage roles
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
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const session = await auth()

    const canManageRoles = await hasAnyRole([UserRole.SUPERADMIN, UserRole.ADMIN])
    if (!canManageRoles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if role assignment exists
    const roleAssignment = await prisma.userRoleAssignment.findUnique({
      where: { id: params.roleId },
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

    // Delete role assignment
    await prisma.userRoleAssignment.delete({
      where: { id: params.roleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/users/:id/roles/:roleId error:', error)
    return NextResponse.json(
      { error: 'Failed to remove role' },
      { status: 500 }
    )
  }
}
```

---

### 5.2 User List API Update

```typescript
// app/api/admin/users/route.ts

export async function GET(request: NextRequest) {
  // ... existing code

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
      // ✅ NEW: Include role assignments
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

    // ✅ NEW: Return roles array
    roles: user.userRoles.map(ur => ({
      id: ur.id,
      role: ur.role,
      institutionId: ur.institutionId,
    })),

    active: user.active,
    note: user.note,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    passwordSetToken: user.passwordSetToken,
    institutions: user.institutions.map((ui) => ({
      id: ui.institution.id,
      code: ui.institution.code,
      name: ui.institution.name,
    })),
    vkCount: user.gestorVKs.length,
  }))

  return NextResponse.json({
    users: formattedUsers,
    pagination: { ... },
  })
}
```

---

## 6. Kompletný Zoznam Súborov na Úpravu

### 6.1 Databáza a Schéma

| Súbor | Typ zmeny | Popis |
|-------|-----------|-------|
| `prisma/schema.prisma` | **BREAKING** | Odstrániť `User.role`, pridať `UserRoleAssignment` model |
| `prisma/migrations/xxx_multi_role.sql` | **NEW** | Migračný script pre multi-role |
| `prisma/seed.ts` | UPDATE | Upraviť seed data na multi-role |

---

### 6.2 Autentifikácia a Typy

| Súbor | Typ zmeny | Popis |
|-------|-----------|-------|
| `types/next-auth.d.ts` | **BREAKING** | `role: UserRole` → `roles: Array<{...}>` |
| `auth.ts` | **BREAKING** | Upraviť callbacks pre multi-role |
| `lib/auth.ts` | **BREAKING** | Prepísať všetky helper funkcie |

---

### 6.3 API Routes (116 súborov s `user.role`)

**Kategórie API endpoints:**

#### A) Admin Management APIs
- `app/api/admin/users/route.ts` - **HIGH PRIORITY**
- `app/api/admin/users/[id]/route.ts` - **HIGH PRIORITY**
- `app/api/admin/users/[id]/roles/route.ts` - **NEW**

#### B) VK Management APIs
- `app/api/admin/vk/route.ts`
- `app/api/admin/vk/[id]/route.ts`
- `app/api/admin/vk/[id]/validation/route.ts`
- `app/api/admin/vk/[id]/gestor/route.ts`
- `app/api/admin/vk/[id]/commission/route.ts`
- `app/api/admin/vk/[id]/commission/members/route.ts`
- `app/api/admin/vk/[id]/commission/members/[memberId]/route.ts`
- `app/api/admin/vk/[id]/candidates/route.ts`
- `app/api/admin/vk/[id]/candidates/[candidateId]/route.ts`
- `app/api/admin/vk/[id]/candidates/available/route.ts`

#### C) Test Management APIs
- `app/api/admin/tests/route.ts`
- `app/api/admin/tests/[id]/route.ts`
- `app/api/admin/tests/[id]/clone/route.ts`
- `app/api/admin/tests/import/route.ts`
- `app/api/admin/tests/import/save/route.ts`
- `app/api/admin/tests/categories/route.ts`
- `app/api/admin/tests/categories/[id]/route.ts`

#### D) Institution Management APIs
- `app/api/admin/institutions/route.ts`
- `app/api/admin/institutions/[id]/route.ts`
- `app/api/superadmin/institutions/route.ts`
- `app/api/superadmin/institutions/[id]/route.ts`
- `app/api/superadmin/institutions/[id]/toggle-active/route.ts`

#### E) Other Admin APIs
- `app/api/admin/dashboard/route.ts`
- `app/api/admin/dashboard/stats/route.ts`
- `app/api/admin/applicants/route.ts`
- `app/api/admin/applicants/[id]/route.ts`
- `app/api/admin/test-categories/route.ts`
- `app/api/admin/test-categories/[id]/route.ts`
- `app/api/admin/test-types/route.ts`
- `app/api/admin/test-types/[id]/route.ts`

#### F) Applicant/Practice APIs
- `app/api/applicant/login/route.ts`
- `app/api/practice/start/route.ts`
- `app/api/practice/[sessionId]/submit/route.ts`
- `app/api/practice/tests/route.ts`
- `app/api/practice/history/route.ts`

**Celkový počet API routes:** ~40+ súborov

---

### 6.4 Frontend Stránky

| Súbor | Typ zmeny | Popis |
|-------|-----------|-------|
| `app/(admin-protected)/users/page.tsx` | UPDATE | Zobraziť všetky roly v tabuľke |
| `app/(admin-protected)/users/[id]/page.tsx` | UPDATE | Zobraziť multi-role, CRUD operácie |
| `app/(admin-protected)/users/new/page.tsx` | UPDATE | Multi-select pre roly |
| `app/(admin-protected)/dashboard/page.tsx` | UPDATE | Role check |
| `app/(admin-protected)/applicants/page.tsx` | UPDATE | Role check |
| `app/(admin-protected)/applicants/[id]/page.tsx` | UPDATE | Role check |

**Celkový počet pages:** ~15+ súborov

---

### 6.5 Frontend Komponenty

| Súbor | Typ zmeny | Popis |
|-------|-----------|-------|
| `components/admin/Sidebar.tsx` | **HIGH PRIORITY** | Multi-role navigation filter |
| `components/admin/Header.tsx` | UPDATE | Zobraziť aktívnu rolu |
| `components/vk/GestorSelectModal.tsx` | UPDATE | Filter používateľov s GESTOR rolou |
| `components/vk/AddCommissionMemberModal.tsx` | UPDATE | Filter používateľov s KOMISIA rolou |
| `components/vk/AddCandidateModal.tsx` | UPDATE | Role check |

**Celkový počet komponentov:** ~10+ súborov

---

### 6.6 Hooks a Utilities

| Súbor | Typ zmeny | Popis |
|-------|-----------|-------|
| `hooks/useUsers.ts` | UPDATE | Multi-role data handling |
| `hooks/useInstitutions.ts` | UPDATE | Role-based filtering |

---

### 6.7 Testy

#### Backend Testy
- `tests/backend/users-api.test.ts` - **HIGH PRIORITY**
- `tests/backend/users-detail-api.test.ts` - **HIGH PRIORITY**
- `tests/backend/auth.test.ts` - **HIGH PRIORITY**
- `tests/backend/vk-api.test.ts`
- `tests/backend/applicants-api.test.ts`
- `tests/backend/dashboard.test.ts`

#### E2E Testy
- `tests/e2e/admin/users-create.spec.ts` - **HIGH PRIORITY**
- `tests/e2e/admin/users-detail.spec.ts` - **HIGH PRIORITY**
- `tests/e2e/admin/users-detail-role.spec.ts` - **HIGH PRIORITY**
- `tests/e2e/admin/users-list.spec.ts`
- `tests/e2e/admin/test-navigation.spec.ts`

**Celkový počet testov:** ~20+ súborov

---

## 7. Implementačný Plán - Fázy

**⚠️ DÔLEŽITÉ: Postupná implementácia**

Implementácia sa rozdelí do fáz, pričom **FÁZA 1-6 je prioritná** pre funkčnú multi-role infraštruktúru.

**Obrazovky pre iné role (GESTOR, KOMISIA) sa implementujú AŽ PO dokončení multi-role základu:**
- ❌ **NEIMPLEMENTOVAŤ TERAZ:** Dashboard pre GESTOR/KOMISIA, "Moje VK", "Hodnotenia"
- ✅ **IMPLEMENTOVAŤ TERAZ:** User Management, Role Assignment, VK Selectors

---

### FÁZA 1: Príprava a Migrácia Databázy

**Cieľ:** Zmeniť databázovú schému bez breaking changes v aplikácii

**Kroky:**
1. ✅ Vytvoriť `UserRoleAssignment` model v `schema.prisma`
2. ✅ Vytvoriť migračný script `prisma/migrations/xxx_add_multi_role.sql`
3. ✅ **NEODSTRÁŇOVAŤ** ešte `User.role` field (backwards compatibility)
4. ✅ Spustiť migráciu a preniesť existujúce roly do `UserRoleAssignment`
5. ✅ Overiť že databáza má všetky roly správne migrované
6. ✅ Aktualizovať `prisma/seed.ts` aby používal nový model

**Validácia:**
- Všetky existujúce roly sú v `UserRoleAssignment`
- Pôvodný `User.role` stále funguje
- Žiadne breaking changes

**Čas:** 2-3 hodiny

---

### FÁZA 2: Backend Core - Auth a Helper Funkcie

**Cieľ:** Aktualizovať autentifikáciu a core funkcie

**Kroky:**
1. ✅ Aktualizovať `types/next-auth.d.ts`
2. ✅ Aktualizovať `auth.ts` callbacks
3. ✅ Prepísať všetky funkcie v `lib/auth.ts`
4. ✅ Pridať nové helper funkcie (`hasAllRoles`, `getUserRoles`, atď.)
5. ✅ Vytvoriť unit testy pre `lib/auth.ts`

**Validácia:**
- Unit testy pre všetky helper funkcie prechádzajú
- Session obsahuje `roles` array
- JWT obsahuje `roles` array

**Čas:** 3-4 hodiny

---

### FÁZA 3: User Management API

**Cieľ:** Aktualizovať User CRUD APIs

**Kroky:**
1. ✅ Aktualizovať `app/api/admin/users/route.ts`
2. ✅ Aktualizovať `app/api/admin/users/[id]/route.ts`
3. ✅ Vytvoriť `app/api/admin/users/[id]/roles/route.ts` (nový endpoint)
4. ✅ Napísať backend testy pre user management
5. ✅ Vytvoriť E2E testy pre user management

**Validácia:**
- Všetky backend testy prechádzajú
- E2E testy pre user CRUD prechádzajú
- Možnosť pridať/odobrať roly cez API

**Čas:** 4-5 hodín

---

### FÁZA 4: User Management UI

**Cieľ:** Aktualizovať frontend pre user management

**Kroky:**
1. ✅ Aktualizovať `app/(admin-protected)/users/page.tsx` (zoznam)
2. ✅ Aktualizovať `app/(admin-protected)/users/[id]/page.tsx` (detail)
3. ✅ Aktualizovať `app/(admin-protected)/users/new/page.tsx` (vytvorenie)
4. ✅ Vytvoriť `components/users/RoleManager.tsx` (manage roles UI)
5. ✅ Aktualizovať `hooks/useUsers.ts`
6. ✅ Vytvoriť E2E testy pre UI

**Validácia:**
- User list zobrazuje všetky roly
- User detail umožňuje pridať/odobrať roly
- E2E testy prechádzajú

**Čas:** 5-6 hodín

---

### FÁZA 5: Sidebar a Navigácia

**Cieľ:** Aktualizovať sidebar pre multi-role

**Kroky:**
1. ✅ Aktualizovať `components/admin/Sidebar.tsx`
2. ✅ Aktualizovať `components/admin/Header.tsx`
3. ✅ Vytvoriť E2E test pre navigáciu

**Validácia:**
- Používateľ s viacerými rolami vidí všetky relevantné menu položky
- E2E test pre navigáciu prechádza

**Čas:** 2-3 hodiny

---

### FÁZA 6: VK Management APIs

**Cieľ:** Aktualizovať všetky VK-related API endpoints

**Kroky:**
1. ✅ Aktualizovať `app/api/admin/vk/route.ts`
2. ✅ Aktualizovať `app/api/admin/vk/[id]/route.ts`
3. ✅ Aktualizovať `app/api/admin/vk/[id]/gestor/route.ts`
4. ✅ Aktualizovať `app/api/admin/vk/[id]/commission/*` routes
5. ✅ Aktualizovať `app/api/admin/vk/[id]/candidates/*` routes
6. ✅ Napísať backend testy
7. ✅ Vytvoriť E2E testy

**Validácia:**
- Všetky backend testy prechádzajú
- E2E testy pre VK management prechádzajú

**Čas:** 6-8 hodín

---

### FÁZA 7: Test Management APIs

**Cieľ:** Aktualizovať Test-related APIs

**Kroky:**
1. ✅ Aktualizovať `app/api/admin/tests/route.ts`
2. ✅ Aktualizovať `app/api/admin/tests/[id]/route.ts`
3. ✅ Aktualizovať `app/api/admin/tests/import/*` routes
4. ✅ Aktualizovať `app/api/admin/tests/categories/*` routes
5. ✅ Napísať backend testy
6. ✅ Vytvoriť E2E testy

**Validácia:**
- Všetky backend testy prechádzajú
- E2E testy pre test management prechádzajú

**Čas:** 4-5 hodín

---

### FÁZA 8: Ostatné APIs

**Cieľ:** Aktualizovať zvyšné API endpoints

**Kroky:**
1. ✅ Aktualizovať institution APIs
2. ✅ Aktualizovať dashboard APIs
3. ✅ Aktualizovať applicant APIs
4. ✅ Aktualizovať practice/test APIs
5. ✅ Napísať backend testy

**Validácia:**
- Všetky backend testy prechádzajú

**Čas:** 4-5 hodín

---

### FÁZA 9: Frontend Pages Update

**Cieľ:** Aktualizovať všetky frontend stránky

**Kroky:**
1. ✅ Aktualizovať dashboard pages
2. ✅ Aktualizovať applicant pages
3. ✅ Aktualizovať VK pages
4. ✅ Aktualizovať test pages
5. ✅ Vytvoriť E2E testy

**Validácia:**
- E2E testy pre všetky stránky prechádzajú

**Čas:** 6-8 hodín

---

### FÁZA 10: Components Update

**Cieľ:** Aktualizovať všetky komponenty

**Kroky:**
1. ✅ Aktualizovať `components/vk/GestorSelectModal.tsx`
2. ✅ Aktualizovať `components/vk/AddCommissionMemberModal.tsx`
3. ✅ Aktualizovať ostatné komponenty s role checks
4. ✅ Vytvoriť E2E testy

**Validácia:**
- E2E testy pre komponenty prechádzajú

**Čas:** 3-4 hodiny

---

### FÁZA 11: BREAKING CHANGE - Odstránenie `User.role`

**Cieľ:** Odstrániť pôvodný `User.role` field

**Kroky:**
1. ✅ Vytvoriť migráciu na odstránenie `User.role` column
2. ✅ Aktualizovať `schema.prisma` - odstrániť `role` field
3. ✅ Spustiť všetky testy a opraviť zlyhania
4. ✅ Deployment na staging
5. ✅ Smoke testy na staging

**Validácia:**
- Všetky testy prechádzajú
- Aplikácia funguje na staging bez `User.role`

**Čas:** 2-3 hodiny

---

### FÁZA 12: Production Deployment

**Cieľ:** Nasadiť multi-role do produkcie

**Kroky:**
1. ✅ Vytvoriť backup databázy
2. ✅ Deployment na produkciu
3. ✅ Spustiť smoke testy
4. ✅ Monitoring a oprava urgentných bugov

**Validácia:**
- Produkcia funguje
- Smoke testy prechádzajú
- Žiadne kritické bugy

**Čas:** 2-3 hodiny + monitoring

---

## 8. Celkový Časový Odhad

| Fáza | Trvanie | Kumulatívne |
|------|---------|-------------|
| FÁZA 1: DB Migrácia | 2-3 h | 2-3 h |
| FÁZA 2: Auth Core | 3-4 h | 5-7 h |
| FÁZA 3: User API | 4-5 h | 9-12 h |
| FÁZA 4: User UI | 5-6 h | 14-18 h |
| FÁZA 5: Sidebar | 2-3 h | 16-21 h |
| FÁZA 6: VK APIs | 6-8 h | 22-29 h |
| FÁZA 7: Test APIs | 4-5 h | 26-34 h |
| FÁZA 8: Other APIs | 4-5 h | 30-39 h |
| FÁZA 9: Frontend Pages | 6-8 h | 36-47 h |
| FÁZA 10: Components | 3-4 h | 39-51 h |
| FÁZA 11: Remove User.role | 2-3 h | 41-54 h |
| FÁZA 12: Production | 2-3 h | 43-57 h |

**Celkový odhad:** **43-57 hodín práce** (5-7 pracovných dní)

**Buffer pre bugfixing:** +20% = **52-68 hodín** (6-9 pracovných dní)

---

## 9. Riziká a Mitigácie

### 9.1 Riziko: Breaking Changes

**Riziko:**
- Odstránenie `User.role` field je breaking change
- Môže rozbiť existujúce integrácie

**Mitigácia:**
- Implementovať multi-role postupne (FÁZA 1-10 bez odstránenia `User.role`)
- Testovať na staging prostredí
- Vytvoriť rollback plán

---

### 9.2 Riziko: Performance

**Riziko:**
- M:N join table môže spomaľovať queries
- Každý query na usera teraz musí joiniť `UserRoleAssignment`

**Mitigácia:**
- Pridať indexy na `UserRoleAssignment` (userId, role, institutionId)
- Používať `select` namiesto `include` kde je možné
- Cachovať role assignments v session (už implementované v JWT)

---

### 9.3 Riziko: Session Token Size

**Riziko:**
- Používateľ s 10+ rolami môže mať veľký JWT token
- Môže presiahnuť cookie limit (4KB)

**Mitigácia:**
- Limitovať počet rolí na používateľa (napr. max 5-10)
- Alternatívne: Uložiť len `userId` v JWT a fetchovať roly z DB pri každom requeste

---

### 9.4 Riziko: Regresie v Autorizácii

**Riziko:**
- Chyby v `hasRole()` / `hasAnyRole()` môžu otvoriť security diery

**Mitigácia:**
- Písať unit testy pre všetky helper funkcie
- Code review autorizačných zmien
- Security audit pred produkciou

---

## 10. Odporúčania

### 10.1 Postupná Migrácia

**Neprekáčať všetko naraz!**

1. Začať s FÁZA 1-5 (core functionality)
2. Testovať na staging
3. Pokračovať s FÁZA 6-10 (všetky APIs a UI)
4. Testovať na staging
5. FÁZA 11-12 (production deployment)

---

### 10.2 Feature Flag

**Zvážiť použitie feature flag:**

```typescript
// lib/featureFlags.ts
export const MULTI_ROLE_ENABLED = process.env.NEXT_PUBLIC_MULTI_ROLE === 'true'

// lib/auth.ts
export async function hasRole(role: UserRole) {
  const user = await getCurrentUser()
  if (!user) return false

  if (MULTI_ROLE_ENABLED) {
    return user.roles.some(r => r.role === role)
  } else {
    // Fallback to old behavior
    return user.role === role
  }
}
```

---

### 10.3 Monitoring a Logging

**Pridať monitoring:**

```typescript
// lib/monitoring.ts
import { prisma } from '@/lib/prisma'

export async function logRoleChange(
  userId: string,
  action: 'ADD' | 'REMOVE',
  role: UserRole,
  performedBy: string
) {
  await prisma.auditLog.create({
    data: {
      userId: performedBy,
      action: `ROLE_${action}`,
      entity: 'USER',
      entityId: userId,
      details: { role },
      severity: 'INFO',
    },
  })
}
```

---

## 11. Záver

Multi-role migrácia je **komplexná, ale zvládnuteľná** zmena.

**Kľúčové body:**
- ✅ Databázová schéma je pripravená (M:N relation cez `UserRoleAssignment`)
- ✅ Implementačný plán je rozdelený do 12 fáz
- ✅ Odhad: **52-68 hodín** práce (6-9 dní)
- ✅ Hlavné riziká sú identifikované s mitigáciami

**Odporúčanie:**
- Začať s FÁZA 1-5 ako MVP
- Testovať na staging prostredí
- Postupne nasadiť zvyšok

**Next Steps:**
1. Schválenie implementačného plánu
2. Vytvorenie taskov v project managemente
3. Začiatok implementácie FÁZA 1
