# 36. Implementačný plán: Dvojfaktorová autentifikácia a komplexné prihlasovanie

## Prehľad

Tento dokument definuje implementáciu komplexného autentifikačného systému s dvojfaktorovou autentifikáciou (2FA) podľa požiadaviek zo zadania. Systém bude implementovať rôzne úrovne zabezpečenia pre jednotlivé role používateľov.

## Požiadavky zo zadania

### Politika prihlasovania podľa rolí

1. **ADMIN** - Meno/heslo + **povinná 2FA** (TOTP/Push/Recovery kódy)
2. **GESTOR** - Meno/heslo (vygenerované adminom) + **povinná zmena hesla pri prvom prihlásení**
3. **KOMISIA** - Meno/heslo (bez 2FA)
4. **UCHÁDZAČ** - Dočasné prihlasovacie údaje (bez zmeny hesla, účet sa deaktivuje po VK)

### Bezpečnostné funkcie

- **Ochrana účtov**: Blokovanie po viacerých neúspešných pokusoch
- **Správa relácií**: Zobrazenie aktívnych relácií + možnosť ukončenia
- **Obnova prístupu**: Reset hesla cez krátkodobý odkaz
- **Recovery kódy**: Pre admina pri výpadku 2FA
- **Break-glass prístup**: Núdzový prístup schvaľovaný dvojicou správcov

---

## Navrhované zmeny

### 1. Databázové zmeny

#### 1.1 Rozšírenie User modelu

Existujúce polia v `schema.prisma` (už implementované):
```prisma
model User {
  // ... existing fields ...
  otpSecret     String?
  otpEnabled    Boolean  @default(false)
  recoveryCode  String?
  
  passwordSetToken       String?   @unique
  passwordSetTokenExpiry DateTime?
}
```

**Nové polia na pridanie:**

```prisma
model User {
  // ... existing fields ...
  
  // 2FA Management
  twoFactorRequired      Boolean   @default(false)  // Povinná 2FA pre rolu
  twoFactorBackupCodes   String[]  @default([])     // Záložné kódy (hashed)
  twoFactorLastUsedAt    DateTime?
  
  // Password Management
  mustChangePassword     Boolean   @default(false)  // Pre gestorov pri prvom prihlásení
  passwordChangedAt      DateTime?
  passwordResetToken     String?   @unique
  passwordResetExpiry    DateTime?
  
  // Account Security
  failedLoginAttempts    Int       @default(0)
  lockedUntil            DateTime?
  lockReason             String?
  
  // Session Management
  sessions               UserSession[]
}
```

#### 1.2 Nový model: UserSession

```prisma
model UserSession {
  id            String   @id @default(cuid())
  
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  sessionToken  String   @unique
  ipAddress     String?
  userAgent     String?
  deviceInfo    String?
  
  createdAt     DateTime @default(now())
  lastAccessedAt DateTime @default(now())
  expiresAt     DateTime
  
  active        Boolean  @default(true)
  
  @@index([userId, active])
  @@index([sessionToken])
  @@map("user_sessions")
}
```

#### 1.3 Nový model: BreakGlassAccess

```prisma
model BreakGlassAccess {
  id                String   @id @default(cuid())
  
  requestedById     String
  requestedBy       User     @relation("BreakGlassRequested", fields: [requestedById], references: [id])
  
  approvedById1     String?
  approvedBy1       User?    @relation("BreakGlassApprover1", fields: [approvedById1], references: [id])
  
  approvedById2     String?
  approvedBy2       User?    @relation("BreakGlassApprover2", fields: [approvedById2], references: [id])
  
  reason            String
  status            BreakGlassStatus @default(PENDING)
  
  accessGrantedAt   DateTime?
  accessRevokedAt   DateTime?
  expiresAt         DateTime
  
  createdAt         DateTime @default(now())
  
  @@map("break_glass_access")
}

enum BreakGlassStatus {
  PENDING
  APPROVED
  DENIED
  EXPIRED
  REVOKED
}
```

---

### 2. Backend implementácia

#### 2.1 2FA Library Setup

**Nové závislosti v `package.json`:**
```json
{
  "dependencies": {
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3"
  }
}
```

#### 2.2 Nové utility súbory

##### [NEW] [totp.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/lib/auth/totp.ts)
Funkcie pre TOTP (Time-based One-Time Password):
- `generateSecret()` - Generovanie OTP secretu
- `generateQRCode(secret, email)` - QR kód pre autentifikačné aplikácie
- `verifyToken(secret, token)` - Overenie TOTP tokenu
- `generateBackupCodes()` - Generovanie záložných kódov
- `verifyBackupCode(hashedCodes, code)` - Overenie záložného kódu

##### [NEW] [session-manager.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/lib/auth/session-manager.ts)
Správa používateľských relácií:
- `createSession(userId, metadata)` - Vytvorenie novej relácie
- `getActiveSessions(userId)` - Zoznam aktívnych relácií
- `terminateSession(sessionId)` - Ukončenie relácie
- `terminateAllSessions(userId, exceptCurrent)` - Ukončenie všetkých relácií
- `cleanupExpiredSessions()` - Cleanup job

##### [NEW] [account-lockout.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/lib/auth/account-lockout.ts)
Ochrana proti brute-force útokom:
- `recordFailedAttempt(userId)` - Zaznamenanie neúspešného pokusu
- `resetFailedAttempts(userId)` - Reset po úspešnom prihlásení
- `isAccountLocked(userId)` - Kontrola, či je účet zablokovaný
- `unlockAccount(userId)` - Manuálne odomknutie účtu

##### [NEW] [password-reset.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/lib/auth/password-reset.ts)
Správa hesiel a reset tokenov:
- `generatePasswordResetToken(userId)` - Generovanie reset tokenu
- `verifyPasswordResetToken(token)` - Overenie platnosti tokenu
- `setNewPassword(userId, newPassword)` - Nastavenie nového hesla
- `validatePasswordStrength(password)` - Validácia sily hesla

---

#### 2.3 API Endpoints

##### [MODIFY] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/%5B...nextauth%5D/route.ts)

Rozšírenie NextAuth callbacks:

```typescript
callbacks: {
  async signIn({ user, account }) {
    // 1. Check account lockout
    const isLocked = await isAccountLocked(user.id)
    if (isLocked) {
      throw new Error('Account is locked')
    }
    
    // 2. Check if 2FA is required
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorRequired: true, otpEnabled: true }
    })
    
    if (dbUser?.twoFactorRequired && !dbUser?.otpEnabled) {
      // Redirect to 2FA setup
      return '/auth/setup-2fa'
    }
    
    return true
  },
  
  async jwt({ token, user, trigger }) {
    if (user) {
      token.twoFactorRequired = user.twoFactorRequired
      token.twoFactorVerified = false
      token.mustChangePassword = user.mustChangePassword
    }
    return token
  }
}
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/2fa/setup/route.ts)

**POST** - Inicializácia 2FA pre používateľa:
```typescript
// 1. Generate OTP secret
// 2. Generate QR code
// 3. Generate backup codes
// 4. Return to user (not saved yet)
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/2fa/verify-setup/route.ts)

**POST** - Overenie a aktivácia 2FA:
```typescript
// 1. Verify TOTP token
// 2. Save otpSecret to DB
// 3. Set otpEnabled = true
// 4. Save hashed backup codes
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/2fa/verify/route.ts)

**POST** - Overenie 2FA tokenu pri prihlásení:
```typescript
// 1. Verify TOTP token OR backup code
// 2. Update session token with 2FA verified flag
// 3. Record last 2FA usage
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/2fa/disable/route.ts)

**POST** - Deaktivácia 2FA (len pre admina alebo superadmina):
```typescript
// 1. Verify admin permissions
// 2. Clear otpSecret, otpEnabled
// 3. Clear backup codes
// 4. Audit log
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/sessions/route.ts)

**GET** - Zoznam aktívnych relácií používateľa:
```typescript
// Return list of active sessions with metadata
```

**DELETE** - Ukončenie relácie:
```typescript
// Terminate specific session by ID
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/sessions/terminate-all/route.ts)

**POST** - Ukončenie všetkých relácií okrem aktuálnej:
```typescript
// Terminate all sessions except current
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/password-reset/request/route.ts)

**POST** - Požiadavka na reset hesla:
```typescript
// 1. Generate reset token
// 2. Send email with reset link
// 3. Set expiry (24 hours)
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/password-reset/verify/route.ts)

**POST** - Overenie reset tokenu a nastavenie nového hesla:
```typescript
// 1. Verify token validity
// 2. Validate new password strength
// 3. Hash and save new password
// 4. Clear reset token
// 5. Terminate all sessions
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/auth/password/change/route.ts)

**POST** - Zmena hesla (pre gestorov pri prvom prihlásení):
```typescript
// 1. Verify old password (if not first login)
// 2. Validate new password
// 3. Save new password
// 4. Set mustChangePassword = false
// 5. Set passwordChangedAt
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/admin/break-glass/request/route.ts)

**POST** - Požiadavka na núdzový prístup:
```typescript
// 1. Create break-glass request
// 2. Notify superadmins for approval
// 3. Set expiry (1 hour)
```

##### [NEW] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/admin/break-glass/approve/route.ts)

**POST** - Schválenie núdzového prístupu:
```typescript
// 1. Verify approver is superadmin
// 2. Record approval
// 3. If 2 approvals, grant temporary access
// 4. Audit log
```

##### [MODIFY] [route.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/api/admin/users/route.ts)

Rozšírenie POST endpoint pre vytvorenie používateľa:
```typescript
// For ADMIN role:
// - Set twoFactorRequired = true
// - Generate passwordSetToken

// For GESTOR role:
// - Set mustChangePassword = true
// - Generate passwordSetToken
// - Send email with credentials
```

---

### 3. Frontend komponenty

#### 3.1 Nové stránky

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/auth/setup-2fa/page.tsx)

Nastavenie 2FA pre admina:
- Zobrazenie QR kódu
- Inštrukcie pre Google Authenticator / Authy
- Pole na overenie TOTP tokenu
- Zobrazenie záložných kódov (na stiahnutie)

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/auth/verify-2fa/page.tsx)

Overenie 2FA pri prihlásení:
- Pole na zadanie 6-miestneho kódu
- Link na použitie záložného kódu
- Časovač (30s refresh)

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/auth/password-reset/page.tsx)

Požiadavka na reset hesla:
- Email input
- Odoslanie reset linku

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/auth/password-reset/%5Btoken%5D/page.tsx)

Nastavenie nového hesla:
- Overenie tokenu
- Formulár na nové heslo
- Indikátor sily hesla

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/auth/change-password/page.tsx)

Zmena hesla (pre gestorov pri prvom prihlásení):
- Staré heslo (ak nie prvé prihlásenie)
- Nové heslo + potvrdenie
- Validácia sily hesla

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/(admin-protected)/settings/security/page.tsx)

Bezpečnostné nastavenia:
- **2FA Management**: Aktivácia/deaktivácia, regenerácia záložných kódov
- **Active Sessions**: Zoznam aktívnych relácií + ukončenie
- **Password Change**: Zmena hesla
- **Account Activity**: História prihlásení

##### [NEW] [page.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/app/(admin-protected)/admin/break-glass/page.tsx)

Správa núdzového prístupu (len pre superadmina):
- Zoznam pending požiadaviek
- Schválenie/zamietnutie
- História break-glass prístupov

#### 3.2 Nové komponenty

##### [NEW] [TOTPInput.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/components/auth/TOTPInput.tsx)

6-miestny input pre TOTP kód s auto-focus.

##### [NEW] [QRCodeDisplay.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/components/auth/QRCodeDisplay.tsx)

Zobrazenie QR kódu pre 2FA setup.

##### [NEW] [BackupCodesDisplay.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/components/auth/BackupCodesDisplay.tsx)

Zobrazenie a stiahnutie záložných kódov.

##### [NEW] [PasswordStrengthIndicator.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/components/auth/PasswordStrengthIndicator.tsx)

Vizuálny indikátor sily hesla.

##### [NEW] [SessionsList.tsx](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/components/auth/SessionsList.tsx)

Zoznam aktívnych relácií s možnosťou ukončenia.

---

### 4. Middleware úpravy

#### [MODIFY] [middleware.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/middleware.ts)

Pridanie kontrol pre 2FA a povinné zmeny hesla:

```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  
  // Check if 2FA verification is required
  if (token.twoFactorRequired && !token.twoFactorVerified) {
    if (!request.nextUrl.pathname.startsWith('/auth/verify-2fa')) {
      return NextResponse.redirect(new URL('/auth/verify-2fa', request.url))
    }
  }
  
  // Check if password change is required
  if (token.mustChangePassword) {
    if (!request.nextUrl.pathname.startsWith('/auth/change-password')) {
      return NextResponse.redirect(new URL('/auth/change-password', request.url))
    }
  }
  
  // Check account lockout
  const user = await prisma.user.findUnique({
    where: { id: token.id },
    select: { lockedUntil: true }
  })
  
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.redirect(new URL('/auth/account-locked', request.url))
  }
  
  return NextResponse.next()
}
```

---

### 5. Email notifikácie

#### [NEW] `lib/email/templates/`

Nové email šablóny:

- **`gestor-credentials.tsx`** - Prihlasovacie údaje pre gestora
- **`password-reset.tsx`** - Reset hesla link
- **`2fa-disabled.tsx`** - Notifikácia o deaktivácii 2FA
- **`account-locked.tsx`** - Notifikácia o zablokovaní účtu
- **`break-glass-request.tsx`** - Požiadavka na núdzový prístup
- **`break-glass-approved.tsx`** - Schválený núdzový prístup

---

### 6. Audit logging

#### [MODIFY] [logger.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/lib/audit/logger.ts)

Pridanie nových audit akcií:

```typescript
export const AUDIT_ACTIONS = {
  // 2FA
  '2FA_ENABLED': '2FA aktivovaná',
  '2FA_DISABLED': '2FA deaktivovaná',
  '2FA_VERIFIED': '2FA overená',
  '2FA_BACKUP_USED': 'Použitý záložný kód',
  
  // Password
  'PASSWORD_CHANGED': 'Heslo zmenené',
  'PASSWORD_RESET_REQUESTED': 'Požiadavka na reset hesla',
  'PASSWORD_RESET_COMPLETED': 'Reset hesla dokončený',
  
  // Account Security
  'ACCOUNT_LOCKED': 'Účet zablokovaný',
  'ACCOUNT_UNLOCKED': 'Účet odomknutý',
  'FAILED_LOGIN': 'Neúspešné prihlásenie',
  
  // Sessions
  'SESSION_CREATED': 'Relácia vytvorená',
  'SESSION_TERMINATED': 'Relácia ukončená',
  'ALL_SESSIONS_TERMINATED': 'Všetky relácie ukončené',
  
  // Break-glass
  'BREAK_GLASS_REQUESTED': 'Požiadavka na núdzový prístup',
  'BREAK_GLASS_APPROVED': 'Núdzový prístup schválený',
  'BREAK_GLASS_DENIED': 'Núdzový prístup zamietnutý',
}
```

---

### 7. Cron Jobs / Background Tasks

#### [NEW] `scripts/cleanup-sessions.ts`

Pravidelné čistenie expirovaných relácií:
```typescript
// Run every hour
// Delete sessions where expiresAt < now()
```

#### [NEW] `scripts/cleanup-reset-tokens.ts`

Čistenie expirovaných reset tokenov:
```typescript
// Run every hour
// Clear expired passwordResetToken and passwordSetToken
```

---

## Verifikačný plán

### Automatizované testy

#### Backend testy (Vitest)

##### [NEW] `tests/backend/auth-2fa.test.ts`

```typescript
describe('2FA Authentication', () => {
  it('should generate valid OTP secret')
  it('should generate valid QR code')
  it('should verify correct TOTP token')
  it('should reject invalid TOTP token')
  it('should generate 10 backup codes')
  it('should verify backup code')
  it('should not reuse backup code')
})
```

**Spustenie:**
```bash
npm run test:backend tests/backend/auth-2fa.test.ts
```

##### [NEW] `tests/backend/account-lockout.test.ts`

```typescript
describe('Account Lockout', () => {
  it('should lock account after 5 failed attempts')
  it('should reset failed attempts after successful login')
  it('should unlock account after lockout period')
  it('should allow admin to manually unlock account')
})
```

**Spustenie:**
```bash
npm run test:backend tests/backend/account-lockout.test.ts
```

##### [NEW] `tests/backend/password-reset.test.ts`

```typescript
describe('Password Reset', () => {
  it('should generate valid reset token')
  it('should verify valid reset token')
  it('should reject expired reset token')
  it('should validate password strength')
  it('should hash new password correctly')
})
```

**Spustenie:**
```bash
npm run test:backend tests/backend/password-reset.test.ts
```

#### E2E testy (Playwright)

##### [NEW] `tests/e2e/auth/admin-2fa-setup.spec.ts`

```typescript
test('Admin should setup 2FA on first login', async ({ page }) => {
  // 1. Login as new admin
  // 2. Redirect to /auth/setup-2fa
  // 3. Display QR code
  // 4. Enter TOTP token
  // 5. Display backup codes
  // 6. Redirect to dashboard
})
```

**Spustenie:**
```bash
npm run test:e2e tests/e2e/auth/admin-2fa-setup.spec.ts
```

##### [NEW] `tests/e2e/auth/admin-2fa-login.spec.ts`

```typescript
test('Admin should verify 2FA on login', async ({ page }) => {
  // 1. Login with email/password
  // 2. Redirect to /auth/verify-2fa
  // 3. Enter TOTP token
  // 4. Redirect to dashboard
})

test('Admin should use backup code when TOTP fails', async ({ page }) => {
  // 1. Login with email/password
  // 2. Click "Use backup code"
  // 3. Enter backup code
  // 4. Redirect to dashboard
})
```

**Spustenie:**
```bash
npm run test:e2e tests/e2e/auth/admin-2fa-login.spec.ts
```

##### [NEW] `tests/e2e/auth/gestor-first-login.spec.ts`

```typescript
test('Gestor should change password on first login', async ({ page }) => {
  // 1. Login with generated credentials
  // 2. Redirect to /auth/change-password
  // 3. Enter new password
  // 4. Redirect to dashboard
})
```

**Spustenie:**
```bash
npm run test:e2e tests/e2e/auth/gestor-first-login.spec.ts
```

##### [NEW] `tests/e2e/auth/password-reset.spec.ts`

```typescript
test('User should reset password via email link', async ({ page }) => {
  // 1. Click "Forgot password"
  // 2. Enter email
  // 3. Check email for reset link (mock)
  // 4. Navigate to reset link
  // 5. Enter new password
  // 6. Redirect to login
})
```

**Spustenie:**
```bash
npm run test:e2e tests/e2e/auth/password-reset.spec.ts
```

##### [NEW] `tests/e2e/auth/account-lockout.spec.ts`

```typescript
test('Account should lock after 5 failed login attempts', async ({ page }) => {
  // 1. Attempt login 5 times with wrong password
  // 2. Verify account locked message
  // 3. Wait for lockout period
  // 4. Login successfully
})
```

**Spustenie:**
```bash
npm run test:e2e tests/e2e/auth/account-lockout.spec.ts
```

##### [NEW] `tests/e2e/auth/session-management.spec.ts`

```typescript
test('User should view and terminate active sessions', async ({ page, context }) => {
  // 1. Login in first browser context
  // 2. Login in second browser context
  // 3. Navigate to /settings/security
  // 4. Verify 2 active sessions
  // 5. Terminate one session
  // 6. Verify session terminated in other context
})
```

**Spustenie:**
```bash
npm run test:e2e tests/e2e/auth/session-management.spec.ts
```

##### [MODIFY] [auth.ts](file:///Users/jozo/WebstormProjects/Hackaton%20-%20vyberove%20konania/tests/helpers/auth.ts)

Aktualizácia helper funkcií pre 2FA:

```typescript
export async function loginAsSuperadminWith2FA(page: Page, totpToken: string) {
  await page.goto('/admin/login')
  await page.fill('input#login', 'superadmin@retry.sk')
  await page.fill('input#password', 'Hackaton25')
  await page.click('button[type="submit"]')
  
  // 2FA verification
  await page.waitForURL('/auth/verify-2fa')
  await page.fill('input#totp-token', totpToken)
  await page.click('button[type="submit"]')
  
  await page.waitForURL('/dashboard', { timeout: 10000 })
}
```

### Manuálne testovanie

> [!NOTE]
> Nasledujúce manuálne testy vyžadujú spustený vývojový server (`npm run dev`) a prístup k emailovému systému (alebo mock email logu).

#### Test 1: Admin 2FA Setup

1. Vytvorte nového admina cez `/admin/users/create`
2. Odhlásťe sa a prihláste sa ako nový admin
3. **Očakávaný výsledok:** Presmerovanie na `/auth/setup-2fa`
4. Naskenujte QR kód v Google Authenticator
5. Zadajte 6-miestny kód z aplikácie
6. **Očakávaný výsledok:** Zobrazenie 10 záložných kódov
7. Stiahnite záložné kódy
8. **Očakávaný výsledok:** Presmerovanie na dashboard

#### Test 2: Gestor First Login

1. Vytvorte nového gestora cez `/admin/users/create`
2. Skontrolujte email s prihlasovacími údajmi
3. Prihláste sa s vygenerovanými údajmi
4. **Očakávaný výsledok:** Presmerovanie na `/auth/change-password`
5. Zadajte nové heslo (min. 8 znakov, veľké/malé písmeno, číslo, špeciálny znak)
6. **Očakávaný výsledok:** Presmerovanie na dashboard

#### Test 3: Account Lockout

1. Prihláste sa s nesprávnym heslom 5-krát
2. **Očakávaný výsledok:** Zobrazenie "Account is locked" správy
3. Počkajte 15 minút (alebo upravte lockout trvanie v nastaveniach)
4. Prihláste sa so správnym heslom
5. **Očakávaný výsledok:** Úspešné prihlásenie

#### Test 4: Session Management

1. Prihláste sa v Chrome
2. Prihláste sa v Firefox (rovnaký účet)
3. V Chrome prejdite na `/settings/security`
4. **Očakávaný výsledok:** Zobrazenie 2 aktívnych relácií
5. Ukončite reláciu vo Firefoxe
6. **Očakávaný výsledok:** Firefox session je ukončená, presmerovanie na login

---

## Bezpečnostné úvahy

### 1. TOTP Secret Storage
- OTP secret bude uložený v databáze v **plain text** (nutné pre generovanie tokenov)
- Prístup k databáze musí byť **striktne obmedzený**
- V produkcii zvážiť **encryption at rest**

### 2. Backup Codes
- Záložné kódy budú **hashované** (bcrypt) pred uložením
- Každý kód môže byť použitý **len raz**
- Používateľ dostane **10 kódov** pri setup

### 3. Session Tokens
- Session tokeny budú **JWT** s krátkym expiration (8 hodín)
- Refresh tokeny budú uložené v **httpOnly cookies**
- Session metadata (IP, User-Agent) pre detekciu podozrivej aktivity

### 4. Rate Limiting
- **5 pokusov** na prihlásenie za 15 minút
- **3 pokusy** na 2FA verifikáciu za 5 minút
- **10 pokusov** na password reset za hodinu

### 5. Audit Logging
- Všetky bezpečnostné udalosti budú **zaznamenané**
- Logy budú obsahovať: userId, action, timestamp, IP, userAgent
- Logy budú **immutable** (append-only)

---

## Migračný plán

### Fáza 1: Databázové zmeny
1. Vytvoriť migráciu pre nové polia v User modeli
2. Vytvoriť UserSession model
3. Vytvoriť BreakGlassAccess model
4. Spustiť migráciu: `npm run db:migrate`

### Fáza 2: Backend implementácia
1. Nainštalovať závislosti (`otplib`, `qrcode`)
2. Implementovať utility funkcie (totp, session-manager, account-lockout, password-reset)
3. Implementovať API endpoints
4. Aktualizovať NextAuth callbacks

### Fáza 3: Frontend implementácia
1. Vytvoriť auth stránky (setup-2fa, verify-2fa, change-password, password-reset)
2. Vytvoriť komponenty (TOTPInput, QRCodeDisplay, BackupCodesDisplay, PasswordStrengthIndicator)
3. Vytvoriť security settings stránku
4. Aktualizovať middleware

### Fáza 4: Email notifikácie
1. Vytvoriť email šablóny
2. Integrovať s email service
3. Testovať odosielanie emailov

### Fáza 5: Testovanie
1. Napísať backend testy
2. Napísať E2E testy
3. Vykonať manuálne testovanie
4. Security audit

### Fáza 6: Deployment
1. Aktualizovať environment variables
2. Spustiť migrácie v produkcii
3. Postupné zavádzanie 2FA pre adminov
4. Monitoring a audit logs

---

## Otvorené otázky

> [!IMPORTANT]
> Nasledujúce otázky vyžadujú rozhodnutie pred implementáciou:

1. **Email Service**: Aký email service použijeme? (SMTP, SendGrid, AWS SES, iný?)
Pouzime pre ucely testovania mailgun
Tu je API key 38bcb167ce7d69704b98fa1665401113

2. **2FA Provider**: Chceme podporovať len TOTP (Google Authenticator) alebo aj Push notifikácie (Cisco Duo)?
Zacnime s Google Authenticatorom

3. **Lockout Duration**: Aké dlhé má byť blokovanie účtu? (15 min, 30 min, 1 hodina?)
Je mozne ho nastavit v settings 
http://localhost:5600/settings

4. **Session Expiry**: Aká dlhá má byť platnosť session? (8 hodín, 24 hodín?)
Doplnme tuto moznost do settings
http://localhost:5600/settings

5. **Break-glass Approvers**: Koľko superadminov musí schváliť break-glass prístup? (2, 3?)
Dvaja

6. **Password Policy**: Aké sú presné požiadavky na silu hesla?
Pouzime standardne pozadavky na silu hesla

7. **Recovery Codes Regeneration**: Môže používateľ regenerovať záložné kódy? Ak áno, kedy?
Moze, v settings http://localhost:5600/settings

8. **2FA Enforcement**: Kedy presne sa má vynútiť 2FA pre adminov? (pri vytvorení, pri prvom prihlásení, po X dňoch?)
Pri prvom prihlaseni

Stale ale zachovajme moznost prihlasenia bez 2FA na dev prostredi

---

## Časový odhad

| Fáza | Odhadovaný čas |
|------|----------------|
| Databázové zmeny | 2 hodiny |
| Backend implementácia | 8 hodín |
| Frontend implementácia | 10 hodín |
| Email notifikácie | 3 hodiny |
| Testovanie (backend + E2E) | 6 hodín |
| Manuálne testovanie | 2 hodiny |
| Dokumentácia | 2 hodiny |
| **Celkom** | **33 hodín** |

---

## Záver

Tento implementačný plán pokrýva všetky požiadavky zo zadania a pridává dodatočné bezpečnostné funkcie pre robustný autentifikačný systém. Po schválení plánu môžeme začať s implementáciou vo fázach podľa migračného plánu.
