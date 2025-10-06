# Menu štruktúra: Testy

## Navigačné podmenu

Pod hlavným menu "Testy" budú 3 položky:

```
📝 Testy
  ├─ Zoznam testov          (/tests)
  ├─ Kategórie testov       (/tests/categories)
  └─ Precvičovanie          (/tests/practice)
```

---

## 1. Zoznam testov (`/tests`)

✅ **Už implementované**
- Pool hotových testov
- Filtrovanie, vyhľadávanie
- Správa testov (CRUD)

---

## 2. Kategórie testov (`/tests/categories`)

### Účel
Číselník kategórií pre lepšiu organizáciu testov. Kategórie umožňujú detailnejšiu organizáciu testov v rámci typov testov.

### Vzťah medzi Typmi testov a Kategóriami

**Typ testu (TestType)** - editovateľný číselník v databáze:
- Štátny jazyk
- Cudzí jazyk
- IT zručnosti
- Odborný test
- Všeobecný test
- Schopnosti a vlastnosti

**Kategória (TestCategory)** - editovateľný číselník, patrí do typu testu:
- Každá kategória má voliteľné pole `typeId` (odkaz na TestType model)
- Kategórie môžete filtrovať podľa typu
- Pri vytváraní testu vyberiete kategóriu (nie typ!)
- **Relace:** TestType 1:N TestCategory (ON DELETE SET NULL)

### Príklady kategórií podľa typov:

**Typ: Štátny jazyk**
- Slovenský jazyk - A1
- Slovenský jazyk - A2
- Slovenský jazyk - B1
- Slovenský jazyk - B2
- Slovenský jazyk - C1

**Typ: Cudzí jazyk**
- Anglický jazyk - A2
- Anglický jazyk - B2
- Nemecký jazyk - B1
- Francúzsky jazyk - A2

**Typ: IT zručnosti**
- IT - Základy programovania
- IT - Java Beginner
- IT - Java Advanced
- IT - Python Advanced
- IT - SQL Databázy

**Typ: Odborný test**
- Právo - Základy
- Právo - Pokročilý
- Ekonomika - Základy
- Ekonomika - Pokročilý
- Účtovníctvo - Základy

### UI
Jednoduchá tabuľka:

| Kategória | Typ testu | Počet testov | Akcie |
|-----------|-----------|--------------|-------|
| Slovenský jazyk - A1 | STATNY_JAZYK | 5 | ✏️ 🗑️ |
| Anglický jazyk - B2 | CUDZI_JAZYK | 12 | ✏️ 🗑️ |

**Tlačidlo:** "+ Pridať kategóriu"

### Dátový model
```prisma
model TestType {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?

  categories  TestCategory[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("test_types")
}

model TestCategory {
  id          String   @id @default(cuid())
  name        String   @unique

  typeId      String?
  type        TestType? @relation(fields: [typeId], references: [id], onDelete: SetNull)

  description String?

  tests       Test[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("test_categories")
}

// Test model má categoryId
model Test {
  // ... existing fields
  categoryId  String?
  category    TestCategory? @relation(fields: [categoryId], references: [id])
}
```

---

## 3. Precvičovanie (`/tests/practice`)

### Účel
- Umožniť správcom testov (ADMIN, GESTOR, SUPERADMIN) vyskúšať si test pred nasadením do VK
- Overiť si časové nastavenie testu
- Otestovaťvlastné vedomosti
- **Výsledky sú oddelené od reálnych výsledkov uchádzačov**

### Prístup
- SUPERADMIN - môže precvičovať všetky testy
- ADMIN - môže precvičovať len svoje testy
- GESTOR - môže precvičovať len svoje testy
- KOMISIA - môže precvičovať všetky schválené testy (pre sebavzdelávanie)

### UI - Výber testu

```
┌────────────────────────────────────────────────────────┐
│  🎯 Precvičovanie                                      │
│                                                        │
│  Vyskúšajte si testy a otestujte svoje vedomosti.     │
│  Výsledky sú len pre vás a neovplyvňujú štatistiky.   │
└────────────────────────────────────────────────────────┘

📝 Dostupné testy:

┌────────────────────────────────────────────────────────┐
│  Test odborných vedomostí T20                          │
│  Odborný test | 20 otázok | 45 min | Náročnosť: 6/10  │
│                                                        │
│                                    [Začať precvičovanie]│
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Test anglického jazyka B2                             │
│  Cudzí jazyk | 40 otázok | 90 min | Náročnosť: 7/10   │
│                                                        │
│  ✅ Už ste absolvovali 2x (posledné: 85%, 15.9.2024)  │
│                                    [Začať precvičovanie]│
└────────────────────────────────────────────────────────┘
```

### UI - Počas testu

Rovnaké ako pre uchádzačov, ale s označením:

```
┌────────────────────────────────────────────────────────┐
│  🎯 PRECVIČOVACÍ REŽIM                                 │
│  Výsledky sa neukladajú do oficiálnych štatistík      │
└────────────────────────────────────────────────────────┘

[Normálne rozhranie testu]
```

### UI - Výsledky po dokončení

```
┌────────────────────────────────────────────────────────┐
│  ✅ Test dokončený                                     │
│                                                        │
│  Vaše skóre: 17/20 (85%)                              │
│  Čas: 38 minút (z 45 min)                             │
│  Úspešnosť: ✅ Splnené (min. 80%)                     │
│                                                        │
│  📊 Detailné výsledky:                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                        │
│  Otázka 1: ✅ Správne (1/1 bod)                       │
│  Otázka 2: ✅ Správne (1/1 bod)                       │
│  Otázka 3: ❌ Nesprávne (0/1 bod)                     │
│    Vaša odpoveď: B                                    │
│    Správna odpoveď: A                                 │
│    Vysvetlenie: Zákon č. 55/2017 Z. z. ...            │
│  ...                                                   │
│                                                        │
│  [Skúsiť znova]  [Späť na precvičovanie]              │
└────────────────────────────────────────────────────────┘
```

### História precvičovania

Užívateľ vidí len svoje pokusy:

| Dátum | Test | Skóre | Čas | Detail |
|-------|------|-------|-----|--------|
| 15.9.2024 | Test odborných vedomostí T20 | 17/20 (85%) | 38 min | 👁️ |
| 10.9.2024 | Test odborných vedomostí T20 | 15/20 (75%) | 42 min | 👁️ |
| 5.9.2024 | Anglický jazyk B2 | 32/40 (80%) | 85 min | 👁️ |

---

## Dátový model

### Variant 1: Samostatná tabuľka (ODPORÚČANÝ)

```prisma
model PracticeTestResult {
  id            String   @id @default(cuid())

  testId        String
  test          Test     @relation(fields: [testId], references: [id])

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  answers       Json
  score         Float
  maxScore      Float
  successRate   Float
  passed        Boolean

  startedAt     DateTime
  completedAt   DateTime?
  durationSeconds Int?

  createdAt     DateTime @default(now())

  @@map("practice_test_results")
}
```

**Výhody:**
- ✅ Jasné oddelenie od reálnych výsledkov
- ✅ Jednoduché filtrovanie
- ✅ Možnosť odlišných štatistík

### Variant 2: Príznak v existujúcej tabuľke

```prisma
model TestResult {
  // ... existing fields
  isPracticeMode Boolean @default(false)
}
```

**Nevýhody:**
- ❌ Zmiešanie dát
- ❌ Potreba filtrovať všade

---

## API Endpointy

### GET /api/tests/practice
Získa zoznam testov dostupných pre precvičovanie

**Response:**
```json
{
  "tests": [
    {
      "id": "clxx...",
      "name": "Test odborných vedomostí T20",
      "questionCount": 20,
      "duration": 45,
      "difficulty": 6,
      "myAttempts": 2,
      "lastAttempt": {
        "date": "2024-09-15T10:00:00Z",
        "score": 85,
        "passed": true
      }
    }
  ]
}
```

### POST /api/tests/practice/:testId/start
Začne precvičovací test

**Response:**
```json
{
  "sessionId": "practice_session_xxx",
  "test": {
    "id": "clxx...",
    "name": "Test...",
    "questions": [...]
  },
  "startedAt": "2024-10-06T22:30:00Z",
  "expiresAt": "2024-10-06T23:15:00Z"
}
```

### POST /api/tests/practice/:sessionId/submit
Odovzdá precvičovací test

**Request:**
```json
{
  "answers": [
    { "questionId": "q1", "answer": "opt1" },
    { "questionId": "q2", "answer": ["opt1", "opt3"] }
  ]
}
```

**Response:**
```json
{
  "score": 17,
  "maxScore": 20,
  "successRate": 85,
  "passed": true,
  "durationSeconds": 2280,
  "results": [
    {
      "questionId": "q1",
      "correct": true,
      "points": 1,
      "maxPoints": 1
    },
    {
      "questionId": "q3",
      "correct": false,
      "points": 0,
      "maxPoints": 1,
      "correctAnswer": "opt1",
      "explanation": "Vysvetlenie..."
    }
  ]
}
```

### GET /api/tests/practice/history
Získa históriu precvičovania pre aktuálneho užívateľa

---

## Validácie

- Užívateľ môže mať len 1 aktívnu precvičovaciu session naraz
- Session expiruje po čase `duration + 15 minút`
- Precvičovací test musí byť schválený (approved = true) pre KOMISIA
- ADMIN/GESTOR môžu precvičovať aj neschválené vlastné testy

---

## Toast notifikácie

- ✅ "Precvičovací test bol začatý"
- ✅ "Test odovzdaný! Vaše skóre: 85%"
- ❌ "Test už nie je dostupný"
- ℹ️ "Toto je precvičovací režim - výsledky sa neposielajú do štatistík"

---

## Technické poznámky

- Session uložená v Redis/Memory (krátkodobé)
- Výsledky v samostatnej tabuľke `practice_test_results`
- Neovplyvňujú štatistiky testov
- Užívateľ vidí správne odpovede a vysvetlenia ihneď po dokončení
- Možnosť skúsiť test viackrát

---

## Budúce rozšírenia (v2)

- Porovnanie s ostatnými (anonymné)
- Grafy pokroku (ako sa zlepšujem)
- Odporúčané testy podľa slabých miest
- Časový limit na otázku (strict mode)
- Randomizácia otázok a odpovedí
