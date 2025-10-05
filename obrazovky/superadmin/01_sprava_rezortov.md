# Superadmin - Správa rezortov

## Popis
Obrazovka pre správu rezortov (organizačných jednotiek). Superadmin môže vytvárať, upravovať, aktivovať/deaktivovať rezorty.

**Rezort (Institution)** = Ministerstvo, úrad alebo iná organizačná jednotka, ktorá organizuje výberové konania.

---

## ASCII Wireframe - Zoznam rezortov

```
+------------------------------------------------------------------------------+
|  [VK Smart Logo]                 Superadmin | Super User | Logout            |
+------------------------------------------------------------------------------+
|                                                                              |
|  Správa rezortov                                                             |
|  ======================================================================      |
|                                                                              |
|  [+ Pridať rezort]                                            [🔍 Hľadať...] |
|                                                                              |
|  Filtre: [v] Aktívne  [ ] Neaktívne                                          |
|                                                                              |
|  --------------------------------------------------------------------------  |
|  | Názov rezortu                            | Kód    | VK | Admini | Stav  |
|  | Vytvorený                                | Akcie                        |
|  --------------------------------------------------------------------------  |
|  | Ministerstvo zahraničných vecí           | MZVaEZ | 15 | 3      | ✓     |
|  | 2025-01-15                                | [Detail] [Upraviť] [🗑]      |
|  --------------------------------------------------------------------------  |
|  | Ministerstvo vnútra SR                   | MV     | 42 | 7      | ✓     |
|  | 2025-01-15                                | [Detail] [Upraviť] [🗑]      |
|  --------------------------------------------------------------------------  |
|  | Ministerstvo zdravotníctva               | MZ     | 28 | 5      | ❌    |
|  | 2025-02-10                                | [Detail] [Upraviť] [✓]      |
|  --------------------------------------------------------------------------  |
|  | Úrad vlády SR                            | UV     | 8  | 2      | ✓     |
|  | 2025-03-01                                | [Detail] [Upraviť] [🗑]      |
|  --------------------------------------------------------------------------  |
|                                                                              |
|  Celkom: 12 rezortov | Strana 1 z 1                                          |
|                                                                              |
+------------------------------------------------------------------------------+
```

---

## ASCII Wireframe - Nový rezort

```
+----------------------------------------------------------+
|  [VK Smart Logo]       Superadmin | Super User | Logout  |
+----------------------------------------------------------+
|                                                          |
|  Správa rezortov > Nový rezort                           |
|  ================================================         |
|                                                          |
|  +----------------------------------------------------+  |
|  | FORMULÁR - Nový rezort                             |  |
|  |                                                    |  |
|  | Názov *                                            |  |
|  | [................................................] |  |
|  | (napr. "Ministerstvo zahraničných vecí a          |  |
|  |  európskych záležitostí")                         |  |
|  |                                                    |  |
|  | Kód *                                              |  |
|  | [............]                                     |  |
|  | (napr. "MZVaEZ" - krátka skratka, max 10 znakov)  |  |
|  |                                                    |  |
|  | Popis                                              |  |
|  | [................................................] |  |
|  | [................................................] |  |
|  | (voliteľné, napr. oblasť pôsobnosti)              |  |
|  |                                                    |  |
|  | Status                                             |  |
|  | ☑ Aktívny rezort                                  |  |
|  |                                                    |  |
|  | (i) Neaktívny rezort nemôže vytvárať nové VK      |  |
|  |                                                    |  |
|  | [Zrušiť]                        [Vytvoriť rezort]  |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

---

## Elementy - Zoznam rezortov

### 1. Header
- Logo "VK Smart"
- Breadcrumb: "Správa rezortov"
- User menu: Aktuálne prihlásený superadmin

### 2. Akcie (top)
- **Button** - "+ Pridať rezort" (primary)
  - Modal alebo redirect na formulár vytvorenia rezortu
- **Input search** - Vyhľadávanie (pravý horný roh)
  - Placeholder: "🔍 Hľadať..."
  - Fulltextové vyhľadávanie v: názov, kód, popis

### 3. Filtre
- **Checkbox group** - Stav rezortu
  - ☑ Aktívne (default checked)
  - ☐ Neaktívne
  - Real-time filtrovanie (bez reload)

### 4. Tabuľka - Zoznam rezortov

#### Stľpce:
1. **Názov rezortu**
   - Plný názov rezortu (napr. "Ministerstvo zahraničných vecí a európskych záležitostí")
   - Sortovateľné (A-Z, Z-A)
   - Kliknuteľné → detail rezortu

2. **Kód**
   - Krátka skratka (napr. "MZVaEZ")
   - Max 10 znakov
   - Sortovateľné

3. **VK**
   - Počet výberových konaní patriacich k rezortu
   - Kliknuteľné → zoznam VK rezortu
   - Sortovateľné

4. **Admini**
   - Počet adminov priradených k rezortu
   - Kliknuteľné → zoznam adminov rezortu
   - Sortovateľné

5. **Stav**
   - Badge:
     - ✓ Aktívny (zelený)
     - ❌ Neaktívny (červený)
   - Filtrovateľné

6. **Vytvorený**
   - Dátum vytvorenia rezortu
   - Format: "YYYY-MM-DD"
   - Sortovateľné

7. **Akcie**
   - **Button** - "Detail" → detail rezortu (štatistiky, zoznam adminov, VK)
   - **Button** - "Upraviť" → úprava názvu, kódu, popisu
   - **Button** - "🗑 Deaktivovať" / "✓ Aktivovať"
     - Confirmation modal: "Naozaj chcete deaktivovať rezort XY? Admini tohto rezortu sa nebudú môcť prihlásiť."

### 5. Pagination
- Stránkovanie: 20 rezortov na stránku
- Info: "Celkom: X rezortov | Strana Y z Z"
- Controls: [<] [1] [2] [3] ... [>]

---

## Elementy - Nový rezort

### 1. Formulár

- **Input text** - Názov (povinné, max 100 znakov)
  - Plný názov rezortu
  - Príklad: "Ministerstvo zahraničných vecí a európskych záležitostí"

- **Input text** - Kód (povinné, max 10 znakov, unique, len A-Z, 0-9)
  - Krátka skratka
  - Príklad: "MZVaEZ"
  - Automaticky konvertovať na UPPERCASE

- **Textarea** - Popis (voliteľné, max 500 znakov)
  - Oblasť pôsobnosti, poznámka

- **Checkbox** - Aktívny rezort (default: checked)
  - Ak unchecked: rezort je neaktívny, admini sa nemôžu prihlásiť, nemôžu vytvárať VK

### 2. Akcie
- **Button** - "Zrušiť" (secondary) - návrat na zoznam rezortov
- **Button** - "Vytvoriť rezort" (primary) - submit formulára

---

## Validácie

### Client-side
1. **Názov**: povinné, max 100 znakov
2. **Kód**: povinné, max 10 znakov, len A-Z, 0-9, automaticky UPPERCASE
3. **Popis**: voliteľné, max 500 znakov

### Server-side
1. Kontrola duplicity kódu (unique constraint)
2. Overenie formátu kódu (len A-Z, 0-9)

---

## Funkcia po odoslaní

### 1. Vytvorenie Institution záznamu
```typescript
{
  name: "Ministerstvo zahraničných vecí a európskych záležitostí",
  code: "MZVAEZ",  // automaticky UPPERCASE
  description: "Rezort zahraničnej politiky a európskych záležitostí",
  active: true,
  createdAt: now(),
  updatedAt: now()
}
```

### 2. Success
```
+----------------------------------------------------------+
|  ✓ Rezort bol úspešne vytvorený!                         |
|                                                          |
|  Názov: Ministerstvo zahraničných vecí a európskych...   |
|  Kód: MZVaEZ                                             |
|                                                          |
|  Teraz môžete priradiť adminov k tomuto rezortu.         |
|                                                          |
|  [Zavrieť] [Priradiť adminov]                            |
+----------------------------------------------------------+
```

---

## API Endpoints

### GET `/api/superadmin/institutions`

**Request:**
```
GET /api/superadmin/institutions?page=1&limit=20&search=zdravo&active=true
```

**Query params:**
- `page` (number): číslo stránky (default: 1)
- `limit` (number): počet záznamov na stránku (default: 20)
- `search` (string): fulltextové vyhľadávanie
- `active` (string): "true" / "false" / "all"
- `sortBy` (string): name, code, createdAt, vkCount, adminCount
- `sortOrder` (string): asc / desc

**Response (200 OK):**
```json
{
  "institutions": [
    {
      "id": "inst_123",
      "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
      "code": "MZVaEZ",
      "description": "Rezort zahraničnej politiky...",
      "active": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "vkCount": 15,
      "adminCount": 3
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### POST `/api/superadmin/institutions`

**Request:**
```json
{
  "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
  "code": "MZVaEZ",
  "description": "Rezort zahraničnej politiky a európskych záležitostí",
  "active": true
}
```

**Response (201 Created):**
```json
{
  "institution": {
    "id": "inst_123",
    "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
    "code": "MZVaEZ",
    "description": "Rezort zahraničnej politiky a európskych záležitostí",
    "active": true,
    "createdAt": "2025-10-04T12:00:00Z",
    "updatedAt": "2025-10-04T12:00:00Z"
  }
}
```

**Response (400 Bad Request - duplicitný kód):**
```json
{
  "error": "CODE_EXISTS",
  "message": "Rezort s kódom 'MZVaEZ' už existuje"
}
```

---

### PATCH `/api/superadmin/institutions/:institutionId`

**Request:**
```json
{
  "name": "Ministerstvo zdravotníctva SR",
  "description": "Aktualizovaný popis..."
}
```

**Response (200 OK):**
```json
{
  "institution": {
    "id": "inst_123",
    "name": "Ministerstvo zdravotníctva SR",
    "code": "MZ",
    "description": "Aktualizovaný popis...",
    "active": true,
    "updatedAt": "2025-10-04T13:00:00Z"
  }
}
```

---

### PATCH `/api/superadmin/institutions/:institutionId/toggle-active`

**Request:**
```json
{
  "active": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "institution": {
    "id": "inst_123",
    "active": false
  }
}
```

**POZNÁMKA:** Ak sa deaktivuje rezort:
- Admini rezortu sa nemôžu prihlásiť
- Nemôžu vytvárať nové VK
- Existujúce VK zostávajú aktívne (ale nemôžu sa upravovať)

---

## Navigácia

### Príchod na obrazovku
- Z hlavného menu: "Rezorty" → "Zoznam rezortov"
- Z dashboardu: tlačidlo "Spravovať rezorty"

### Odchod z obrazovky
- **+ Pridať rezort** → formulár vytvorenia → success → návrat na zoznam
- **Detail** → detail rezortu (nová obrazovka)
- **Upraviť** → formulár úpravy → success → návrat na zoznam

---

## Error states

1. **Žiadne rezorty (prázdny zoznam)**:
```
+--------------------------------------------------------------+
|  Žiadne rezorty                                              |
|                                                              |
|  [+ Pridať prvý rezort]                                      |
+--------------------------------------------------------------+
```

2. **Žiadne výsledky vyhľadávania**:
```
+--------------------------------------------------------------+
|  Žiadne výsledky pre "xyz"                                   |
|                                                              |
|  Skúste:                                                     |
|  • Skontrolovať pravopis                                     |
|  • Použiť iné filtre                                         |
|  • Vymazať vyhľadávací dotaz                                 |
+--------------------------------------------------------------+
```

3. **Chyba pri načítaní (server error)**:
```
+--------------------------------------------------------------+
|  ⚠ Nepodarilo sa načítať zoznam rezortov                     |
|                                                              |
|  [Skúsiť znova]                                              |
+--------------------------------------------------------------+
```

---

## Confirmation modals

### 1. Deaktivácia rezortu
```
+----------------------------------------------------------+
|  Deaktivovať rezort?                                     |
|  ======================================================  |
|                                                          |
|  Naozaj chcete deaktivovať rezort                        |
|  "Ministerstvo zdravotníctva"?                           |
|                                                          |
|  ⚠ Dôsledky:                                             |
|  • 5 adminov tohto rezortu sa nebude môcť prihlásiť      |
|  • Rezort nebude môcť vytvárať nové VK                   |
|  • Existujúce VK zostanú aktívne (read-only)             |
|                                                          |
|  [Zrušiť]                          [Áno, deaktivovať]    |
+----------------------------------------------------------+
```

---

## Poznámky

- **DÔLEŽITÉ**: Len **Superadmin** má prístup k tejto obrazovke
- Admin **NEVIDÍ** túto obrazovku, nemôže vytvárať/upravovať rezorty
- Deaktivácia rezortu **NEZRUŠÍ** existujúce VK, len znemožní vytváranie nových
- Kód rezortu je **immutable** - po vytvorení sa nedá zmeniť (len cez databázu)
- Pri vytvorení rezortu **NEMÁ žiadnych adminov** - superadmin ich musí priradiť dodatočne
- Real-time vyhľadávanie: debounce 300ms
- Sortovanie defaultne: **Názov (A-Z)**
