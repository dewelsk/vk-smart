# Gestor Dashboard

## URL
`/gestor/dashboard`

## Účel
Hlavná stránka gestora po prihlásení. Zobrazuje prehľad priradených úloh a štatistiky.

---

## Layout

### Header
```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                      Vecný gestor   │
│                                               Ján Novák       │
│                                               [Odhlásiť]      │
└─────────────────────────────────────────────────────────────┘
```

### Menu
```
┌──────────────┐
│ > Testy      │  <- Aktívne
└──────────────┘
```

---

## Obsah stránky

### 1. Nadpis
```
Dashboard
```

### 2. Štatistiky (4 karty v rade)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Pridelené úlohy  │  │ Rozpracované     │  │ Dokončené        │  │ Schválené        │
│                  │  │                  │  │                  │  │                  │
│       3          │  │       1          │  │       2          │  │       8          │
│                  │  │                  │  │                  │  │                  │
│ [Status: PENDING]│  │ [IN_PROGRESS]    │  │ [COMPLETED]      │  │ [APPROVED]       │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Dizajn kariet:**
- Biela karta s border
- Nadpis: malý text, šedý
- Číslo: veľký, bold, čierny
- Status: malý text, šedý

### 3. Notifikačný banner (ak sú nové priradenia)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Máte 3 nové priradené úlohy                               │
│   [Zobraziť priradenia] →                                    │
└─────────────────────────────────────────────────────────────┘
```

**Dizajn:**
- Svetlo modrý background
- Modrý border
- Tlačidlo: modrý text, underline on hover

### 4. TODO zoznam (Pridelené a rozpracované úlohy)

```
Moje úlohy
──────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│ Test z pracovného práva                            [PENDING] │
│ Odborný test | Zamestnanec | 10-20 otázok                   │
│ Priradené: 10.01.2025 08:30                                  │
│                                                               │
│ [Začať vytvárať test] →                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Test z ekonomiky                              [IN_PROGRESS]  │
│ Odborný test | Vedúci zamestnanec | 15-30 otázok             │
│ Priradené: 09.01.2025 14:15 | Začaté: 09.01.2025 15:00       │
│                                                               │
│ [Pokračovať] →                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Test z verejnej správy                            [PENDING]  │
│ Odborný test | Zamestnanec | 10-20 otázok                   │
│ Priradené: 08.01.2025 10:00                                  │
│                                                               │
│ [Začať vytvárať test] →                                       │
└─────────────────────────────────────────────────────────────┘

[Zobraziť všetky úlohy] →
```

**Dizajn kariet:**
- Biela karta s border
- Názov: bold, čierny
- Meta informácie: malý text, šedý
- Status badge:
  - PENDING: oranžový
  - IN_PROGRESS: modrý
  - COMPLETED: zelený
  - APPROVED: tmavo zelený

---

## Interakcie

### Klik na "Zobraziť priradenia" (v banneri)
→ Navigácia na `/gestor/assignments`

### Klik na "Začať vytvárať test"
→ Navigácia na `/gestor/assignments/[id]`

### Klik na "Pokračovať"
→ Navigácia na `/gestor/assignments/[id]`

### Klik na "Zobraziť všetky úlohy"
→ Navigácia na `/gestor/assignments`

---

## Data loading

### API Call
```
GET /api/gestor/dashboard
```

### Response
```json
{
  "stats": {
    "pending": 3,
    "inProgress": 1,
    "completed": 2,
    "approved": 8
  },
  "todoAssignments": [
    {
      "id": "assignment-1",
      "name": "Test z pracovného práva",
      "status": "PENDING",
      "testType": {
        "name": "Odborný test"
      },
      "testTypeCondition": {
        "name": "Zamestnanec",
        "minQuestions": 10,
        "maxQuestions": 20
      },
      "createdAt": "2025-01-10T08:30:00Z",
      "startedAt": null
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
        "maxQuestions": 30
      },
      "createdAt": "2025-01-09T14:15:00Z",
      "startedAt": "2025-01-09T15:00:00Z"
    }
  ]
}
```

---

## Validácia

- Len role GESTOR môže pristúpiť
- Zobrazujú sa len úlohy pridelené aktuálnemu gestorovi

---

## Poznámky

- Dashboard je prvá stránka po prihlásení gestora
- TODO zoznam zobrazuje max 10 items, ostatné cez "Zobraziť všetky"
- Štatistiky sa aktualizujú real-time
- Notifikačný banner sa zobrazí len ak `stats.pending > 0`
