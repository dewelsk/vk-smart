# Role Switching Feature - Admin → Uchádzač

**Dátum:** 2025-10-10
**Autor:** Claude Code

---

## Overview

Funkcia umožňuje adminom a superadminom dočasne sa prihlásiť pod účtom uchádzača, aby videli VK z jeho perspektívy.

**Use cases:**
- Testovanie používateľskej skúsenosti
- Debugging problémov uchádzača
- Demo pre stakeholderov
- Support a troubleshooting

---

## User Flow

```
1. Admin otvorí zoznam uchádzačov (/applicants)
2. V tabuľke vedľa mena uchádzača klikne na tlačidlo "Prepnúť na uchádzača"
3. Systém overí oprávnenie (ADMIN alebo SUPERADMIN)
4. Vytvorí temporary session s uchádzačskou rolou
5. Redirect na uchádzačský dashboard
6. V headeri sa zobrazí indikátor "Dočasne prihlásený ako [Meno Uchádzača]"
7. Admin klikne na "Vrátiť sa späť" (v headeri)
8. Systém obnoví pôvodnú admin session
9. Redirect na zoznam uchádzačov
```

---

## Technická Implementácia

### 1. Session Management

**Token rozšírenie:**

```typescript
// types/next-auth.d.ts
interface JWT {
  id: string
  username: string
  role: UserRole
  roles: Array<{ role: UserRole }>

  // Temporary switch
  originalUserId?: string       // ID pôvodného admina
  originalRole?: UserRole       // Pôvodná rola admina
  switchedToUserId?: string     // ID uchádzača
  switchedToUsername?: string   // Username uchádzača
  switchedToName?: string       // Meno uchádzača
}
```

### 2. API Endpoints

#### 2.1 POST /api/admin/applicants/[id]/switch

**Request:**
```typescript
POST /api/admin/applicants/[id]/switch
```

**Authorization:**
- Iba ADMIN alebo SUPERADMIN
- Overí že user s [id] je skutočne UCHÁDZAČ

**Response:**
```typescript
{
  success: true,
  redirectTo: '/applicant/dashboard'
}
```

**Funkcia:**
1. Overí že current user je ADMIN/SUPERADMIN
2. Overí že target user existuje a má rolu UCHADZAC
3. Uloží pôvodnú session do tokenu
4. Prepne session na uchádzača
5. Vráti redirect URL

#### 2.2 POST /api/admin/switch-back

**Request:**
```typescript
POST /api/admin/switch-back
```

**Authorization:**
- Len ak je v session `originalUserId` (switched mode)

**Response:**
```typescript
{
  success: true,
  redirectTo: '/applicants'
}
```

**Funkcia:**
1. Overí že session je v switched mode
2. Obnoví pôvodnú admin session
3. Vyčistí temporary fields z tokenu
4. Vráti redirect URL

### 3. Middleware Update

**File:** `middleware.ts`

```typescript
// Ak je session v switched mode, redirect na applicant routes
if (token.switchedToUserId) {
  // Allow only /applicant/* routes
  if (!pathname.startsWith('/applicant')) {
    return NextResponse.redirect(new URL('/applicant/dashboard', request.url))
  }
} else {
  // Normal authorization logic
  // ...
}
```

### 4. UI Components

#### 4.1 Switch Button (in Applicants Table)

**File:** `app/(admin-protected)/applicants/page.tsx`

```typescript
// New action column
{
  id: 'actions',
  header: 'Akcie',
  cell: ({ row }) => (
    <button
      onClick={() => handleSwitchToApplicant(row.original.id)}
      className="text-sm text-blue-600 hover:text-blue-800"
    >
      Prepnúť na uchádzača
    </button>
  )
}
```

#### 4.2 Temporary Login Indicator (in Header)

**File:** `components/admin/Header.tsx` (alebo podobný layout component)

```tsx
{session?.user?.switchedToName && (
  <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
        <span className="text-yellow-800">
          Dočasne prihlásený ako <strong>{session.user.switchedToName}</strong>
        </span>
      </div>
      <button
        onClick={handleSwitchBack}
        className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
      >
        Vrátiť sa späť
      </button>
    </div>
  </div>
)}
```

---

## Security Considerations

### ✅ Povolené

- ADMIN prepne sa na uchádzača **svojho rezortu**
- SUPERADMIN prepne sa na **akéhokoľvek** uchádzača
- Prepnutie len na rolu UCHADZAC (nie na iných adminov)

### ❌ Zakázané

- Prepnutie na iné admin/gestor/komisiu účty
- Admin nemôže prepnúť na uchádzača **iného rezortu**
- Uchádzač sa nemôže prepnúť na nikoho

### Audit Log

Každé prepnutie sa zaznamenáva:

```typescript
await prisma.auditLog.create({
  data: {
    action: 'SWITCH_TO_APPLICANT',
    userId: adminUserId,
    targetUserId: applicantUserId,
    metadata: {
      adminUsername: session.user.username,
      applicantUsername: targetUser.username,
      timestamp: new Date(),
    },
  },
})
```

---

## Implementation Checklist

### Backend

- [ ] Extend JWT type definition (add switch fields)
- [ ] Create `POST /api/admin/applicants/[id]/switch`
- [ ] Create `POST /api/admin/switch-back`
- [ ] Update auth callbacks (jwt, session)
- [ ] Add authorization checks (ADMIN/SUPERADMIN only)
- [ ] Add audit logging
- [ ] Update middleware routing logic

### Frontend

- [ ] Add "Switch to Applicant" button in table
- [ ] Create switch handler function
- [ ] Add temporary login indicator in header
- [ ] Add "Switch back" button in header
- [ ] Add loading states
- [ ] Add error handling (toast notifications)
- [ ] Add confirmation modal (optional)

### Testing

- [ ] E2E test: Admin switches to applicant
- [ ] E2E test: Admin switches back
- [ ] E2E test: SUPERADMIN switches to any applicant
- [ ] E2E test: ADMIN cannot switch to other institution's applicant
- [ ] E2E test: GESTOR cannot use switch feature
- [ ] E2E test: Temporary indicator is visible
- [ ] Backend test: API authorization

---

## User Experience

### Visual Indicators

1. **Yellow banner** navrchu každej stránky keď je switched
2. **"Vrátiť sa späť"** button vždy viditeľný v headeri
3. **Disabled admin menu** (len applicant views)

### Error Messages

```typescript
// Unauthorized
"Nemáte oprávnenie na túto akciu"

// Invalid target user
"Používateľ nie je uchádzačom"

// Different institution (ADMIN)
"Nemôžete prepnúť na uchádzača iného rezortu"

// Already switched
"Už ste prepnutý na iného používateľa"
```

---

## Future Enhancements

1. **Session timeout** - Automatické návrat po X minútach
2. **Breadcrumb trail** - História prepnutí
3. **Multi-level switching** - Admin → Gestor → Uchádzač
4. **Read-only mode** - Prepnutý admin nemôže meniť dáta uchádzača
5. **Notification** - Email uchádzačovi že admin pristupoval k jeho účtu

---

## Related Documents

- [Role a Oprávnenia](16-role-a-opravnenia.md)
- [Multi-Role System](25-multi-role-migration.md)
- [Applicant Screens](30-applicant-screens-status.md)
