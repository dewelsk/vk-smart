# Gestor - Detail priradenia a vytvorenie testu

## URL
`/gestor/assignments/[id]`

## Účel
Detail priradenia s možnosťou vytvorenia testu (pre PENDING/IN_PROGRESS) alebo zobrazenia hotového testu (pre COMPLETED/APPROVED).

---

## Layout

### Header + Menu
(Rovnaké ako Dashboard)

---

## Obsah stránky - Pre PENDING/IN_PROGRESS

### 1. Breadcrumb a nadpis
```
< Späť na zoznam priradení

Test z pracovného práva
[PENDING]
```

### 2. Informácie o úlohe

```
┌─────────────────────────────────────────────────────────────┐
│ Informácie o úlohe                                            │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Typ testu: Odborný test                                       │
│ Podmienka: Zamestnanec                                        │
│                                                               │
│ Popis úlohy:                                                  │
│ Zamerať sa na zákon 552/2003 o výkone práce vo verejnom       │
│ záujme, kapitoly 1-5. Otázky majú pokrývať základné pojmy     │
│ a princípy.                                                   │
│                                                               │
│ Priradené: 10.01.2025 08:30                                   │
│ Admin: Mária Nováková                                         │
└─────────────────────────────────────────────────────────────┘
```

### 3. Zákonné pravidlá (read-only box)

```
┌─────────────────────────────────────────────────────────────┐
│ Zákonné pravidlá                                              │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Počet otázok:        10 - 20 otázok                           │
│ Časový limit:        20 minút                                 │
│ Bodovanie:           1 bod za správnu odpoveď                 │
│ Minimum na úspech:   12 bodov                                 │
│                                                               │
│ Poznámka: Tieto pravidlá sú stanovené zákonom a nie je       │
│ možné ich meniť.                                              │
└─────────────────────────────────────────────────────────────┘
```

**Dizajn:**
- Svetlo modrý background
- Modrý border
- Ikona informácie (i) pri poznámke

### 4. Tab navigácia

```
┌──────────────────┬──────────────────┐
│ > Nový test      │ Import z testu   │
└──────────────────┴──────────────────┘
```

---

## Tab 1: Nový test

### Formulár na vytvorenie testu

```
┌─────────────────────────────────────────────────────────────┐
│ Vytvorenie testu                                              │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Názov testu: *                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Test z pracovného práva - január 2025                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Popis testu:                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Test zameraný na zákon 552/2003, kapitoly 1-5           │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Otázky: 0 / 10-20                                             │
│                                                               │
│ [+ Pridať otázku]                                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Formulár pre pridanie otázky

Po kliknutí na "+ Pridať otázku":

```
┌─────────────────────────────────────────────────────────────┐
│ Otázka 1                                             [Zmazať]│
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Otázka: *                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Čo upravuje zákon 552/2003 Z. z.?                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Odpoveď A: *                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Výkon práce vo verejnom záujme                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ( ) Správna odpoveď                                           │
│                                                               │
│ Odpoveď B: *                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Štátnu službu                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ (•) Správna odpoveď                                           │
│                                                               │
│ Odpoveď C: *                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Prácu vo verejnom sektore                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ( ) Správna odpoveď                                           │
│                                                               │
│ Body za otázku: 1 bod (automaticky)                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

[+ Pridať ďalšiu otázku]
```

**Validácia:**
- Otázka: povinné
- Všetky 3 odpovede: povinné
- Musí byť vybraná jedna správna odpoveď
- Body sú automatické (1 bod z pravidiel)

### Progress bar

```
┌─────────────────────────────────────────────────────────────┐
│ Pokrok                                                        │
│                                                               │
│ Otázok: 8 / 10-20                                             │
│ [████████░░░░░░░░░░] 40% (minimum je 10 otázok)               │
│                                                               │
│ ⚠ Potrebujete ešte minimálne 2 otázky                         │
└─────────────────────────────────────────────────────────────┘
```

Po dosiahnutí minima (10 otázok):

```
┌─────────────────────────────────────────────────────────────┐
│ Pokrok                                                        │
│                                                               │
│ Otázok: 15 / 10-20                                            │
│ [███████████████░░░░] 75%                                     │
│                                                               │
│ ✓ Test spĺňa minimálne požiadavky                             │
└─────────────────────────────────────────────────────────────┘
```

### Tlačidlá akcie

```
[Uložiť ako koncept]    [Uložiť a odoslať na schválenie] →
```

**Logika:**
- "Uložiť ako koncept": status zostane IN_PROGRESS
- "Uložiť a odoslať": dostupné len ak má 10-20 otázok, status → COMPLETED

---

## Tab 2: Import z existujúceho testu

```
┌─────────────────────────────────────────────────────────────┐
│ Import otázok z existujúceho testu                            │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Vyberte test:                                                 │
│                                                               │
│ ( ) Test z pracovného práva - december 2024                   │
│     Počet otázok: 25 | Vytvorené: 15.12.2024                  │
│     [Náhľad otázok]                                           │
│                                                               │
│ (•) Test z štátnej služby                                     │
│     Počet otázok: 18 | Vytvorené: 10.11.2024                  │
│     [Náhľad otázok]                                           │
│                                                               │
│ ( ) Test z verejnej správy                                    │
│     Počet otázok: 30 | Vytvorené: 05.10.2024                  │
│     [Náhľad otázok]                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Nastavenia importu                                            │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Koľko otázok importovať?                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 15                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ (minimum: 10, maximum: 20)                                    │
│                                                               │
│ Systém skopíruje prvých 15 otázok z vybraného testu.          │
│                                                               │
│ [Importovať otázky]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Po importe:**
→ Presmeruje na tab "Nový test" s naimportovanými otázkami
→ Gestor môže otázky upraviť/pridať/odobrať

---

## Obsah stránky - Pre COMPLETED (read-only)

```
< Späť na zoznam priradení

Test z pracovného práva
[COMPLETED]
```

```
┌─────────────────────────────────────────────────────────────┐
│ Status                                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Test bol dokončený a odoslaný na schválenie.                  │
│ Čaká na schválenie adminom: Mária Nováková                    │
│                                                               │
│ Odoslané: 05.01.2025 16:45                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Detail testu                                                  │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ Názov: Test z pracovného práva - január 2025                  │
│ Popis: Test zameraný na zákon 552/2003, kapitoly 1-5          │
│                                                               │
│ Počet otázok: 18                                              │
│ Časový limit: 20 minút                                        │
│ Maximálne body: 18                                            │
│ Minimum na úspech: 12 bodov                                   │
│                                                               │
│ [Zobraziť otázky]                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Obsah stránky - Pre APPROVED (read-only)

```
< Späť na zoznam priradení

Test z pracovného práva
[APPROVED]
```

```
┌─────────────────────────────────────────────────────────────┐
│ Status                                                        │
│ ──────────────────────────────────────────────────────────────│
│                                                               │
│ ✓ Test bol schválený adminom                                  │
│                                                               │
│ Vytvorené: 05.01.2025 16:45                                   │
│ Schválené: 06.01.2025 09:15                                   │
│ Schválil: Mária Nováková                                      │
│                                                               │
│ Test je pripravený na priradenie do výberového konania.       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Detail testu                                                  │
│ (rovnaké ako COMPLETED)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Interakcie

### Klik na "Pridať otázku"
→ Zobrazí nový formulár otázky

### Klik na "Zmazať" pri otázke
→ Confirmation modal: "Naozaj chcete zmazať túto otázku?"
→ Po potvrdení: odstráni otázku, prepočíta progress

### Klik na "Uložiť ako koncept"
→ POST /api/gestor/assignments/[id]/draft
→ Toast: "Koncept uložený"
→ Status zostane IN_PROGRESS

### Klik na "Uložiť a odoslať na schválenie"
→ Validácia: 10-20 otázok?
→ Confirmation modal: "Test bude odoslaný na schválenie. Po odoslaní už nebudete môcť test upravovať. Pokračovať?"
→ POST /api/gestor/assignments/[id]/test
→ Toast: "Test úspešne odoslaný na schválenie"
→ Redirect na `/gestor/assignments`

### Klik na "Importovať otázky"
→ Validácia: vybraný test? počet otázok v rozsahu?
→ POST /api/gestor/assignments/[id]/import
→ Presun na tab "Nový test" s naimportovanými otázkami

### Klik na "Zobraziť otázky" (COMPLETED/APPROVED)
→ Modal s náhľadom všetkých otázok

---

## Data loading

### API Call (na načítanie)
```
GET /api/gestor/assignments/[id]
```

### Response
```json
{
  "assignment": {
    "id": "assignment-1",
    "name": "Test z pracovného práva",
    "description": "Zamerať sa na zákon 552/2003...",
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
    "createdAt": "2025-01-10T08:30:00Z"
  },
  "test": null,
  "availableTests": [
    {
      "id": "test-123",
      "name": "Test z pracovného práva - december 2024",
      "questionsCount": 25,
      "createdAt": "2024-12-15T10:00:00Z"
    }
  ]
}
```

### API Call (uloženie konceptu)
```
POST /api/gestor/assignments/[id]/draft

Body:
{
  "name": "Test z pracovného práva - január 2025",
  "description": "...",
  "questions": [...]
}
```

### API Call (odoslanie testu)
```
POST /api/gestor/assignments/[id]/test

Body: (rovnaké ako draft)
```

### API Call (import)
```
POST /api/gestor/assignments/[id]/import

Body:
{
  "sourceTestId": "test-123",
  "questionCount": 15
}
```

---

## Validačné pravidlá

### Počet otázok
- Minimum: podľa `minQuestions` z pravidiel (napr. 10)
- Maximum: podľa `maxQuestions` z pravidiel (napr. 20)
- Error: "Počet otázok musí byť v rozsahu 10-20"

### Otázka
- Text otázky: povinné, min 10 znakov
- Všetky 3 odpovede: povinné, min 1 znak
- Jedna správna odpoveď: povinné vybr ať
- Error: "Musíte vyplniť všetky odpovede a vybrať správnu odpoveď"

### Odoslanie testu
- Ak menej ako minQuestions: Error "Test musí mať minimálne X otázok"
- Ak viac ako maxQuestions: Error "Test môže mať maximálne X otázok"
- Confirmation pred odoslaním

---

## Poznámky

- Progress bar sa aktualizuje real-time pri pridávaní/odobraní otázok
- Bodovanie je automatické podľa pravidiel (read-only)
- Import kopíruje otázky, nerobí linking (gestor môže upravovať)
- Po odoslaní testu (COMPLETED) už nie je možné upravovať
