# Admin - Detail priradenia

## URL
`/admin/assignments/[id]`

## Účel
Zobrazuje detail priradenia s možnosťou schválenia testu (ak je status COMPLETED).

---

## Layout

### Header + Menu
(Štandardný admin layout)

---

## Obsah stránky - Pre PENDING / IN_PROGRESS

### 1. Breadcrumb a nadpis

```
< Späť na zoznam priradení

Test z pracovného práva
[PENDING]
```

### 2. Informácie o priradení

```
┌─────────────────────────────────────────────────────────────┐
│ Informácie o priradení                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Názov:            Test z pracovného práva                     │
│ Popis:            Zamerať sa na zákon 552/2003...             │
│                                                               │
│ Pridelené:        10.01.2025 08:30                            │
│ Pridelil:         Mária Nováková (vy)                         │
│                                                               │
│ Gestor:           Ján Novák                                   │
│ Email:            jan.novak@example.com                       │
│                                                               │
│ Typ testu:        Odborný test                                │
│ Podmienka:        Zamestnanec                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Pravidlá testu

```
┌─────────────────────────────────────────────────────────────┐
│ Pravidlá testu                                                │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Počet otázok:        10 - 20 otázok                           │
│ Časový limit:        20 minút                                 │
│ Bodovanie:           1 bod za správnu odpoveď                 │
│ Minimum na úspech:   12 bodov                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 4. Status box

**Pre PENDING:**
```
┌─────────────────────────────────────────────────────────────┐
│ Status                                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Gestor ešte nezačal pracovať na teste.                        │
│                                                               │
│ Pridelené: 10.01.2025 08:30                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Pre IN_PROGRESS:**
```
┌─────────────────────────────────────────────────────────────┐
│ Status                                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Gestor pracuje na teste.                                      │
│                                                               │
│ Pridelené: 10.01.2025 08:30                                   │
│ Začaté:    10.01.2025 10:15                                   │
│                                                               │
│ Pokrok: 8 / 10-20 otázok                                      │
│ [████████░░░░░░░░░░] 40%                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Obsah stránky - Pre COMPLETED

### 1. Breadcrumb a nadpis

```
< Späť na zoznam priradení

Test z pracovného práva
[COMPLETED]
```

### 2. Status box (zvýraznený)

```
┌─────────────────────────────────────────────────────────────┐
│ Status                                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Test bol dokončený a čaká na vaše schválenie.                 │
│                                                               │
│ Pridelené: 10.01.2025 08:30                                   │
│ Začaté:    10.01.2025 10:15                                   │
│ Dokončené: 10.01.2025 16:45                                   │
│                                                               │
│ Gestor: Ján Novák                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Dizajn:**
- Žltý background (upozornenie)
- Žltý border

### 3. Informácie o priradení
(Rovnaké ako PENDING/IN_PROGRESS)

### 4. Detail testu

```
┌─────────────────────────────────────────────────────────────┐
│ Vytvorený test                                                │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Názov testu:      Test z pracovného práva - január 2025      │
│ Popis:            Test zameraný na zákon 552/2003...          │
│                                                               │
│ Počet otázok:     18                                          │
│ Časový limit:     20 minút                                    │
│ Maximálne body:   18 bodov                                    │
│ Minimum:          12 bodov (67%)                              │
│                                                               │
│ [Náhľad otázok]                                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5. Tlačidlá akcie

```
[Späť na zoznam]                [Schváliť test] →
```

**Dizajn:**
- Späť: šedé, sekundárne
- Schváliť: zelené, primárne, veľké tlačidlo

---

## Obsah stránky - Pre APPROVED

### 1. Status box

```
┌─────────────────────────────────────────────────────────────┐
│ Status                                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Test bol schválený a je pripravený na použitie.               │
│                                                               │
│ Pridelené:  10.01.2025 08:30                                  │
│ Dokončené:  10.01.2025 16:45                                  │
│ Schválené:  11.01.2025 09:00                                  │
│ Schválil:   Mária Nováková (vy)                               │
│                                                               │
│ Test je dostupný v zozname testov a môže byť priradený        │
│ k výberovému konaniu.                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Dizajn:**
- Zelený background
- Zelený border
- Ikona checkmark

### 2. Detail testu
(Rovnaké ako COMPLETED)

### 3. Tlačidlá

```
[Späť na zoznam]                [Zobraziť test v zozname testov] →
```

---

## Interakcie

### Klik na "Náhľad otázok"
→ Modal s náhľadom všetkých otázok testu

Modal obsah:
```
┌─────────────────────────────────────────────────────────────┐
│ Náhľad otázok                                          [X]    │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Test z pracovného práva - január 2025                         │
│ 18 otázok                                                     │
│                                                               │
│ ──────────────────────────────────────────────────────────────│
│ Otázka 1                                              1 bod   │
│                                                               │
│ Čo upravuje zákon 552/2003 Z. z.?                             │
│                                                               │
│ A) Výkon práce vo verejnom záujme                             │
│ B) Štátnu službu [✓ SPRÁVNA]                                 │
│ C) Prácu vo verejnom sektore                                  │
│                                                               │
│ ──────────────────────────────────────────────────────────────│
│ Otázka 2                                              1 bod   │
│ ...                                                           │
│                                                               │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ [Zavrieť]                                                     │
└─────────────────────────────────────────────────────────────┘
```

### Klik na "Schváliť test"
→ Confirmation modal:

```
┌─────────────────────────────────────────────────────────────┐
│ Schváliť test                                                 │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Naozaj chcete schváliť tento test?                            │
│                                                               │
│ Test:          Test z pracovného práva - január 2025          │
│ Gestor:        Ján Novák                                      │
│ Počet otázok:  18                                             │
│ Časový limit:  20 minút                                       │
│                                                               │
│ Po schválení:                                                 │
│ • Test bude dostupný v zozname testov                         │
│ • Test môže byť priradený k výberovému konaniu                │
│ • Gestor bude informovaný o schválení                         │
│                                                               │
│ [Zrušiť]                              [Schváliť test] →       │
└─────────────────────────────────────────────────────────────┘
```

→ PATCH `/api/admin/assignments/[id]/approve`
→ Toast: "Test úspešne schválený"
→ Refresh stránky (status → APPROVED)

### Klik na "Zobraziť test v zozname testov"
→ Navigácia na `/admin/tests?search=[testName]`

### Klik na "Späť na zoznam"
→ Navigácia na `/admin/assignments`

---

## Data loading

### API Call
```
GET /api/admin/assignments/[id]
```

### Response
```json
{
  "assignment": {
    "id": "assignment-1",
    "name": "Test z pracovného práva",
    "description": "Zamerať sa na zákon 552/2003...",
    "status": "COMPLETED",
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
    "assignedTo": {
      "id": "gestor-123",
      "name": "Ján",
      "surname": "Novák",
      "email": "jan.novak@example.com"
    },
    "createdBy": {
      "id": "admin-456",
      "name": "Mária",
      "surname": "Nováková"
    },
    "createdAt": "2025-01-10T08:30:00Z",
    "startedAt": "2025-01-10T10:15:00Z",
    "completedAt": "2025-01-10T16:45:00Z",
    "approvedAt": null,
    "approvedBy": null
  },
  "test": {
    "id": "test-789",
    "name": "Test z pracovného práva - január 2025",
    "description": "Test zameraný na zákon 552/2003...",
    "questionsCount": 18,
    "timeLimit": 1200,
    "maxScore": 18,
    "minimumScore": 12,
    "approved": false,
    "questions": [
      {
        "id": "q-1",
        "question": "Čo upravuje zákon 552/2003 Z. z.?",
        "options": [
          "Výkon práce vo verejnom záujme",
          "Štátnu službu",
          "Prácu vo verejnom sektore"
        ],
        "correctAnswer": 1,
        "points": 1
      }
      // ... 17 ďalších otázok
    ]
  }
}
```

### API Call - Schválenie
```
PATCH /api/admin/assignments/[id]/approve
```

**Response:**
```json
{
  "assignment": {
    "id": "assignment-1",
    "status": "APPROVED",
    "approvedAt": "2025-01-11T09:00:00Z",
    "approvedById": "admin-456"
  },
  "test": {
    "id": "test-789",
    "approved": true,
    "approvedAt": "2025-01-11T09:00:00Z"
  }
}
```

---

## Validácia

- Len role ADMIN môže pristúpiť
- Schvaľovať môže len test so statusom COMPLETED
- Po schválení nie je možné test upravovať

---

## Poznámky

- Pre PENDING/IN_PROGRESS len read-only zobrazenie
- Pre COMPLETED zvýraznený status box a tlačidlo schváliť
- Pre APPROVED zelený status box a link na test
- Modal s náhľadom otázok scrollovateľný
- Po schválení sa test zobrazí v `/admin/tests` s `approved=true`
- data-testid atribúty:
  - `assignment-status`
  - `preview-questions-button`
  - `approve-test-button`
  - `back-button`
