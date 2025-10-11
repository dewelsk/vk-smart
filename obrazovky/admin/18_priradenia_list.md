# Admin - Zoznam priradení testov

## URL
`/admin/assignments`

## Účel
Zobrazuje zoznam všetkých priradení (šablón) testov gestorom s možnosťou filtrovania, vytvárania nových priradení a schvaľovania dokončených testov.

---

## Layout

### Header + Menu
(Štandardný admin layout)

### Menu položka
- **Priradenia testov** (nová položka v menu)

---

## Obsah stránky

### 1. Nadpis a tlačidlo

```
Priradenia testov                      [+ Vytvoriť priradenie]
```

**Tlačidlo dizajn:**
- Modrý background
- Biely text
- Hover: tmavší modrý

### 2. Štatistiky (4 karty)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Čakajú           │  │ Rozpracované     │  │ Na schválenie    │  │ Schválené        │
│                  │  │                  │  │                  │  │                  │
│       5          │  │       3          │  │       2          │  │       24         │
│                  │  │                  │  │                  │  │                  │
│ [PENDING]        │  │ [IN_PROGRESS]    │  │ [COMPLETED]      │  │ [APPROVED]       │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 3. Filter a search

```
┌─────────────────────────────────────────────────────────────┐
│ Hľadať: [____________________]  Status: [Všetky ▾]           │
│                                 Gestor: [Všetci ▾]           │
└─────────────────────────────────────────────────────────────┘
```

**Filter - Status options:**
- Všetky
- Čakajú (PENDING)
- Rozpracované (IN_PROGRESS)
- Na schválenie (COMPLETED)
- Schválené (APPROVED)

**Filter - Gestor options:**
- Všetci gestori
- [Zoznam gestorov z DB]

### 4. Tab navigácia

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ > Všetky (34)    │ Na schválenie(2) │ Čakajú (5)       │ Schválené (24)   │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### 5. Tabuľka priradení

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Názov               │ Gestor        │ Typ testu     │ Status    │ Akcie   │
├────────────────────────────────────────────────────────────────────────────┤
│ Test z pracovného  │ Ján Novák     │ Odborný test  │ PENDING   │ [Detai│ │
│ práva              │               │ Zamestnanec   │           │         │
│ Priradené:         │               │               │           │         │
│ 10.01.2025 08:30   │               │               │           │         │
├────────────────────────────────────────────────────────────────────────────┤
│ Test z ekonomiky   │ Ján Novák     │ Odborný test  │IN_PROGRESS│ [Detail]│
│                    │               │ Vedúci        │           │         │
│ Priradené:         │               │ zamestnanec   │           │         │
│ 09.01.2025 14:15   │               │               │           │         │
│ Začaté:            │               │               │           │         │
│ 09.01.2025 15:00   │               │               │           │         │
├────────────────────────────────────────────────────────────────────────────┤
│ Test z účtovníctva │ Mária Kováčová│ Odborný test  │ COMPLETED │[Schváliť│
│                    │               │ Zamestnanec   │           │ [Detail]│
│ Priradené:         │               │               │           │         │
│ 05.01.2025 10:00   │               │               │           │         │
│ Dokončené:         │               │               │           │         │
│ 05.01.2025 16:45   │               │               │           │         │
├────────────────────────────────────────────────────────────────────────────┤
│ Test z IT          │ Peter Horák   │ Odborný test  │ APPROVED  │ [Detail]│
│ bezpečnosti        │               │ Zamestnanec   │           │         │
│ Priradené:         │               │               │           │         │
│ 20.12.2024 14:30   │               │               │           │         │
│ Schválené:         │               │               │           │         │
│ 21.12.2024 09:00   │               │               │           │         │
└────────────────────────────────────────────────────────────────────────────┘

[< Predchádzajúca]  Strana 1 z 3  [Ďalšia >]
```

**Status badge farby:**
- PENDING: oranžový
- IN_PROGRESS: modrý
- COMPLETED: žltý (upozornenie na schválenie)
- APPROVED: zelený

**Akcie:**
- PENDING, IN_PROGRESS, APPROVED: len [Detail]
- COMPLETED: [Schváliť] (primárne, modré) + [Detail] (sekundárne)

---

## Interakcie

### Klik na "+ Vytvoriť priradenie"
→ Navigácia na `/admin/assignments/new`

### Klik na "Detail"
→ Navigácia na `/admin/assignments/[id]`

### Klik na "Schváliť" (pri COMPLETED)
→ Confirmation modal:
```
┌─────────────────────────────────────────────┐
│ Schváliť test                               │
│                                             │
│ Naozaj chcete schváliť tento test?         │
│                                             │
│ Test: Test z účtovníctva                    │
│ Gestor: Mária Kováčová                      │
│ Počet otázok: 18                            │
│                                             │
│ Po schválení bude test pripravený          │
│ na priradenie do výberového konania.       │
│                                             │
│ [Zrušiť]              [Schváliť test] →     │
└─────────────────────────────────────────────┘
```

→ PATCH `/api/admin/assignments/[id]/approve`
→ Toast: "Test úspešne schválený"
→ Refresh tabuľky

### Filter - Status
→ Refresh tabuľky s filtrom

### Filter - Gestor
→ Refresh tabuľky s filtrom

### Search
→ Debounced search (500ms)
→ Hľadá v názve priradenia

### Tab navigácia
→ Zmena zobrazených priradení

---

## Data loading

### API Call
```
GET /api/admin/assignments
```

**Query params:**
- `status` - filter: PENDING, IN_PROGRESS, COMPLETED, APPROVED
- `gestorId` - filter podľa gestora
- `search` - search query
- `page` - pagination
- `limit` - items per page (default: 20)

### Response
```json
{
  "assignments": [
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
        "name": "Zamestnanec"
      },
      "assignedTo": {
        "id": "gestor-123",
        "name": "Ján",
        "surname": "Novák"
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
      "name": "Test z účtovníctva",
      "status": "COMPLETED",
      "testType": {
        "name": "Odborný test"
      },
      "testTypeCondition": {
        "name": "Zamestnanec"
      },
      "assignedTo": {
        "name": "Mária",
        "surname": "Kováčová"
      },
      "createdAt": "2025-01-05T10:00:00Z",
      "completedAt": "2025-01-05T16:45:00Z",
      "test": {
        "id": "test-456",
        "name": "Test z účtovníctva - január 2025",
        "questionsCount": 18
      }
    }
  ],
  "stats": {
    "pending": 5,
    "inProgress": 3,
    "completed": 2,
    "approved": 24,
    "total": 34
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 34,
    "pages": 2
  }
}
```

---

## Validácia

- Len role ADMIN môže pristúpiť
- Schvaľovať môže len priradenia so statusom COMPLETED

---

## Poznámky

- Tabuľka je sortovaná od najnovších po najstaršie (podľa createdAt)
- Pri COMPLETED statusu je tlačidlo "Schváliť" zvýraznené (primárne tlačidlo)
- Štatistiky sa aktualizujú real-time
- Tab "Na schválenie" zobrazuje len COMPLETED status
- Po schválení sa test zobrazí v zozname testov na stránke `/admin/tests` a môže sa priradiť k VK
