# Gestor - Zoznam priradení

## URL
`/gestor/assignments`

## Účel
Zobrazuje zoznam všetkých priradených úloh s možnosťou filtrovania podľa statusu.

---

## Layout

### Header + Menu
(Rovnaké ako Dashboard)

---

## Obsah stránky

### 1. Nadpis a breadcrumb
```
< Späť na Dashboard

Moje priradenia
```

### 2. Tab filter

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ > TODO (4)   │ Dokončené (2)│ Schválené(8) │ Všetky (14)  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Tabuľka:**
- Aktívny tab: modrý border bottom, bold text
- Neaktívny tab: šedý text, hover efekt

---

### 3. Zoznam priradení

#### Tab: TODO (PENDING + IN_PROGRESS)

```
┌─────────────────────────────────────────────────────────────┐
│ Test z pracovného práva                            [PENDING] │
│ Odborný test | Zamestnanec                                   │
│                                                               │
│ Pravidlá:                                                     │
│ • Počet otázok: 10-20                                         │
│ • Časový limit: 20 minút                                      │
│ • Bodovanie: 1 bod za otázku                                  │
│ • Minimum na úspech: 12 bodov                                 │
│                                                               │
│ Priradené: 10.01.2025 08:30 | Admin: Mária Nováková          │
│                                                               │
│ [Začať vytvárať test] →                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Test z ekonomiky                              [IN_PROGRESS]  │
│ Odborný test | Vedúci zamestnanec                             │
│                                                               │
│ Pravidlá:                                                     │
│ • Počet otázok: 15-30                                         │
│ • Časový limit: 30 minút                                      │
│ • Bodovanie: 1 bod za otázku                                  │
│ • Minimum na úspech: 18 bodov                                 │
│                                                               │
│ Priradené: 09.01.2025 14:15 | Začaté: 09.01.2025 15:00       │
│ Admin: Mária Nováková                                         │
│                                                               │
│ Pokrok: 8 / 15-30 otázok                                      │
│ [Pokračovať v tvorbe] →                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Tab: Dokončené (COMPLETED)

```
┌─────────────────────────────────────────────────────────────┐
│ Test z účtovníctva                               [COMPLETED] │
│ Odborný test | Zamestnanec                                   │
│                                                               │
│ Vytvorené: 05.01.2025 16:45                                   │
│ Počet otázok: 18                                              │
│ Status: Čaká na schválenie adminom                            │
│                                                               │
│ [Zobraziť detail] →                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Test z práva EU                                  [COMPLETED] │
│ Odborný test | Vedúci zamestnanec                             │
│                                                               │
│ Vytvorené: 03.01.2025 11:20                                   │
│ Počet otázok: 25                                              │
│ Status: Čaká na schválenie adminom                            │
│                                                               │
│ [Zobraziť detail] →                                           │
└─────────────────────────────────────────────────────────────┘
```

#### Tab: Schválené (APPROVED)

```
┌─────────────────────────────────────────────────────────────┐
│ Test z IT bezpečnosti                             [APPROVED] │
│ Odborný test | Zamestnanec                                   │
│                                                               │
│ Vytvorené: 20.12.2024 14:30                                   │
│ Schválené: 21.12.2024 09:00 | Adminom: Mária Nováková        │
│ Počet otázok: 15                                              │
│                                                               │
│ [Zobraziť detail] →                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Interakcie

### Klik na tab filter
→ Zmena zobrazených priradení podľa statusu

### Klik na "Začať vytvárať test" / "Pokračovať v tvorbe"
→ Navigácia na `/gestor/assignments/[id]`

### Klik na "Zobraziť detail"
→ Navigácia na `/gestor/assignments/[id]` (read-only pre COMPLETED/APPROVED)

### Klik na "< Späť na Dashboard"
→ Navigácia na `/gestor/dashboard`

---

## Data loading

### API Call
```
GET /api/gestor/assignments?status={tab}
```

**Query params:**
- `status=TODO` - PENDING + IN_PROGRESS
- `status=COMPLETED` - len COMPLETED
- `status=APPROVED` - len APPROVED
- (žiadny param) - všetky

### Response
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
    "createdBy": {
      "name": "Mária",
      "surname": "Nováková"
    },
    "createdAt": "2025-01-10T08:30:00Z",
    "startedAt": null,
    "completedAt": null,
    "test": null
  },
  {
    "id": "assignment-2",
    "name": "Test z ekonomiky",
    "status": "IN_PROGRESS",
    "testType": {
      "name": "Odborný test"
    },
    "testTypeCondition": {
      "name": "Vedúci zamestnanec",
      "minQuestions": 15,
      "maxQuestions": 30,
      "timeLimitMinutes": 30,
      "pointsPerQuestion": 1.0,
      "minimumScore": 18
    },
    "createdBy": {
      "name": "Mária",
      "surname": "Nováková"
    },
    "createdAt": "2025-01-09T14:15:00Z",
    "startedAt": "2025-01-09T15:00:00Z",
    "test": {
      "id": "test-draft-123",
      "questionsCount": 8
    }
  }
]
```

---

## Validácia

- Len role GESTOR môže pristúpiť
- Zobrazujú sa len priradenia pridelené aktuálnemu gestorovi
- PENDING/IN_PROGRESS: tlačidlo "Začať/Pokračovať"
- COMPLETED/APPROVED: tlačidlo "Zobraziť detail" (read-only)

---

## Dizajn poznámky

### Status badge farby:
- **PENDING**: oranžový background, oranžový text
- **IN_PROGRESS**: modrý background, modrý text
- **COMPLETED**: zelený background, zelený text
- **APPROVED**: tmavo zelený background, biely text

### Progress bar (pre IN_PROGRESS):
```
Pokrok: 8 / 15-30 otázok
[████████░░░░░░░░] 40%
```

- Modrý progress bar
- Zobrazuje počet vytvorených otázok / minimum-maximum

---

## Poznámky

- Zoznam je zoradený od najnovších po najstaršie
- Pagination: ak je viac ako 20 items
- Search: pridať vyhľadávanie podľa názvu (voliteľné)
