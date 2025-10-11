# Gestor Role - Implementačná dokumentácia

## Úvod

Táto dokumentácia popisuje implementáciu role **Gestor** (Vecný gestor) v systéme VK Smart.

### Čo je Gestor?

- **Role:** GESTOR
- **Úloha:** Vytvára obsah testov typu "Odborný test" na základe priradení od admina
- **Prístup:** Obmedzený len na tvorbu testov
- **Menu:** Vidí len položku "Testy"

### Terminológia

**"Šablóna" v zadaní** = v systéme to je `TestAssignment` (priradenie úlohy)

- Admin **nepriradí hotový test**
- Admin **priradí úlohu** gestorovi: "Vytvor Odborný test pre Zamestnanca"
- Gestor potom vytvára test s otázkami podľa zákonných pravidiel

---

## Workflow

### 1. Admin vytvára priradenie (assignment)

Admin v sekcii `/admin/assignments/new` vytvára novú úlohu:

```typescript
{
  assignedToUserId: "gestor-123",       // Ktorý gestor
  testTypeId: "odborny-test",           // Aký typ testu
  testTypeConditionId: "zamestnanec",   // Aká podmienka (zamestnanec/vedúci)
  name: "Test z pracovného práva",      // Názov úlohy
  description: "Zamerať sa na zákon 552/2003" // Popis
}
```

### 2. Gestor dostane notifikáciu

- Gestor sa prihlási do systému
- Vidí na dashboarde: **"Máte 3 nové priradené úlohy"**
- Klikne na "Pridelené úlohy" → vidí zoznam

### 3. Gestor vytvára test

Gestor klikne na priradenie → otvorí sa detail:

**Systém načíta pravidlá z `TestTypeCondition`:**
- Počet otázok: 10-20
- Časový limit: 20 minút
- Bodovanie: 1 bod za otázku
- Minimum na úspech: 12 bodov

**Gestor môže:**
- ✅ Vybrať počet otázok (napr. 15 otázok)
- ✅ Vytvoriť nové otázky
- ✅ Importovať otázky z existujúceho testu
- ❌ **Nemôže** meniť čas (fixné 20 minút)
- ❌ **Nemôže** meniť bodovanie (fixné 1 bod/otázka)
- ❌ **Nemôže** meniť minimum (fixné 12 bodov)

**Automatické výpočty:**
```typescript
// Gestor vybral 15 otázok
test.timeLimit = 20 * 60  // z pravidiel (20 minút = 1200 sekúnd)
test.pointsPerQuestion = 1.0  // z pravidiel
test.minimumScore = 12  // z pravidiel
test.maxScore = 15  // 15 otázok × 1 bod
```

### 4. Admin schvaľuje test

- Admin dostane notifikáciu: "Gestor dokončil test"
- Admin skontroluje test v `/admin/assignments`
- Klikne "Schváliť test"
- Test je pripravený na priradenie do VK

---

## Databázová schéma

### TestTypeCondition (rozšírený)

```prisma
model TestTypeCondition {
  id          String   @id @default(cuid())
  testTypeId  String
  name        String          // "Zamestnanec", "Vedúci zamestnanec"
  description String?
  sortOrder   Int      @default(0)

  // ===== NOVÉ: Zákonné pravidlá testovania =====
  minQuestions      Int?    // min. počet otázok (napr. 10)
  maxQuestions      Int?    // max. počet otázok (napr. 20)
  timeLimitMinutes  Int?    // časový limit v minútach (napr. 20)
  pointsPerQuestion Float?  // body za otázku (napr. 1.0)
  minimumScore      Int?    // minimum bodov na úspech (napr. 12)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  testType    TestType @relation(...)
  tests       Test[]
  assignments TestAssignment[]
}
```

### TestAssignment (nový)

```prisma
model TestAssignment {
  id                  String   @id @default(cuid())

  // Kto má vytvoriť test
  assignedToUserId    String
  assignedToUser      User     @relation("AssignedTests", ...)

  // Admin ktorý priradil
  createdById         String
  createdBy           User     @relation("CreatedAssignments", ...)

  // Aký test sa má vytvoriť
  testTypeId          String
  testType            TestType @relation(...)

  testTypeConditionId String
  testTypeCondition   TestTypeCondition @relation(...)

  // Popis úlohy
  name                String
  description         String?

  // Status
  status              AssignmentStatus @default(PENDING)

  // Výsledok (keď gestor dokončí)
  testId              String?  @unique
  test                Test?    @relation(...)

  createdAt           DateTime @default(now())
  completedAt         DateTime?

  @@map("test_assignments")
}

enum AssignmentStatus {
  PENDING        // Gestor ešte nezačal
  IN_PROGRESS    // Gestor rozpracoval
  COMPLETED      // Gestor dokončil (čaká na schválenie)
  APPROVED       // Admin schválil
}
```

### Príklady pravidiel v TestTypeCondition

**Odborný test - Zamestnanec:**
```json
{
  "name": "Zamestnanec",
  "minQuestions": 10,
  "maxQuestions": 20,
  "timeLimitMinutes": 20,
  "pointsPerQuestion": 1.0,
  "minimumScore": 12
}
```

**Odborný test - Vedúci zamestnanec:**
```json
{
  "name": "Vedúci zamestnanec",
  "minQuestions": 15,
  "maxQuestions": 30,
  "timeLimitMinutes": 30,
  "pointsPerQuestion": 1.0,
  "minimumScore": 18
}
```

**Všeobecný test - Zamestnanec:**
```json
{
  "name": "Zamestnanec",
  "minQuestions": 20,
  "maxQuestions": 20,
  "timeLimitMinutes": 20,
  "pointsPerQuestion": 0.5,
  "minimumScore": 6
}
```

**Test zo štátneho jazyka:**
```json
{
  "name": "Všetky pozície",
  "minQuestions": 5,
  "maxQuestions": 5,
  "timeLimitMinutes": 5,
  "pointsPerQuestion": 1.0,
  "minimumScore": 3
}
```

---

## API Endpoints

### Gestor API

#### GET /api/gestor/assignments
Zoznam priradených úloh pre gestora

**Query params:**
- `status` - filter: PENDING, IN_PROGRESS, COMPLETED, APPROVED

**Response:**
```json
[
  {
    "id": "assignment-1",
    "name": "Test z pracovného práva",
    "description": "Zamerať sa na zákon 552/2003",
    "status": "PENDING",
    "testType": {
      "id": "odborny-test",
      "name": "Odborný test"
    },
    "testTypeCondition": {
      "id": "zamestnanec",
      "name": "Zamestnanec",
      "minQuestions": 10,
      "maxQuestions": 20,
      "timeLimitMinutes": 20,
      "pointsPerQuestion": 1.0,
      "minimumScore": 12
    },
    "createdAt": "2025-01-10T10:00:00Z"
  }
]
```

#### GET /api/gestor/assignments/[id]
Detail priradenia + pravidlá

**Response:**
```json
{
  "assignment": { /* ako vyššie */ },
  "rules": {
    "minQuestions": 10,
    "maxQuestions": 20,
    "timeLimitMinutes": 20,
    "pointsPerQuestion": 1.0,
    "minimumScore": 12
  },
  "availableTests": [
    {
      "id": "test-123",
      "name": "Môj starý test z pracovného práva",
      "questionsCount": 25,
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/gestor/assignments/[id]/test
Vytvorenie testu z assignmentu

**Request body:**
```json
{
  "name": "Test z pracovného práva - január 2025",
  "description": "Odborný test zameraný na zákon 552/2003",
  "questions": [
    {
      "question": "Čo upravuje zákon 552/2003?",
      "options": ["A", "B", "C"],
      "correctAnswer": 0,
      "points": 1
    }
    // ... 14 ďalších otázok (spolu 15)
  ]
}
```

**Validácia:**
- Počet otázok: 10-20 ✅ (15 je OK)
- Automaticky nastaví:
  - `timeLimit = 1200` sekúnd (20 minút)
  - `minimumScore = 12`
  - `maxScore = 15` (15 otázok × 1 bod)

**Response:**
```json
{
  "test": {
    "id": "test-456",
    "name": "Test z pracovného práva - január 2025",
    "timeLimit": 1200,
    "minimumScore": 12,
    "maxScore": 15
  },
  "assignment": {
    "id": "assignment-1",
    "status": "COMPLETED"
  }
}
```

#### POST /api/gestor/assignments/[id]/import
Import otázok z existujúceho testu

**Request body:**
```json
{
  "sourceTestId": "test-123",
  "questionCount": 15  // koľko otázok importovať (10-20)
}
```

**Akcia:**
- Skopíruje prvých 15 otázok z `test-123`
- Vytvorí nový test s týmito otázkami
- Update assignment status → COMPLETED

### Admin API

#### POST /api/admin/assignments
Vytvorenie nového priradenia

**Request body:**
```json
{
  "assignedToUserId": "gestor-123",
  "testTypeId": "odborny-test",
  "testTypeConditionId": "zamestnanec",
  "name": "Test z pracovného práva",
  "description": "Zamerať sa na zákon 552/2003"
}
```

#### GET /api/admin/assignments
Zoznam všetkých priradení (admin view)

**Query params:**
- `status` - filter
- `gestorId` - filter podľa gestora

#### PATCH /api/admin/assignments/[id]/approve
Schválenie testu

**Akcia:**
- Update assignment status → APPROVED
- Update test.approved → true

---

## Frontend štruktúra

### Gestor routes

```
/gestor
  /dashboard              - Dashboard s kartami a TODO zoznamom
  /assignments            - Zoznam priradení (TODO + Dokončené)
  /assignments/[id]       - Detail priradenia + vytvorenie testu
  /assignments/[id]/edit  - Editácia rozpracovaného testu
```

### Admin routes

```
/admin/assignments
  /new                    - Vytvorenie nového priradenia
  /                       - Zoznam priradení
  /[id]                   - Detail priradenia + schválenie
```

---

## Middleware

```typescript
// middleware.ts

// Gestor route protection
const isGestorRoute = pathname.startsWith('/gestor') || pathname.startsWith('/api/gestor')

if (isGestorRoute) {
  if (req.auth?.user?.role !== 'GESTOR') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
  return NextResponse.next()
}
```

---

## Validačné pravidlá

### Pri vytváraní testu

```typescript
function validateTestFromAssignment(test, rules) {
  const errors = []

  // Počet otázok v rozsahu
  if (test.questions.length < rules.minQuestions) {
    errors.push(`Minimálny počet otázok je ${rules.minQuestions}`)
  }
  if (test.questions.length > rules.maxQuestions) {
    errors.push(`Maximálny počet otázok je ${rules.maxQuestions}`)
  }

  // Kontrola bodov otázok (mali by byť rovnaké podľa pravidiel)
  const expectedPoints = rules.pointsPerQuestion
  test.questions.forEach((q, i) => {
    if (q.points !== expectedPoints) {
      errors.push(`Otázka ${i+1}: očakávaných ${expectedPoints} bodov, má ${q.points}`)
    }
  })

  return errors
}
```

### Pri schvaľovaní adminom

```typescript
function canApprove(assignment) {
  return assignment.status === 'COMPLETED' && assignment.testId !== null
}
```

---

## Notifikácie

### In-app notifikácie

**Gestor dashboard:**
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <p className="text-blue-900">
    Máte <strong>3 nové</strong> priradené úlohy
  </p>
</div>
```

**Admin dashboard:**
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <p className="text-green-900">
    <strong>2 testy</strong> čakajú na schválenie
  </p>
</div>
```

### Email notifikácie (budúce)

- Gestor: email pri novom priradení
- Admin: email pri dokončení testu

---

## Príklady použitia

### 1. Admin vytvára priradenie

```typescript
// Admin v UI vyberie:
const assignment = {
  assignedToUserId: gestorId,
  testTypeId: "odborny-test",
  testTypeConditionId: "zamestnanec",  // <- toto definuje pravidlá
  name: "Test z pracovného práva",
  description: "Zákon 552/2003, kapitoly 1-5"
}

// POST /api/admin/assignments
const response = await fetch('/api/admin/assignments', {
  method: 'POST',
  body: JSON.stringify(assignment)
})
```

### 2. Gestor vytvára test

```typescript
// Gestor v UI:
// 1. Klikne na assignment
// 2. Vidí pravidlá (10-20 otázok, 20 min, 1 bod/otázka, min. 12 bodov)
// 3. Vytvorí 15 otázok
// 4. Odošle

const test = {
  name: "Test z pracovného práva - január 2025",
  questions: [
    { question: "...", options: [...], correctAnswer: 0, points: 1 },
    // ... 14 ďalších
  ]
}

// POST /api/gestor/assignments/{id}/test
const response = await fetch(`/api/gestor/assignments/${assignmentId}/test`, {
  method: 'POST',
  body: JSON.stringify(test)
})

// Systém automaticky nastaví:
// - timeLimit: 1200 (20 min)
// - minimumScore: 12
// - maxScore: 15
```

### 3. Admin schvaľuje

```typescript
// Admin v UI:
// 1. Klikne na assignment s status COMPLETED
// 2. Preview testu
// 3. Klikne "Schváliť"

// PATCH /api/admin/assignments/{id}/approve
const response = await fetch(`/api/admin/assignments/${id}/approve`, {
  method: 'PATCH'
})

// Systém:
// - assignment.status → APPROVED
// - test.approved → true
```

---

## Bezpečnosť

### Autorizácia

- **Gestor** môže vidieť len svoje priradenia (`assignedToUserId = currentUserId`)
- **Gestor** nemôže schvaľovať testy
- **Admin** vidí všetky priradenia
- **Admin** môže schvaľovať len COMPLETED testy

### Validácia

- Gestor nemôže obísť pravidlá (validácia v API)
- Pravidlá sú read-only pre gestora
- Zmena pravidiel len admin (v TestTypeCondition)

---

## Ďalšie kroky

1. ✅ Implementovať databázové modely
2. ✅ Vytvoriť seed data s pravidlami
3. ✅ Implementovať backend API
4. ✅ Vytvoriť gestor UI
5. ✅ Vytvoriť admin UI pre priradenia
6. ✅ Testy (backend + E2E)
7. 🔜 Email notifikácie
8. 🔜 História zmien assignmentov (audit)

---

## Referencie

- Zadanie: `zadanie/gestor.md`
- Zákonné pravidlá: `zadanie/subory/PRÍLOHA Hackathon VK Smart.pdf` strana 5
- Obrazovky: `obrazovky/gestor/`
- Databázová schéma: `prisma/schema.prisma`
