# Multi-Role Implementation - 2025-10-10

## Zhrnutie

Dnes som implementoval základnú infraštruktúru pre multi-role systém - User List a API pre User Detail s role management.

## Splnené úlohy

### 1. Databázová vrstva ✅

**Vytvorené:**
- `prisma/migrations/20251010101449_add_user_role_assignments/migration.sql`
- `UserRoleAssignment` model v Prisma schema
- M:N vzťah User ↔ Role s voliteľnou inštitucionálnou väzbou
- Data migration script `scripts/migrate-user-roles.ts`

**Unique constraint:**
```prisma
@@unique([userId, role, institutionId])
```

**Výsledok:**
- ✅ 42 existujúcich používateľov migrovaných
- ✅ Každý používateľ má teraz UserRoleAssignment záznam

### 2. Autentifikácia ✅

**`auth.ts` (riadky 45-50, 82-86):**
```typescript
userRoles: {
  include: {
    institution: true,
  },
},
```

**`types/next-auth.d.ts` (riadky 17-21, 34-38, 53-57):**
```typescript
roles: Array<{
  role: UserRole
  institutionId: string | null
  institutionName: string | null
}>
```

**`lib/auth.ts` - Nové helper funkcie:**
- `hasRole(role, institutionId?)` - s backward compatibility
- `hasAnyRole(roles[], institutionId?)` - kontrola viacerých rolí
- `hasAllRoles(roles[], institutionId?)` - musí mať všetky role
- `getUserRoles()` - vráti pole rolí

###  3. RoleBadge komponent ✅

**Súbor:** `components/RoleBadge.tsx`

**Farby:**
- SUPERADMIN: `bg-red-100 text-red-800`
- ADMIN: `bg-blue-100 text-blue-800`
- GESTOR: `bg-green-100 text-green-800`
- KOMISIA: `bg-orange-100 text-orange-800`
- UCHADZAC: `bg-gray-100 text-gray-800`

**Props:**
```typescript
type RoleBadgeProps = {
  role: UserRole
  institutionName?: string | null
  size?: 'sm' | 'md'
}
```

### 4. User List API ✅

**Súbor:** `app/api/admin/users/route.ts`

**Zmeny (riadky 113-117, 144-150):**
```typescript
// Include userRoles in query
userRoles: {
  include: {
    institution: true,
  },
},

// Format response with roles
roles: user.userRoles.map((ur) => ({
  id: ur.id,
  role: ur.role,
  institutionId: ur.institutionId,
  institutionName: ur.institution?.name || null,
  assignedAt: ur.assignedAt,
})),
```

### 5. User List UI ✅

**Súbor:** `app/(admin-protected)/users/page.tsx`

**Importy (riadky 8, 12):**
```typescript
import { RoleBadge } from '@/components/RoleBadge'
import { UserRole } from '@prisma/client'
```

**Role column (riadky 83-105):**
```typescript
{
  accessorKey: 'role',
  header: 'Role',
  cell: ({ row }) => {
    const user = row.original
    if (user.roles && user.roles.length > 0) {
      return (
        <div className="flex flex-wrap gap-1" data-testid={`user-roles-${user.id}`}>
          {user.roles.map((r) => (
            <RoleBadge
              key={r.id}
              role={r.role as UserRole}
              institutionName={r.institutionName}
              size="sm"
            />
          ))}
        </div>
      )
    }
    return <RoleBadge role={user.role as UserRole} size="sm" />
  },
},
```

### 6. User Detail API ✅

**Súbory vytvorené:**
- `app/api/admin/users/[id]/route.ts` - GET user detail
- `app/api/admin/users/[id]/roles/route.ts` - POST assign role
- `app/api/admin/users/[id]/roles/[roleId]/route.ts` - DELETE remove role

**GET /api/admin/users/[id]:**
- Načíta detail používateľa s `userRoles` a `gestorVKs`
- RBAC: Admin vidí len používateľov zo svojich inštitúcií
- Vráti pole rolí s inštitúciami

**POST /api/admin/users/[id]/roles:**
- Validácia: role je povinná, musí byť platná
- RBAC: Len SUPERADMIN môže prideliť SUPERADMIN rolu
- RBAC: Admin môže prideliť role len v rámci svojich inštitúcií
- Check: Rola už nie je priradená (unique constraint)
- Vráti 201 Created s novým role assignment

**DELETE /api/admin/users/[id]/roles/[roleId]:**
- Check: Role assignment existuje a patrí používateľovi
- RBAC: Len SUPERADMIN môže odstrániť SUPERADMIN rolu
- RBAC: Admin môže odstrániť len inštitucionálne role zo svojich inštitúcií
- Vráti 200 OK

### 7. Hooks ✅

**Súbor:** `hooks/useUsers.ts`

**User type (riadky 16-22):**
```typescript
roles: Array<{
  id: string
  role: string
  institutionId: string | null
  institutionName: string | null
  assignedAt: string
}>
```

## Naučené lekcie

### 1. Data migration je kritická

Pri zmene auth systému musím zabezpečiť, aby:
- Existujúci používatelia mali UserRoleAssignment záznamy
- Inak prihlásenie zlyhá (session vyžaduje `roles` array)
- Script `migrate-user-roles.ts` musí bežať HNEĎ po DB migrácii

### 2. Backward compatibility v auth helpers

Funkcie ako `hasRole()` musia podporovať:
- Starý systém: `user.role === role`
- Nový systém: `user.roles.some(r => r.role === role)`

To zaručí, že existujúci kód nebude zlyhávaťpočas migrácie.

### 3. Unique constraint na kombinácii polí

```prisma
@@unique([userId, role, institutionId])
```

Toto zabraňuje duplikátom, ale umožňuje:
- Rovnakú rolu pre rôzne inštitúcie
- Rôzne role pre tú istú inštitúciu

## Štatistiky

- **Súbory vytvorené:** 4 (RoleBadge, 3x API routes)
- **Súbory upravené:** 8
- **Riadkov pridaných:** ~580
- **Riadkov odstránených:** ~25
- **Databázové migrácie:** 1
- **Data migration scriptov:** 1 (42 používateľov)

## Ďalšie kroky

### Zostáva implementovať:

1. **User Detail UI stránka** (`app/(admin-protected)/users/[id]/page.tsx`)
   - Zobrazenie detailov používateľa
   - Zoznam priradených rolí
   - Tlačidlo "Pridať rolu"
   - Tlačidlo "Odstrániť" pri každej role

2. **RoleAssignmentModal komponent**
   - Výber roly (ADMIN, GESTOR, KOMISIA)
   - Voliteľný výber inštitúcie
   - Validácia (SUPERADMIN len pre SUPERADMIN)
   - Toast notifikácie

3. **Backend testy** (`tests/backend/users-roles-api.test.ts`)
   - POST assign role - all fields, duplicate, invalid role
   - DELETE remove role - success, not found, unauthorized
   - GET user detail - with roles, RBAC

4. **E2E testy** (`tests/e2e/admin/user-detail.spec.ts`)
   - Navigate to user detail
   - Display roles correctly
   - Add new role
   - Remove role
   - Validation errors

5. **Dokumentácia**
   - Aktualizovať `docs/26-multi-role-phase1.md` s progress
   - Vytvoriť `docs/27-multi-role-phase1-testing.md` pre testovanie

## Problémy a riešenia

### Problém: E2E testy zlyhávajú pri prihlásení

**Symptómy:**
- `Nesprávne prihlasovacie údaje` error
- POST /api/auth/callback/credentials vracia 200, ale test timeout

**Root cause:**
- `auth.ts` načíta `userRoles`, ale používatelia nemali UserRoleAssignment záznamy
- Session callback očakával `roles` array, ale nedostal ho

**Riešenie:**
- Vytvoril som `scripts/migrate-user-roles.ts`
- Spustil som `npx tsx scripts/migrate-user-roles.ts`
- Všetkých 42 používateľov úspešne migrovaných

### Problém: SSH tunnel timeout

**Symptómy:**
- "Can't reach database server at `localhost:5601`"
- Prisma connection pool errors

**Riešenie:**
- SSH tunnel beží, ale má idle timeout
- Reštartovať dev server ak sa to stane
- Tento problém je známy z `docs/daily/2025-10-08.md`

## Záver

Základná infraštruktúra pre multi-role je hotová:
- ✅ Databázová vrstva s migráciami
- ✅ Autentifikácia s multi-role session
- ✅ User List s multi-role zobrazením
- ✅ API pre správu rolí

Zostáva implementovať User Detail UI a testy.
