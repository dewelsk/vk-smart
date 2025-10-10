# Obrazovka: Pridelenie testov k VK

**Route:** `/vk/[id]/tests`

**Účel:** Admin priraďuje testy k výberovému konaniu, nastavuje levely, počet otázok, čas, bodovanie a minimálne skóre podľa typu VK.

**Role:** ADMIN, SUPERADMIN

---

## Požiadavky zo zadania

**Strana 3:**
> "Po priradení testu by mal admin vedieť nastaviť podmienky testovania. Definovať rozsah testu, časové rozpätie, definovať pridelené body, definovať správne odpovede – toto definovanie vyplýva z vyhláseného VK."

**Strana 4:**
> "Testovanie je odlevelované a admin by mal vedieť vybrať typy testov, ktoré sú zadefinované vo VK. Len v prípade úspešnosti v jednom teste môže uchádzač postúpiť do ďalšieho testovania."

**Postupné levely testov:**
1. Level 1 - Odborný test
2. Level 2 - Všeobecný test
3. Level 3 - Test štátneho jazyka
4. Level 4 - Test cudzieho jazyka
5. Level 5 - Test práce s IT
6. Level 6 - Test schopností a vlastností

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  VK/2025/1234 › Testy                        [Späť na VK]    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  HLAVIČKA VK                                                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ VK/2025/1234 - hlavný štátny radca                   │    │
│  │ Druh VK: širšie vnútorné výberové konanie            │    │
│  │ Status: PRIPRAVA                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  PRIDELENÉ TESTY                       [+ Pridať test]        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Level 1: Odborný test                      [Upraviť] │    │
│  │                                             [Odstrániť] │  │
│  │ Test: Odborný test - Medzinárodná spolupráca         │    │
│  │ Počet otázok: 20 / Trvanie: 20 min                   │    │
│  │ Bodovanie: 1 bod/otázku / Min. skóre: 12 bodov       │    │
│  │                                                       │    │
│  │ Status: ✓ Nakonfigurovaný                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Level 2: Test cudzieho jazyka              [Upraviť] │    │
│  │                                             [Odstrániť] │  │
│  │ Test: Anglický jazyk - Úroveň B1                     │    │
│  │ Počet otázok: 40 / Trvanie: 40 min                   │    │
│  │ Bodovanie: 0.5 bod/otázku / Min. skóre: 12 bodov     │    │
│  │                                                       │    │
│  │ Status: ✓ Nakonfigurovaný                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Level 3: [Prázdne]                         [Pridať]  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Modal: Pridať/Upraviť test

```
┌──────────────────────────────────────────────────────────────┐
│  Pridať test k VK                                       [X]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Level testu: *                                               │
│  ┌──────────────────────────────────────────┐                │
│  │ Level 1 - Odborný test               [v] │                │
│  └──────────────────────────────────────────┘                │
│                                                               │
│  Vyber test: *                                                │
│  ┌──────────────────────────────────────────┐                │
│  │ [Vyhľadať test...]                   [v] │                │
│  └──────────────────────────────────────────┘                │
│                                                               │
│  ┌─ PODĽA VYBRANÉHO TESTU ────────────────────────────┐      │
│  │ Typ testu: ODBORNY                                 │      │
│  │ Celkový počet otázok v teste: 50                   │      │
│  │ Schválený: Áno                                     │      │
│  └────────────────────────────────────────────────────┘      │
│                                                               │
│  ┌─ NASTAVENIA TESTOVANIA ────────────────────────────┐      │
│  │                                                     │      │
│  │ Počet otázok pre tento VK: *                        │      │
│  │ [20________________]  (min: 10, max: 50)            │      │
│  │                                                     │      │
│  │ Trvanie testu (minúty): *                           │      │
│  │ [20________________]  (min: 5, max: 60)             │      │
│  │                                                     │      │
│  │ Body za každú správnu odpoveď: *                    │      │
│  │ ( • ) 1 bod   ( ) 0.5 bodu                          │      │
│  │                                                     │      │
│  │ Minimálne skóre na úspešné dokončenie: *            │      │
│  │ [12________________] bodov                          │      │
│  │                                                     │      │
│  │ ℹ️ Max. bodov: 20 (20 otázok × 1 bod)               │      │
│  │                                                     │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                               │
│  ┌─ VÝBER OTÁZOK ──────────────────────────────────────┐      │
│  │                                                     │      │
│  │ Spôsob výberu otázok:                               │      │
│  │ ( • ) Náhodný výber                                 │      │
│  │ ( ) Manuálny výber (vybrať konkrétne otázky)        │      │
│  │ ( ) Sekvenčný (prvých N otázok)                     │      │
│  │                                                     │      │
│  └─────────────────────────────────────────────────────┘      │
│                                                               │
│                                   [Zrušiť]  [Uložiť test]     │
└──────────────────────────────────────────────────────────────┘
```

---

## Komponenty

### 1. VK Header Card

Zobrazuje:
- Identifikátor VK
- Druh VK
- Pozícia
- Status VK

`data-testid="vk-header"`

### 2. Test Assignment Card

Pre každý level zobrazuje:
- Level + typ testu
- Názov vybraného testu
- Počet otázok / Trvanie
- Bodovanie / Min. skóre
- Status (nakonfigurovaný / prázdny)

Tlačidlá:
- "Upraviť" - otvorí modal s možnosťou zmeny nastavení
- "Odstrániť" - odstráni test z VK (s potvrdením)

`data-testid="test-assignment-card-{level}"`

### 3. Add Test Button

Primary button na pridanie nového testu.

`data-testid="add-test-button"`

### 4. Add/Edit Test Modal

**Polia:**

**Level testu:** (required)
- Dropdown: Level 1-6
- Automaticky filtruje už použité levely
- `data-testid="level-select"`

**Vyber test:** (required)
- React-select s vyhľadávaním
- Filtruje len schválené testy
- Zobrazuje: názov + typ testu
- `data-testid="test-select"`

**Počet otázok:** (required)
- Number input
- Min/Max podľa typu testu (viď zadanie strana 5)
- Validácia: nesmie presiahnuť počet otázok v teste
- `data-testid="question-count-input"`

**Trvanie:** (required)
- Number input (minúty)
- Min/Max podľa typu testu
- `data-testid="duration-input"`

**Bodovanie:** (required)
- Radio buttons: 1 bod / 0.5 bodu
- Podľa typu testu (viď zadanie)
- `data-testid="score-per-question-radio"`

**Min. skóre:** (required)
- Number input
- Validácia: nesmie presiahnuť max. bodov (počet otázok × body/otázku)
- `data-testid="min-score-input"`

**Výber otázok:** (optional)
- Radio buttons: Náhodný / Manuálny / Sekvenčný
- Default: Náhodný
- `data-testid="question-selection-mode"`

---

## Funkcionalita

### Načítanie dát

Pri načítaní stránky:
1. GET `/api/admin/vk/[id]` - info o VK
2. GET `/api/admin/vk/[id]/tests` - zoznam pridelených testov

Response:
```json
{
  "vk": {
    "id": "clxy...",
    "identifier": "VK/2025/1234",
    "status": "PRIPRAVA",
    "position": "hlavný štátny radca"
  },
  "assignedTests": [
    {
      "id": "vktest1",
      "level": 1,
      "test": {
        "id": "test123",
        "name": "Odborný test - Medzinárodná spolupráca",
        "type": "ODBORNY",
        "totalQuestions": 50
      },
      "questionCount": 20,
      "durationMinutes": 20,
      "scorePerQuestion": 1,
      "minScore": 12,
      "questionSelectionMode": "RANDOM"
    }
  ]
}
```

### Pridanie testu

1. Klik na "+ Pridať test"
2. Modal sa otvorí
3. Admin vyplní:
   - Level
   - Test (z dropdownu schválených testov)
   - Počet otázok, trvanie, bodovanie, min. skóre
4. Klik "Uložiť test"
5. POST `/api/admin/vk/[id]/tests`
6. Validácia:
   - Level ešte nie je použitý
   - Test je schválený
   - Počet otázok nepresahuje počet otázok v teste
   - Min. skóre nepresahuje max. bodov
7. Toast: "Test bol úspešne pridaný k VK"

### Úprava testu

1. Klik "Upraviť" na test card
2. Modal s predvyplnenými hodnotami
3. Admin zmení hodnoty
4. PATCH `/api/admin/vk/[id]/tests/[vkTestId]`
5. Toast: "Test bol úspešne upravený"

### Odstránenie testu

1. Klik "Odstrániť"
2. ConfirmModal: "Naozaj chcete odstrániť tento test z VK?"
3. DELETE `/api/admin/vk/[id]/tests/[vkTestId]`
4. Toast: "Test bol odstránený"

### Validačné pravidlá (podľa zadania strana 5)

**Odborný test:**
- Zamestnanec: 10-20 otázok / 20 min / 1 bod/otázku / min 12 bodov
- Vedúci: 15-30 otázok / 30 min / 1 bod/otázku / min 18 bodov

**Všeobecný test:**
- Zamestnanec: 20 otázok / 20 min / 0.5 bod/otázku / min 6 bodov
- Vedúci: 30 otázok / 30 min / 0.5 bod/otázku / min 9 bodov

**Test štátneho jazyka:**
- 5 otázok / 5 min / 1 bod/otázku / min 3 body

**Test cudzieho jazyka:**
- A1/A2: 30 otázok / 30 min / 0.5 bod/otázku / min 9 bodov
- B1: 40 otázok / 40 min / 0.5 bod/otázku / min 12 bodov
- B2/C1/C2: 40 otázok / 40 min / 0.5 bod/otázku / min 14 bodov

**Test IT:**
- 5-10 otázok / variabilný čas / variabilné body / min 6 bodov

---

## API Endpoints

### GET /api/admin/vk/[id]/tests

Vráti zoznam pridelených testov k VK.

### POST /api/admin/vk/[id]/tests

Request:
```json
{
  "testId": "test123",
  "level": 1,
  "questionCount": 20,
  "durationMinutes": 20,
  "scorePerQuestion": 1,
  "minScore": 12,
  "questionSelectionMode": "RANDOM"
}
```

Vytvorí VKTest záznam.

### PATCH /api/admin/vk/[id]/tests/[vkTestId]

Request:
```json
{
  "questionCount": 25,
  "durationMinutes": 25,
  "minScore": 15
}
```

Upraví VKTest záznam.

### DELETE /api/admin/vk/[id]/tests/[vkTestId]

Odstráni VKTest záznam.

---

## Data-testid attributes

- `vk-header` - VK header card
- `add-test-button` - Tlačidlo pridať test
- `test-assignment-card-{level}` - Card pre každý level
- `edit-test-button-{level}` - Tlačidlo upraviť
- `delete-test-button-{level}` - Tlačidlo odstrániť
- `level-select` - Select pre level
- `test-select` - Select pre test
- `question-count-input` - Input počet otázok
- `duration-input` - Input trvanie
- `score-per-question-radio` - Radio buttons bodovanie
- `min-score-input` - Input min. skóre
- `question-selection-mode` - Radio buttons výber otázok
- `save-test-button` - Tlačidlo uložiť
- `cancel-button` - Tlačidlo zrušiť

---

## Notes

- **Level system:** Levely musia ísť po sebe (1, 2, 3...), nemôžu byť medzery
- **Test approval:** Len schválené testy môžu byť priradené k VK
- **VK status:** Testy možno pridávať/upravovať len ak VK je v stave PRIPRAVA
- **Validácia:** Frontend aj backend validuje min/max hodnoty podľa typu testu
- **Question selection:** Pri náhodnom výbere sa otázky vyberú až pri spustení testu uchádzačom
- **Auto-calculation:** Max. bodov = questionCount × scorePerQuestion (automaticky vypočítané)
- **Slovak declension:** "1 otázka", "2-4 otázky", "5+ otázok"
- **Heroicons:** DocumentTextIcon, PencilIcon, TrashIcon, PlusIcon, CheckCircleIcon
- **Toast notifications:** react-hot-toast
- **ConfirmModal:** Pre odstránenie testu
- **Inline validation:** Červený border + error message pod inputom

---

## Integrácia s existujúcim VK flow

Táto obrazovka je súčasťou **VK detail** stránky ako **nový tab**:

```
/vk/[id] tabs:
- Prehľad
- Kandidáti
- Komisia
- Testy ← NOVÝ TAB
- Dokumenty
```

Admin musí najprv:
1. Vytvoriť VK (hlavička)
2. **Prideliť testy** (táto obrazovka)
3. Pridať kandidátov
4. Zmeniť status na TESTOVANIE
5. Kandidáti môžu začať testovanie
