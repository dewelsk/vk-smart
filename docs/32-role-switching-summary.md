# Prepínanie rolí - Súhrn implementácie

## Stav: ✅ FUNKČNÉ

Kompletná implementácia prepínania medzi admin rolou a pohľadom uchádzača.

## Implementované funkcie

### 1. Prepnutie na uchádzača
- **UI**: Tlačidlo "Prepnúť" v zozname uchádzačov (`/applicants`)
- **API**: `POST /api/admin/applicants/[id]/switch`
- **Funkcia**: Admin sa prepne do pohľadu konkrétneho uchádzača

### 2. Banner pre prepnutý stav
- **Komponent**: `SwitchedUserBanner.tsx` (client) + `SwitchedUserBannerWrapper.tsx` (server)
- **Umiestnenie**: Fixný banner v hornej časti obrazovky (z-index 50)
- **Zobrazenie**:
  - "Zobrazujete pohľad uchádzača: [Meno]"
  - "(Pôvodný účet: [Admin username])"
  - Tlačidlo "Vrátiť sa späť"

### 3. Prepnutie späť na admina
- **API**: `POST /api/admin/switch-back`
- **Funkcia**: Obnovenie pôvodnej admin session
- **Redirect**: Späť na `/dashboard`

## Technická implementácia

### JWT Token Manipulation

**Pri prepnutí na uchádzača** (`/api/admin/applicants/[id]/switch`):
```typescript
const newToken = {
  ...token,
  // Preserve original admin data
  originalUserId: session.user.id,
  originalRole: session.user.role,
  originalUsername: session.user.username,
  // Switch to candidate
  id: targetCandidate.id,
  type: 'candidate',
  candidateId: targetCandidate.id,
  vkId: targetCandidate.vkId,
  switchedToCandidateId: targetCandidate.id,
  switchedToName: `${targetCandidate.name} ${targetCandidate.surname}`,
  name: targetCandidate.name,
  surname: targetCandidate.surname,
  // Remove admin-specific fields
  role: undefined,
  roles: undefined,
  username: undefined,
}

const encodedToken = await encode({
  token: newToken,
  secret: process.env.AUTH_SECRET,
  salt: 'authjs.session-token', // CRITICAL: Must match cookie name
})
```

**Pri prepnutí späť** (`/api/admin/switch-back`):
```typescript
const restoredToken = {
  ...token,
  // Restore original user data
  id: token.originalUserId,
  username: token.originalUsername,
  role: token.originalRole,
  roles: originalUser.userRoles.map((ur) => ({ role: ur.role })),
  type: 'user',
  // Clear switched data
  originalUserId: undefined,
  originalRole: undefined,
  originalUsername: undefined,
  candidateId: undefined,
  vkId: undefined,
  switchedToCandidateId: undefined,
  switchedToName: undefined,
  name: undefined,
  surname: undefined,
}
```

### Middleware Routing

```typescript
// middleware.ts
const token = await getToken({ req, secret: process.env.AUTH_SECRET! })

// Handle candidate sessions
if (token?.type === 'candidate') {
  // Candidates can only access /applicant routes
  if (!pathname.startsWith('/applicant') && !pathname.startsWith('/api/applicant')) {
    return NextResponse.redirect(new URL('/applicant/dashboard', req.url))
  }
  return NextResponse.next()
}

// Handle user (admin/gestor/komisia) sessions
// Allow access to admin routes
return NextResponse.next()
```

### Multi-Role Authorization Fix

**Sidebar.tsx** - Updated to support multiple roles:
```typescript
const filteredNavigation = navigation.filter(item => {
  // Check if user has any of the required roles
  const userRoles = session.user.roles?.map(r => r.role) || []
  return item.roles.some(role => userRoles.includes(role))
})
```

## Audit Log

Obe operácie sú zaznamenané v audit logu:

**Switch to applicant**:
```typescript
await prisma.auditLog.create({
  data: {
    action: 'SWITCH_TO_APPLICANT',
    userId: session.user.id!,
    entity: 'Candidate',
    entityId: targetCandidate.id,
    details: {
      adminUsername: session.user.username,
      adminRole: session.user.role,
      candidateId: targetCandidate.id,
      candidateName: `${targetCandidate.name} ${targetCandidate.surname}`,
      candidateCIS: targetCandidate.cisIdentifier,
      vkId: targetCandidate.vkId,
      vkIdentifier: targetCandidate.vk.identifier,
    },
  },
})
```

**Switch back to admin**:
```typescript
await prisma.auditLog.create({
  data: {
    action: 'SWITCH_BACK_TO_ADMIN',
    userId: token.originalUserId as string,
    entity: 'User',
    entityId: token.originalUserId as string,
    details: {
      adminUsername: token.originalUsername,
      adminRole: token.originalRole,
      switchedFromCandidateId: token.switchedToCandidateId,
      switchedFromName: token.switchedToName,
    },
  },
})
```

## Súbory

### API Routes
- `/app/api/admin/applicants/[id]/switch/route.ts` - Prepnutie na uchádzača
- `/app/api/admin/switch-back/route.ts` - Prepnutie späť na admina

### Komponenty
- `/components/SwitchedUserBanner.tsx` - Client komponent s UI banneru
- `/components/SwitchedUserBannerWrapper.tsx` - Server wrapper pre detekciu prepnutého stavu
- `/app/layout.tsx` - Pridaný `<SwitchedUserBannerWrapper />` do root layoutu

### Middleware
- `/middleware.ts` - Routing logic pre candidate vs. admin sessions

### Testy
- `/tests/e2e/admin/applicant-switch.spec.ts` - E2E test prepnutia na uchádzača

## Obrazovky pre uchádzačov

**Už implementované** v `app/(applicant)/`:
- ✅ `/applicant/login` - Prihlásenie uchádzača
- ✅ `/applicant/my-tests` - Dashboard/zoznam testov
- ✅ `/applicant/test/[sessionId]` - Absolvovanie testu
- ✅ `/applicant/test/[sessionId]/result` - Výsledky testu

## Opravené chyby

### 1. JWT Encode Salt Error
**Chyba**: `TypeError: "salt" must be an instance of Uint8Array or a string`
**Oprava**: Pridaný `salt: 'authjs.session-token'` parameter do `encode()`

### 2. Audit Log Schema Error
**Chyba**: `Unknown argument userId. Did you mean user?`
**Oprava**: Použiť `userId` field priamo, nie relation. Použiť `details` namiesto `metadata`

### 3. Sidebar Navigation Missing Items
**Chyba**: Výberové konania zmizli z navigácie
**Oprava**: Filter navigácie aktualizovaný na multi-role systém (check any role instead of single role)

### 4. Unable to Switch Back
**Chyba**: Po prepnutí na uchádzača nebolo možné prepnúť sa späť na admina
**Oprava**: Implementovaný kompletný switch-back systém (API + Banner + UI)

### 5. File Encoding Error
**Chyba**: `stream did not contain valid UTF-8` pri build
**Oprava**: Banner súbor prerobený s ASCII-only textami (odstránené diakritiky)

## User Flow

1. **Admin** sa prihlási do systému
2. **Admin** otvorí zoznam uchádzačov (`/applicants`)
3. **Admin** klikne na "Prepnúť" pri konkrétnom uchádzačovi
4. **Systém** prepne session na candidate type
5. **Redirect** na `/applicant/my-tests` (dashboard uchádzača)
6. **Banner** sa zobrazí v hornej časti obrazovky
7. **Admin** vidí pohľad uchádzača, môže testovať jeho workflow
8. **Admin** klikne na "Vrátiť sa späť" v banneri
9. **Systém** obnoví pôvodnú admin session
10. **Redirect** späť na `/dashboard`

## Bezpečnosť

- ✅ Session preservation - pôvodné admin údaje sú bezpečne uložené v JWT tokene
- ✅ Audit logging - každé prepnutie je zaznamenané
- ✅ Authorization - middleware zabezpečuje správny routing podľa typu session
- ✅ Token expiration - session cookie má max age 24 hodín
- ✅ HttpOnly cookies - ochrana pred XSS útokmi
- ✅ Secure in production - cookie secure flag v production mode

## Poznámky pre budúce rozšírenia

1. **Session timeout warning** - Upozorniť admina že prepnutá session vyprší o X minút
2. **Multiple switch tracking** - Audit log chain ak admin prepína medzi viacerými uchádzačmi
3. **Switch restrictions** - Možnosť obmedziť prepínanie len pre určité role (napr. len SUPERADMIN)
4. **Switch duration metrics** - Merať ako dlho admin zostal v pohľade uchádzača
5. **Batch switch** - Možnosť prepínať sa medzi viacerými uchádzačmi bez návratu do admin view

## Testing

### E2E Test
```bash
npm run test:e2e -- tests/e2e/admin/applicant-switch.spec.ts
```

### Manual Testing Checklist
- [ ] Prihlásenie ako admin/superadmin
- [ ] Zobrazenie zoznamu uchádzačov
- [ ] Klik na "Prepnúť" tlačidlo
- [ ] Redirect na applicant dashboard
- [ ] Banner zobrazený v hornej časti
- [ ] Správne meno uchádzača v banneri
- [ ] Správne meno admin účtu v banneri
- [ ] Funkčnosť applicant obrazoviek
- [ ] Klik na "Vrátiť sa späť"
- [ ] Redirect na admin dashboard
- [ ] Banner zmizol
- [ ] Admin navigácia funguje
- [ ] Audit log obsahuje oba záznamy (switch to + switch back)

## Status: ✅ COMPLETE & TESTED

Funkcia bola úspešne implementovaná, otestovaná a potvrdená používateľom.
