# Refaktoring Uchádzačov - Presun z User do Candidate

**Dátum:** 2025-10-10
**Status:** V implementácii
**Dôvod:** Odstrániť uchádzačov z tabuľky users a presunúť ich kompletne do tabuľky candidates

---

## Problém

Súčasný stav:
- Uchádzač = User s rolou UCHADZAC
- User má viacero Candidate záznamov (pre rôzne VK)
- Duplicitné záznamy v users tabuľke pre rovnakého človeka

Problémy:
1. Jeden uchádzač sa môže prihlásiť na 3 VK → 3x v users tabuľke
2. Uchádzači sú zmiešaní s adminmi/gestormi v jednej tabuľke
3. Bezpečnostné riziká (spoločná tabuľka pre rôzne typy používateľov)

---

## Riešenie

Nový stav:
- Candidate = samostatná entita s vlastným auth
- Jeden Candidate = jedno VK
- CIS identifikátor je unikátny pre každého kandidáta
- Login: CIS + PIN = prihlásenie do konkrétneho VK

Výhody:
1. Jeden uchádzač na 3 VK = 3 samostatné Candidate záznamy (každý s vlastným CIS)
2. Úplné oddelenie uchádzačov od ostatných rolí
3. Bezpečnejšie (separácia dát)
4. Jednoduchšia logika (Candidate priamo viazaný na VK)

---

## Rozhodnutia

### 1. CIS Identifikátor
**Rozhodnutie:** CIS je unikátny pre každý záznam
- Každý Candidate má vlastný CIS
- Jeden človek na 3 VK = 3 rôzne CIS

### 2. Login Flow
**Rozhodnutie:** CIS + PIN = prihlásenie do konkrétneho VK
- Candidate sa prihlási cez CIS a PIN
- Priamo pristúpi k dashboardu svojho VK
- Žiadny výber VK po logine

### 3. UserRole Enum
**Rozhodnutie:** Odstrániť UCHADZAC rolu kompletne

```prisma
enum UserRole {
  SUPERADMIN
  ADMIN
  GESTOR
  KOMISIA
  // UCHADZAC - REMOVED
}
```

### 4. Migrácia Existujúcich Dát
**Rozhodnutie:** Odstrániť uchádzačov z users, prekopírovať do candidates

Postup:
1. Backup users tabuľky
2. Pre každého User(UCHADZAC): prekopíruj auth údaje do Candidate
3. Naparuj kandidátov na testovacie VK
4. Vymaž User(UCHADZAC) záznamy

### 5. Switch Feature
**Rozhodnutie:** Ponechať a upraviť

- Admin môže prepnúť na Candidate
- Uložiť candidateId (nie userId) do session
- Banner zobrazí candidate name + VK identifier

### 6. Candidate Model Štruktúra
**Rozhodnutie:** Súhlas s navrhovanou štruktúrou

---

## Implementačný Plán

### Fáza 1: Prisma Schema Refaktoring (30 min)

#### 1.1 Upraviť Candidate model

**Nová štruktúra:**
```prisma
model Candidate {
  id                String   @id @default(cuid())

  // Auth
  cisIdentifier     String   @unique  // CIS ID = login username
  password          String?            // Hashed PIN

  // Personal info
  name              String
  surname           String
  email             String?
  birthDate         DateTime?
  phone             String?

  // VK relation
  vkId              String
  vk                VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  // Flags
  active            Boolean  @default(true)
  isArchived        Boolean  @default(false)
  deleted           Boolean  @default(false)
  deletedAt         DateTime?
  deletedEmail      String?

  // Timestamps
  registeredAt      DateTime @default(now())
  lastLoginAt       DateTime?
  updatedAt         DateTime @updatedAt

  // Relations (unchanged)
  testSessions      TestSession[]
  testResults       TestResult[]
  documents         Document[]
  evaluations       Evaluation[]
  attachments       CandidateAttachment[]

  @@map("candidates")
}
```

**Zmeny:**
- Odstrániť userId field a User relačný vzťah
- Pridať auth polia (password)
- Pridať osobné údaje (name, surname, birthDate, phone)
- Zmeniť cisIdentifier na @unique (odstrániť compound unique s vkId)
- Pridať active flag
- Pridať lastLoginAt timestamp
- Pridať updatedAt timestamp

#### 1.2 Odstrániť UCHADZAC z UserRole enum

```prisma
enum UserRole {
  SUPERADMIN
  ADMIN
  GESTOR
  KOMISIA
}
```

#### 1.3 Vyčistiť User model

- Odstrániť candidates relačný field

---

### Fáza 2: Databázová Migrácia (30 min)

#### 2.1 Vytvoriť migration SQL

**File:** `prisma/migrations/[timestamp]_move_applicants_to_candidates/migration.sql`

**Kroky:**
1. Pridať nové stĺpce do candidates tabuľky
2. Prekopírovať auth údaje z users do candidates
3. Drop foreign key userId z candidates
4. Drop userId stĺpec z candidates
5. Vymazať User(UCHADZAC) záznamy
6. Vymazať UCHADZAC z UserRole enum
7. Pridať constraints (unique cisIdentifier)

#### 2.2 Vytvoriť data migration script

**File:** `scripts/migrate-applicants-to-candidates.ts`

**Logika:**
```typescript
// 1. Nájdi všetkých uchádzačov
const applicantUsers = await prisma.user.findMany({
  where: { userRoles: { some: { role: 'UCHADZAC' } } },
  include: { candidates: true }
})

// 2. Pre každého User(UCHADZAC)
for (const user of applicantUsers) {
  for (const candidate of user.candidates) {
    // Update Candidate s auth údajmi z User
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        password: user.password,
        name: user.name,
        surname: user.surname,
        email: user.email || candidate.email,
        phone: user.phone,
        active: user.active,
        lastLoginAt: user.lastLoginAt,
      }
    })
  }
}

// 3. Vymaž všetkých User(UCHADZAC)
await prisma.user.deleteMany({
  where: { userRoles: { some: { role: 'UCHADZAC' } } }
})
```

#### 2.3 Spustiť migráciu

```bash
npx prisma migrate dev --name move_applicants_to_candidates
node scripts/migrate-applicants-to-candidates.ts
npx prisma generate
```

---

### Fáza 3: Auth System - Candidate Login (1-2h)

#### 3.1 Vytvoriť nový Credentials Provider pre Candidates

**File:** `auth.ts` - rozšíriť

**Pridať druhý provider:**
```typescript
Credentials({
  id: 'candidate-credentials',
  name: 'Candidate Login',
  credentials: {
    cisIdentifier: { label: 'CIS ID', type: 'text' },
    pin: { label: 'PIN', type: 'password' },
  },
  async authorize(credentials) {
    // Find candidate by CIS
    const candidate = await prisma.candidate.findUnique({
      where: {
        cisIdentifier: credentials.cisIdentifier,
        active: true,
        deleted: false,
      },
      include: { vk: true }
    })

    if (!candidate || !candidate.password) return null

    // Verify PIN
    const isValid = await bcrypt.compare(credentials.pin, candidate.password)
    if (!isValid) return null

    // Update last login
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { lastLoginAt: new Date() }
    })

    return {
      id: candidate.id,
      candidateId: candidate.id,
      cisIdentifier: candidate.cisIdentifier,
      name: candidate.name,
      surname: candidate.surname,
      vkId: candidate.vkId,
      type: 'candidate',
    }
  }
})
```

#### 3.2 Upraviť JWT callback

```typescript
async jwt({ token, user }) {
  if (user) {
    if (user.type === 'candidate') {
      token.candidateId = user.candidateId
      token.vkId = user.vkId
      token.type = 'candidate'
      token.name = user.name
      token.surname = user.surname
    } else {
      token.id = user.id
      token.role = user.role
      token.roles = user.roles
      token.type = 'user'
    }
  }
  return token
}
```

#### 3.3 Upraviť Session callback

```typescript
async session({ session, token }) {
  if (token.type === 'candidate') {
    session.user.candidateId = token.candidateId as string
    session.user.vkId = token.vkId as string
    session.user.type = 'candidate'
    session.user.name = token.name as string
    session.user.surname = token.surname as string
  } else {
    session.user.id = token.id as string
    session.user.username = token.username as string
    session.user.role = token.role as UserRole
    session.user.roles = token.roles as Array<{ role: UserRole }>
    session.user.type = 'user'
  }
  return session
}
```

#### 3.4 Rozšíriť TypeScript types

**File:** `types/next-auth.d.ts`

```typescript
interface User {
  id: string
  username?: string
  email?: string | null
  name: string
  surname: string
  role?: UserRole
  roles?: Array<{ role: UserRole }>

  // Candidate specific
  candidateId?: string
  vkId?: string
  cisIdentifier?: string
  type?: 'user' | 'candidate'
}

interface Session {
  user: {
    id?: string
    username?: string
    role?: UserRole
    roles?: Array<{ role: UserRole }>

    // Candidate specific
    candidateId?: string
    vkId?: string
    type?: 'user' | 'candidate'
    name?: string
    surname?: string

    // Switch fields
    originalUserId?: string
    originalRole?: UserRole
    switchedToUserId?: string
    switchedToCandidateId?: string
    switchedToName?: string
  } & DefaultSession['user']
}

interface JWT {
  id?: string
  username?: string
  role?: UserRole
  roles?: Array<{ role: UserRole }>

  // Candidate specific
  candidateId?: string
  vkId?: string
  type?: 'user' | 'candidate'
  name?: string
  surname?: string

  // Switch fields
  originalUserId?: string
  originalRole?: UserRole
  originalUsername?: string
  switchedToUserId?: string
  switchedToCandidateId?: string
  switchedToUsername?: string
  switchedToName?: string
}
```

---

### Fáza 4: API Endpoints Refaktoring (2-3h)

#### 4.1 Applicant API - Upraviť na Candidate

**File:** `app/api/applicant/login/route.ts`
- Použiť candidate credentials provider
- Fetch Candidate (nie User)

**File:** `app/api/applicant/dashboard/route.ts`
- Zmeniť z x-candidate-id header na session.user.candidateId
- Fetch cez candidateId (nie userId)

**File:** `app/api/applicant/test/*/route.ts`
- Už používa candidateId (OK)

#### 4.2 Admin Applicants API - Upraviť na Candidate

**File:** `app/api/admin/applicants/route.ts`

**BEFORE: GET - Fetch Users with role UCHADZAC**
```typescript
const applicants = await prisma.user.findMany({
  where: {
    userRoles: { some: { role: 'UCHADZAC' } },
    deleted: false,
  },
  include: { candidates: true }
})
```

**AFTER: GET - Fetch Candidates directly**
```typescript
const candidates = await prisma.candidate.findMany({
  where: {
    deleted: false,
    isArchived: archived === 'true',
  },
  include: {
    vk: {
      select: {
        id: true,
        identifier: true,
        position: true,
      }
    },
    testSessions: {
      where: { status: 'COMPLETED' }
    },
    evaluations: true,
  }
})
```

**BEFORE: POST - Create User with role UCHADZAC**
```typescript
const user = await prisma.user.create({
  data: {
    username: cisIdentifier,
    password: hashedPin,
    name,
    surname,
    email,
    role: 'UCHADZAC',
    userRoles: { create: { role: 'UCHADZAC' } }
  }
})

const candidate = await prisma.candidate.create({
  data: {
    userId: user.id,
    vkId,
    cisIdentifier,
    email,
  }
})
```

**AFTER: POST - Create Candidate directly**
```typescript
const candidate = await prisma.candidate.create({
  data: {
    cisIdentifier,
    password: hashedPin,
    name,
    surname,
    email,
    phone,
    birthDate,
    vkId,
    active: true,
  }
})
```

**File:** `app/api/admin/applicants/[id]/route.ts`

**BEFORE: GET - Fetch User**
```typescript
const user = await prisma.user.findUnique({
  where: { id: params.id },
  include: { candidates: true }
})
```

**AFTER: GET - Fetch Candidate**
```typescript
const candidate = await prisma.candidate.findUnique({
  where: { id: params.id },
  include: {
    vk: true,
    testSessions: true,
    evaluations: true,
  }
})
```

**BEFORE: PATCH - Update User**
```typescript
const user = await prisma.user.update({
  where: { id: params.id },
  data: { name, surname, email, phone, active }
})
```

**AFTER: PATCH - Update Candidate**
```typescript
const candidate = await prisma.candidate.update({
  where: { id: params.id },
  data: { name, surname, email, phone, active }
})
```

**File:** `app/api/admin/applicants/[id]/switch/route.ts`

**Zmeny:**
- params.id = candidateId (nie userId)
- Fetch Candidate (nie User)
- Overenie institution access (cez candidate.vk.institutionId)
- Uložiť candidateId do JWT
- Session type = 'candidate'

---

### Fáza 5: Frontend Refaktoring (2-3h)

#### 5.1 Applicants List Page

**File:** `app/(admin-protected)/applicants/page.tsx`

**Zmeny:**
- Fetch z `/api/admin/applicants` (vráti Candidates)
- Upraviť typy (Applicant = Candidate)
- Stĺpce tabuľky:
  - Meno a priezvisko
  - Email
  - VK (identifier + position)
  - CIS Identifikátor
  - Testy (počet testSessions)
  - Hodnotenia (počet evaluations)
  - Vytvorený (registeredAt)
  - Stav (active)
  - Akcie (Prepnúť button)

#### 5.2 Applicant Detail Page

**File:** `app/(admin-protected)/applicants/[id]/page.tsx`

**Zmeny:**
- Fetch Candidate (nie User)
- Zobrazenie VK info (identifier, position, date)
- Detail tabs:
  - Prehľad (osobné údaje, VK info)
  - Testy (test sessions)
  - Hodnotenia (evaluations)
- Edit form - upraviť Candidate fields
- Remove "userId" z formuláru

#### 5.3 Create Applicant Page

**File:** `app/(admin-protected)/applicants/new/page.tsx`

**Zmeny:**
- Vytvoriť Candidate (nie User)
- Form fields:
  - VK (select)
  - CIS Identifikátor (text input)
  - PIN (password input alebo auto-generate)
  - Meno (text)
  - Priezvisko (text)
  - Email (optional)
  - Telefón (optional)
  - Dátum narodenia (optional)
- Validácia CIS (unique)
- Auto-generate PIN možnosť

#### 5.4 useApplicants Hook

**File:** `hooks/useApplicants.ts`

**Zmeny:**
- Type: `Candidate` (nie User)
- API endpoint: `/api/admin/applicants`
- Response mapping

---

### Fáza 6: Middleware & Routing (30 min)

#### 6.1 Middleware

**File:** `middleware.ts`

**Zmeny:**
- Candidate sessions: type === 'candidate'
- Candidate routes: `/applicant/*`
- Block admin routes pre candidates

```typescript
// Get token
const token = await getToken({ req, secret: process.env.AUTH_SECRET })

// Handle candidate sessions
if (token?.type === 'candidate') {
  // Candidates can only access /applicant routes
  if (!pathname.startsWith('/applicant')) {
    return NextResponse.redirect(new URL('/applicant/dashboard', request.url))
  }
  return NextResponse.next()
}

// Handle admin sessions (existing logic)
// ...
```

---

### Fáza 7: Backend Tests (1-2h)

#### 7.1 Upraviť existujúce testy

**Files:**
- `tests/backend/security-settings-api.test.ts` - ak testuje uchádzačov

**Príklad:**

**BEFORE:**
```typescript
const user = await prisma.user.create({
  data: {
    username: 'test123',
    password: hashedPassword,
    name: 'Test',
    surname: 'User',
    role: 'UCHADZAC',
    userRoles: { create: { role: 'UCHADZAC' } }
  }
})

const candidate = await prisma.candidate.create({
  data: {
    userId: user.id,
    vkId: testVk.id,
    cisIdentifier: '1234567890',
  }
})
```

**AFTER:**
```typescript
const candidate = await prisma.candidate.create({
  data: {
    cisIdentifier: '1234567890',
    password: hashedPassword,
    name: 'Test',
    surname: 'User',
    email: 'test@example.com',
    vkId: testVk.id,
    active: true,
  }
})
```

#### 7.2 Vytvoriť nové testy

**File:** `tests/backend/candidates-api.test.ts`

**Testy:**
1. GET /api/admin/applicants - list candidates
2. POST /api/admin/applicants - create candidate
3. GET /api/admin/applicants/[id] - get candidate detail
4. PATCH /api/admin/applicants/[id] - update candidate
5. DELETE /api/admin/applicants/[id] - soft delete candidate
6. Validácia - duplicate CIS
7. Authorization - admin institution access

---

### Fáza 8: E2E Tests (1-2h)

#### 8.1 Upraviť existujúce testy

**Files:**
- `tests/e2e/admin/applicants.spec.ts` - upraviť (ak existuje)
- `tests/e2e/admin/applicants-detail.spec.ts` - upraviť (ak existuje)
- `tests/e2e/admin/applicant-edit.spec.ts` - upraviť (ak existuje)

**Zmeny:**
- Test data - vytvoriť Candidates (nie Users)
- Selektory - upraviť ak potrebné
- Assertions - Candidate fields (cisIdentifier, vk info)

**Príklad:**

**BEFORE:**
```typescript
const user = await prisma.user.create({
  data: {
    username: 'test.uchadzac',
    password: hashedPassword,
    name: 'Test',
    surname: 'Uchádzač',
    role: 'UCHADZAC',
    userRoles: { create: { role: 'UCHADZAC' } }
  }
})
```

**AFTER:**
```typescript
const candidate = await prisma.candidate.create({
  data: {
    cisIdentifier: `${Date.now()}`,
    password: hashedPassword,
    name: 'Test',
    surname: 'Uchádzač',
    vkId: testVk.id,
    active: true,
  }
})
```

#### 8.2 Test Helpers

**File:** `tests/helpers/auth.ts`

**Pridať:**
```typescript
export async function loginAsCandidate(
  page: Page,
  cisId: string,
  pin: string
) {
  await page.goto('http://localhost:5600/applicant/login')
  await page.getByTestId('cis-input').fill(cisId)
  await page.getByTestId('pin-input').fill(pin)
  await page.getByTestId('login-button').click()
  await page.waitForURL('http://localhost:5600/applicant/dashboard')
}
```

#### 8.3 Vytvoriť nové E2E testy

**File:** `tests/e2e/admin/applicants.spec.ts`

**Testy:**
1. Should display applicants list
2. Should search applicants
3. Should filter by status (active/archived)
4. Should navigate to applicant detail
5. Should switch to applicant

**File:** `tests/e2e/admin/applicant-create.spec.ts`

**Testy:**
1. Should create new applicant with all fields
2. Should create applicant with only required fields
3. Should validate duplicate CIS
4. Should validate required fields

---

### Fáza 9: Switch Feature Dokončenie (1h)

#### 9.1 Upraviť Switch API

**File:** `app/api/admin/applicants/[id]/switch/route.ts`

**Zmeny:**
- Fetch Candidate (nie User)
- Check institution access cez candidate.vk.institutionId
- JWT fields:
  - switchedToCandidateId (nie switchedToUserId)
  - switchedToVkId
  - switchedToName
  - type = 'candidate'

#### 9.2 Upraviť Switch Back API

**File:** `app/api/admin/switch-back/route.ts`

**Zmeny:**
- Restore admin session
- Clear candidate fields z JWT

#### 9.3 Header Banner

**File:** `components/admin/Header.tsx`

**Zmeny:**
- Zobrazovať candidate name + VK identifier pri switchi
- "Dočasne prihlásený ako [Candidate Name] (VK: [VK Identifier])"

---

### Fáza 10: Testing & Cleanup (1-2h)

#### 10.1 Manual Testing

1. Create Candidate (admin UI)
2. View applicants list
3. Edit candidate
4. Admin switch to candidate
5. Candidate dashboard
6. Switch back

#### 10.2 Run All Tests

```bash
# Backend tests
npm run test:backend

# E2E tests
npm run test:e2e

# Specific test
npm run test:e2e -- tests/e2e/admin/dashboard.spec.ts
```

#### 10.3 Cleanup

- Odstrániť deprecated kód
- Aktualizovať dokumentáciu
- Vyčistiť comments
- Commit changes

---

## Časový Odhad

| Fáza | Čas | Priorita |
|------|-----|----------|
| 1. Prisma Schema | 30 min | Critical |
| 2. DB Migration | 30 min | Critical |
| 3. Auth System | 1-2h | Critical |
| 4. API Endpoints | 2-3h | Critical |
| 5. Frontend | 2-3h | High |
| 6. Middleware | 30 min | High |
| 7. Backend Tests | 1-2h | Medium |
| 8. E2E Tests | 1-2h | Medium |
| 9. Switch Feature | 1h | High |
| 10. Testing & Cleanup | 1-2h | Medium |
| **TOTAL** | **11-17h** | 2-3 dni |

---

## Riziká & Mitigation

### Riziko 1: Data Loss
- **Mitigation:** Vytvoriť DB backup pred migráciou
- **Rollback:** Restore z backupu

### Riziko 2: Broken Tests
- **Mitigation:** Postupné aktualizovanie testov
- **Rollback:** Skip failing tests, fix later

### Riziko 3: Auth Issues
- **Mitigation:** Testovať login flow manuálne
- **Rollback:** Fallback na starý auth provider

---

## Checklist

### Fáza 1: Prisma Schema
- [ ] Odstrániť userId z Candidate
- [ ] Pridať auth polia (password)
- [ ] Pridať osobné údaje (name, surname, birthDate, phone)
- [ ] Zmeniť cisIdentifier na @unique
- [ ] Pridať active, lastLoginAt, updatedAt
- [ ] Odstrániť UCHADZAC z UserRole enum
- [ ] Odstrániť candidates field z User

### Fáza 2: DB Migration
- [ ] Vytvoriť migration SQL
- [ ] Vytvoriť data migration script
- [ ] Backup databázy
- [ ] Spustiť migráciu
- [ ] Spustiť data migration
- [ ] Regenerovať Prisma client

### Fáza 3: Auth System
- [ ] Vytvoriť candidate credentials provider
- [ ] Upraviť JWT callback
- [ ] Upraviť session callback
- [ ] Rozšíriť TypeScript types

### Fáza 4: API Endpoints
- [ ] Upraviť /api/applicant/login
- [ ] Upraviť /api/applicant/dashboard
- [ ] Upraviť /api/admin/applicants (GET)
- [ ] Upraviť /api/admin/applicants (POST)
- [ ] Upraviť /api/admin/applicants/[id] (GET)
- [ ] Upraviť /api/admin/applicants/[id] (PATCH)
- [ ] Upraviť /api/admin/applicants/[id] (DELETE)
- [ ] Upraviť /api/admin/applicants/[id]/switch

### Fáza 5: Frontend
- [ ] Upraviť applicants list page
- [ ] Upraviť applicant detail page
- [ ] Upraviť create applicant page
- [ ] Upraviť useApplicants hook

### Fáza 6: Middleware
- [ ] Pridať handling pre candidate sessions
- [ ] Block admin routes pre candidates

### Fáza 7: Backend Tests
- [ ] Upraviť existujúce testy
- [ ] Vytvoriť candidates-api.test.ts
- [ ] Spustiť backend testy

### Fáza 8: E2E Tests
- [ ] Upraviť existujúce applicant testy
- [ ] Pridať loginAsCandidate helper
- [ ] Vytvoriť applicants.spec.ts
- [ ] Vytvoriť applicant-create.spec.ts
- [ ] Spustiť E2E testy

### Fáza 9: Switch Feature
- [ ] Upraviť switch API
- [ ] Upraviť switch back API
- [ ] Upraviť header banner

### Fáza 10: Testing & Cleanup
- [ ] Manual testing
- [ ] Run all tests
- [ ] Cleanup deprecated code
- [ ] Update docs
- [ ] Commit changes

---

## Súvisiace Dokumenty

- [Zadanie - Uchádzač](../zadanie/uchadzac.md) - Pôvodné zadanie
- [Otázky k Implementácii](32-applicant-implementation-questions.md) - Otázky a odpovede
- [Role Switching Feature](31-role-switching-feature.md) - Switch feature
- [Stav Uchádzačskej Časti](30-applicant-screens-status.md) - Status pred refaktoringom

---

## Changelog

- **2025-10-10** - Vytvorenie dokumentu, začiatok implementácie
