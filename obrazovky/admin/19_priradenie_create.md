# Admin - Vytvorenie priradenia testu

## URL
`/admin/assignments/new`

## Účel
Formulár na vytvorenie nového priradenia (šablóny) testu gestorovi.

---

## Layout

### Header + Menu
(Štandardný admin layout)

---

## Obsah stránky

### 1. Breadcrumb a nadpis

```
< Späť na zoznam priradení

Vytvoriť priradenie testu
```

### 2. Formulár

```
┌─────────────────────────────────────────────────────────────┐
│ Základné informácie                                           │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Názov priradenia: *                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Test z pracovného práva                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Popis (nepovinné):                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Zamerať sa na zákon 552/2003 o výkone práce vo verejnom │ │
│ │ záujme, kapitoly 1-5. Otázky majú pokrývať základné     │ │
│ │ pojmy a princípy.                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Pridelenie                                                    │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Prideliť gestorovi: *                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Vyberte gestora ▾                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Options:                                                      │
│ - Ján Novák (jan.novak@example.com)                           │
│ - Mária Kováčová (maria.kovacova@example.com)                 │
│ - Peter Horák (peter.horak@example.com)                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Typ testu                                                     │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Typ testu: *                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Vyberte typ testu ▾                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Options:                                                      │
│ - Odborný test                                                │
│ - Všeobecný test                                              │
│ - Test zo štátneho jazyka                                     │
│ - Test z cudzieho jazyka                                      │
│ - Test z IT                                                   │
│ - Test schopností a vlastností                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Podmienka testu                                               │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Podmienka: *                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Vyberte podmienku ▾                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ (Po výbere typu testu sa načítajú dostupné podmienky)        │
│                                                               │
│ Options (pre Odborný test):                                   │
│ - Zamestnanec                                                 │
│ - Vedúci zamestnanec                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Náhľad pravidiel (po výbere podmienky)

```
┌─────────────────────────────────────────────────────────────┐
│ Pravidlá testu                                                │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Na základe vybraných parametrov bude gestor vytvárať test     │
│ s nasledujúcimi pravidlami:                                   │
│                                                               │
│ Počet otázok:        10 - 20 otázok                           │
│ Časový limit:        20 minút                                 │
│ Bodovanie:           1 bod za správnu odpoveď                 │
│ Minimum na úspech:   12 bodov                                 │
│                                                               │
│ Tieto pravidlá sú stanovené zákonom a gestor ich nemôže       │
│ meniť. Gestor môže len vybrať počet otázok v rozsahu 10-20.   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Dizajn:**
- Svetlo modrý background
- Informačná ikona
- Zobrazuje sa len po výbere podmienky

### 4. Tlačidlá akcie

```
[Zrušiť]                           [Vytvoriť priradenie] →
```

**Dizajn:**
- Zrušiť: šedé, sekundárne
- Vytvoriť: modré, primárne, disabled ak nie sú všetky povinné polia

---

## Interakcie

### Výber gestora
→ React-select dropdown
→ Hľadanie podľa mena/emailu
→ Zobrazuje: "Meno Priezvisko (email)"

### Výber typu testu
→ Načíta sa zoznam typov testov z DB
→ Po výbere sa načítajú podmienky pre daný typ

### Výber podmienky
→ Závislé na type testu
→ Po výbere sa zobrazí box s pravidlami
→ Pravidlá sa načítajú z TestTypeCondition

### Klik na "Zrušiť"
→ Navigácia späť na `/admin/assignments`

### Klik na "Vytvoriť priradenie"
→ Validácia formulára
→ POST `/api/admin/assignments`
→ Toast: "Priradenie úspešne vytvorené"
→ Navigácia na `/admin/assignments`

---

## Data loading

### API Call - Načítanie gestorov
```
GET /api/admin/users?role=GESTOR
```

**Response:**
```json
[
  {
    "id": "gestor-123",
    "name": "Ján",
    "surname": "Novák",
    "email": "jan.novak@example.com"
  },
  {
    "id": "gestor-456",
    "name": "Mária",
    "surname": "Kováčová",
    "email": "maria.kovacova@example.com"
  }
]
```

### API Call - Načítanie typov testov
```
GET /api/admin/test-types
```

**Response:**
```json
[
  {
    "id": "odborny-test",
    "name": "Odborný test",
    "description": "Test odborných vedomostí"
  },
  {
    "id": "vseobecny-test",
    "name": "Všeobecný test",
    "description": "Test všeobecných vedomostí"
  }
]
```

### API Call - Načítanie podmienok pre typ
```
GET /api/admin/test-types/[testTypeId]/conditions
```

**Response:**
```json
[
  {
    "id": "zamestnanec",
    "name": "Zamestnanec",
    "description": "Podmienky pre zamestnanca",
    "minQuestions": 10,
    "maxQuestions": 20,
    "timeLimitMinutes": 20,
    "pointsPerQuestion": 1.0,
    "minimumScore": 12
  },
  {
    "id": "veduci-zamestnanec",
    "name": "Vedúci zamestnanec",
    "description": "Podmienky pre vedúceho zamestnanca",
    "minQuestions": 15,
    "maxQuestions": 30,
    "timeLimitMinutes": 30,
    "pointsPerQuestion": 1.0,
    "minimumScore": 18
  }
]
```

### API Call - Vytvorenie priradenia
```
POST /api/admin/assignments

Body:
{
  "name": "Test z pracovného práva",
  "description": "Zamerať sa na zákon 552/2003...",
  "assignedToUserId": "gestor-123",
  "testTypeId": "odborny-test",
  "testTypeConditionId": "zamestnanec"
}
```

**Response:**
```json
{
  "id": "assignment-789",
  "name": "Test z pracovného práva",
  "status": "PENDING",
  "createdAt": "2025-01-11T10:00:00Z"
}
```

---

## Validačné pravidlá

### Názov priradenia
- Povinné
- Min 5 znakov
- Max 200 znakov
- Error: "Názov musí mať aspoň 5 znakov"

### Gestor
- Povinné
- Musí byť aktívny používateľ s rolou GESTOR
- Error: "Musíte vybrať gestora"

### Typ testu
- Povinné
- Error: "Musíte vybrať typ testu"

### Podmienka
- Povinné
- Musí patriť k vybranému typu testu
- Error: "Musíte vybrať podmienku testu"

### Inline validácia
- Názov: pri onBlur
- Ostatné: pri zmene hodnoty
- Červený border pri chybe
- Error správa pod inputom

---

## Poznámky

- Po vytvorení priradenia gestor dostane notifikáciu (in-app)
- Email notifikácia gestorovi je voliteľná (budúce)
- Pravidlá sa zobrazujú len ako informácia, nemôžu sa meniť
- Formulár používa React-select pre dropdowny
- data-testid atribúty pre E2E testy:
  - `name-input`
  - `description-input`
  - `gestor-select`
  - `test-type-select`
  - `test-condition-select`
  - `create-assignment-button`
  - `cancel-button`
