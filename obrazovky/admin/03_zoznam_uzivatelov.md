# Zoznam používateľov (Superadmin, Admin, Gestor, Komisia)

## Popis
Obrazovka zobrazujúca zoznam používateľov s rolami **SUPERADMIN**, **ADMIN**, **GESTOR** a **KOMISIA**. Táto obrazovka slúži na správu trvalých účtov.

**Prístup:**
- **Superadmin**: Vidí všetkých používateľov zo všetkých rezortov
- **Admin**: Vidí len používateľov zo svojich rezortov

**POZNÁMKA:** Uchádzači sa v tomto zozname **NENACHÁDZAJÚ**! Majú samostatný zoznam (viď `05_uchadzaci_zoznam.md`).

---

## ASCII Wireframe

```
+------------------------------------------------------------------------------------+
|  [VK Smart Logo]              Superadmin/Admin | User | Logout                    |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  Správa používateľov                                                               |
|  ========================================================================          |
|                                                                                    |
|  [+ Pridať používateľa]                                         [🔍 Hľadať...]    |
|                                                                                    |
|  Filtre:                                                                           |
|  [ ] Superadmin  [ ] Admin  [ ] Gestor  [x] Komisia  | Stav: [v] Všetci          |
|  Rezort: [v] Všetky (len pre Superadmin)                                          |
|                                                                                    |
|  --------------------------------------------------------------------------------  |
|  | Meno a priezvisko | Email             | Rola    | Rezort     | VK | Poznámka |
|  | Pridaný           | Akcie                                                    |
|  --------------------------------------------------------------------------------  |
|  | Super User        | super@gov.sk      | Super   | -          | -  | -       |
|  | 2025-01-01        | [Detail] [Deaktivovať] [Reset hesla] [❌]                |
|  --------------------------------------------------------------------------------  |
|  | Jozef Novák       | jozef@mirri.gov.sk| Gestor  | MZVaEZ     | 3  | Medz... |
|  | 2025-09-15        | [Detail] [Deaktivovať] [Reset hesla] [❌]                |
|  --------------------------------------------------------------------------------  |
|  | Mária Kováčová    | maria@mirri.gov.sk| Komisia | 2 rezorty  | 5  | Práv... |
|  | 2025-09-20        | [Detail] [Deaktivovať] [Reset hesla] [❌]                |
|  --------------------------------------------------------------------------------  |
|  | Peter Admin       | admin@mirri.gov.sk| Admin   | MZ         | -  | -       |
|  | 2025-01-10        | [Detail] [Deaktivovať] [Reset hesla] [❌]                |
|  --------------------------------------------------------------------------------  |
|  | Jana Nová         | jana@mirri.gov.sk | Gestor  | MV         | 0  | IT      |
|  | 🕐 Čaká na heslo  | [Detail] [Poslať link znova] [❌]                        |
|  --------------------------------------------------------------------------------  |
|                                                                                    |
|  Celkom: 24 používateľov | Strana 1 z 3                [<] [1] [2] [3] [>]        |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

---

## Elementy

### 1. Header
- Logo "VK Smart"
- Breadcrumb: "Správa používateľov"
- User menu: Aktuálne prihlásený používateľ (Superadmin alebo Admin)

### 2. Akcie (top)
- **Button** - "+ Pridať používateľa" (primary)
  - Redirect na `02_sprava_uzivatelov.md`
- **Input search** - Vyhľadávanie (pravý horný roh)
  - Placeholder: "🔍 Hľadať..."
  - Fulltextové vyhľadávanie v: meno, priezvisko, email, poznámka

### 3. Filtre
- **Checkbox group** - Filtre podľa role
  - ☑ Superadmin (len ak je prihlásený Superadmin)
  - ☑ Admin
  - ☑ Gestor
  - ☑ Komisia
  - Defaultne: všetky checked
  - Real-time filtrovanie (bez reload)
- **Dropdown** - Rezort (len pre Superadmin)
  - Zobrazí sa LEN ak je prihlásený Superadmin
  - "Všetky rezorty" (default)
  - Zoznam všetkých rezortov
  - Filtrovanie používateľov podľa vybraného rezortu
- **Dropdown** - Stav používateľa
  - "Všetci" (default)
  - "Aktívni"
  - "Neaktívni"
  - "Čakajú na nastavenie hesla"

### 4. Tabuľka - Zoznam používateľov

#### Stľpce:
1. **Meno a priezvisko**
   - Format: "Meno Priezvisko"
   - Sortovateľné (A-Z, Z-A)
   - Kliknuteľné → detail používateľa

2. **Email**
   - Format: email adresa
   - Sortovateľné

3. **Rola**
   - Badge s farbou:
     - Superadmin: fialová
     - Admin: červená
     - Gestor: modrá
     - Komisia: zelená
   - Filtrovateľné (checkboxy)

4. **Rezort**
   - **Pre Superadmin**: "-" (nemá rezorty)
   - **Pre Admin/Gestor/Komisia**:
     - Ak má 1 rezort: zobrazí sa kód rezortu (napr. "MZVaEZ")
     - Ak má 2+ rezorty: zobrazí sa počet (napr. "2 rezorty")
     - Tooltip pri hover: zoznam všetkých rezortov
   - Kliknuteľné → detail používateľa (sekcia Rezorty)
   - Sortovateľné podľa počtu rezortov

5. **Počet VK**
   - Len pre Gestor a Komisia
   - Pre Admin: "-" (nepočíta sa)
   - Počíta sa:
     - **Gestor**: Počet VK kde je priradený ako gestor
     - **Komisia**: Počet VK kde je členom komisie
   - Kliknuteľné → zoznam VK daného používateľa
   - Sortovateľné

5. **Poznámka**
   - Prvých 20 znakov + "..." ak je dlhšia
   - Tooltip pri hover: celá poznámka
   - Sortovateľné

6. **Pridaný**
   - Dátum vytvorenia účtu
   - Format: "YYYY-MM-DD"
   - Sortovateľné (najnovší → najstarší, najstarší → najnovší)
   - Ak používateľ **čaká na nastavenie hesla**:
     - Zobrazí sa: "🕐 Čaká na heslo" (oranžový badge)
     - Tooltip: "Používateľ ešte nenastavil heslo. Link expiruje: YYYY-MM-DD HH:MM"

7. **Akcie**
   - **Button** - "Detail" → detail používateľa (samostatná obrazovka)
   - **Button** - "Deaktivovať" / "Aktivovať" (podľa stavu)
     - Confirmation modal: "Naozaj chcete deaktivovať účet XY?"
   - **Button** - "Reset hesla" / "Poslať link znova"
     - Ak používateľ **MÁ heslo**: "Reset hesla" → odošle email s reset linkom
     - Ak používateľ **NEMÁ heslo** (čaká na nastavenie): "Poslať link znova" → odošle nový passwordSetToken
   - **Button** - "❌ Vymazať"
     - Confirmation modal: "POZOR! Naozaj chcete natrvalo vymazať účet XY? Táto akcia je nevratná."
     - Validácia: Ak je používateľ priradený k aktívnym VK → warning: "Používateľ je priradený k X aktívnym VK. Odstráňte ho najprv z VK."

### 5. Pagination
- Stránkovanie: 20 používateľov na stránku
- Info: "Celkom: X používateľov | Strana Y z Z"
- Controls: [<] [1] [2] [3] ... [>]

---

## Validácie a pravidlá

### 1. Deaktivácia používateľa
- Deaktivovaný používateľ sa **NEMÔŽE** prihlásiť
- Ak je používateľ **gestor** aktívneho VK → warning: "Tento používateľ je gestorom X aktívnych VK. Naozaj ho chcete deaktivovať?"
- Ak je používateľ **člen komisie** aktívneho VK → warning: "Tento používateľ je členom komisie X aktívnych VK. Naozaj ho chcete deaktivovať?"

### 2. Vymazanie používateľa (SOFT DELETE)
- Vymazanie je **VŽDY POVOLENÉ**, ale zobrazí sa warning ak má aktívne/budúce VK
- Pri vymazaní: `email = NULL`, `deletedEmail = pôvodný email`, `deleted = true`, `deletedAt = now()`
- Ak má priradené **AKTÍVNE** alebo **BUDÚCE** VK → zobrazí sa **WARNING modal**:
  - "Pozor! Tento používateľ je priradený k nasledovným VK:"
  - Zoznam VK (identifikátor, pozícia, stav)
  - "Naozaj chcete pokračovať? Používateľ sa nebude môcť prihlásiť a bude odstránený zo zoznamov."
  - Možnosť: [Zrušiť] [Áno, vymazať]
- Ak má priradené **LEN ARCHIVOVANÉ** VK → vymazanie bez upozornenia
- Vymazaný používateľ sa **NEZOBRAZÍ** v zozname (soft delete)
- Vymazaný používateľ sa **ZOBRAZÍ** v ukončených VK (z histórie)

### 3. Reset hesla
- **Ak používateľ MÁ heslo**:
  - Vygeneruje sa `passwordResetToken` (1h platnosť)
  - Odošle sa email s linkom na `/reset-password?token={token}`
- **Ak používateľ NEMÁ heslo** (čaká na nastavenie):
  - Vygeneruje sa nový `passwordSetToken` (24h platnosť)
  - Odošle sa email s linkom na `/set-password?token={token}`
  - Starý token sa zneplatní

---

## Stavy používateľov

### 1. Aktívny (zelený badge)
- `active: true`
- `password !== null`
- Používateľ sa môže prihlásiť

### 2. Neaktívny (červený badge)
- `active: false`
- Používateľ sa **NEMÔŽE** prihlásiť
- Dôvod: admin ho deaktivoval

### 3. Čaká na nastavenie hesla (oranžový badge)
- `active: false`
- `password === null`
- `passwordSetToken !== null`
- Používateľ dostal email s linkom, ale ešte nenastavil heslo
- Ak token expiruje (>24h) → možnosť "Poslať link znova"

---

## API Endpoints

### GET `/api/admin/users`

**POZNÁMKA:** Endpoint je rovnaký pre Superadmin aj Admin. Backend filtruje podľa prihláseného používateľa.

**Request:**
```
GET /api/admin/users?page=1&limit=20&search=jozef&roles=GESTOR,KOMISIA&status=active&institutionId=inst_123
```

**Query params:**
- `page` (number): číslo stránky (default: 1)
- `limit` (number): počet záznamov na stránku (default: 20)
- `search` (string): fulltextové vyhľadávanie
- `roles` (string): filtre rolí (SUPERADMIN,ADMIN,GESTOR,KOMISIA)
- `institutionId` (string): filter podľa rezortu (len pre Superadmin)
- `status` (string): stav (all, active, inactive, pending_password)
- `sortBy` (string): pole na zoradenie (name, email, role, createdAt, vkCount, institutionCount)
- `sortOrder` (string): asc / desc

**Filtrovanie podľa prihláseného používateľa:**
- **Superadmin**: Vidí všetkých používateľov (môže filtrovať podľa `institutionId`)
- **Admin**: Vidí len používateľov zo svojich rezortov (automatické filtrovanie)

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "user_123",
      "name": "Jozef",
      "surname": "Novák",
      "email": "jozef@mirri.gov.sk",
      "role": "GESTOR",
      "note": "Medzinárodné právo",
      "active": true,
      "passwordSet": true,
      "createdAt": "2025-09-15T10:30:00Z",
      "vkCount": 3,
      "institutions": [
        {
          "id": "inst_123",
          "name": "Ministerstvo zahraničných vecí",
          "code": "MZVaEZ"
        }
      ],
      "institutionCount": 1,
      "passwordSetTokenExpiry": null
    },
    {
      "id": "user_456",
      "name": "Jana",
      "surname": "Nová",
      "email": "jana@mirri.gov.sk",
      "role": "GESTOR",
      "note": "IT špecializácia",
      "active": false,
      "passwordSet": false,
      "createdAt": "2025-10-01T14:00:00Z",
      "vkCount": 0,
      "passwordSetTokenExpiry": "2025-10-02T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### DELETE `/api/admin/users/:userId`

**POZNÁMKA:** Soft delete - používateľ sa neodstráni fyzicky z DB, len sa označí ako vymazaný.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Používateľ bol úspešne vymazaný (soft delete)",
  "deletedUser": {
    "id": "user_123",
    "username": "novak.jozef",
    "deletedEmail": "jozef@mirri.gov.sk",
    "deleted": true,
    "deletedAt": "2025-10-04T12:00:00Z"
  }
}
```

**POZNÁMKA:** Frontend musí pred volaním DELETE endpointu:
1. Zavolať `GET /api/admin/users/:userId/active-vk-assignments`
2. Ak má používateľ aktívne/budúce VK → zobraziť WARNING modal
3. Ak admin potvrdí → zavolať DELETE endpoint

---

### GET `/api/admin/users/:userId/active-vk-assignments`

**Popis:** Zistí všetky aktívne/budúce VK, kde je používateľ priradený (gestor alebo komisia).

**Response (200 OK):**
```json
{
  "hasActiveAssignments": true,
  "assignments": [
    {
      "vkId": "vk_123",
      "identifier": "VK/2025/0001",
      "position": "Vedúci oddelenia IT",
      "status": "TESTOVANIE",
      "role": "GESTOR"
    },
    {
      "vkId": "vk_456",
      "identifier": "VK/2025/0002",
      "position": "Analytik",
      "status": "PRIPRAVA",
      "role": "KOMISIA",
      "isChairman": true
    }
  ]
}
```

**Response (200 OK - žiadne aktívne priradenia):**
```json
{
  "hasActiveAssignments": false,
  "assignments": []
}
```

---

### PATCH `/api/admin/users/:userId/toggle-active`

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
  "user": {
    "id": "user_123",
    "active": false
  }
}
```

---

### POST `/api/admin/users/:userId/resend-password-link`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Link na nastavenie hesla bol odoslaný na email jana@mirri.gov.sk",
  "tokenExpiry": "2025-10-05T10:30:00Z"
}
```

---

### POST `/api/admin/users/:userId/reset-password`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Link na reset hesla bol odoslaný na email jozef@mirri.gov.sk"
}
```

---

## Navigácia

### Príchod na obrazovku
- Z hlavného menu: "Používatelia" → "Zoznam používateľov"
- Z dashboardu: tlačidlo "Spravovať používateľov"

### Odchod z obrazovky
- **+ Pridať používateľa** → `02_sprava_uzivatelov.md`
- **Detail** (riadok v tabuľke) → Detail používateľa (nová obrazovka - zatím nenavrhnutá)
- **Meno a priezvisko** (klik) → Detail používateľa
- **Počet VK** (klik) → Zoznam VK daného používateľa (filtered view)

---

## Error states

1. **Žiadni používatelia nenájdení (prázdny zoznam)**:
```
+--------------------------------------------------------------+
|  Žiadni používatelia nenájdení                               |
|                                                              |
|  [+ Pridať prvého používateľa]                               |
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
|  ⚠ Nepodarilo sa načítať zoznam používateľov                 |
|                                                              |
|  [Skúsiť znova]                                              |
+--------------------------------------------------------------+
```

---

## Confirmation modals

### 1. Deaktivácia používateľa
```
+----------------------------------------------------------+
|  Deaktivovať účet?                                       |
|  ======================================================  |
|                                                          |
|  Naozaj chcete deaktivovať účet Jozef Novák?             |
|                                                          |
|  Používateľ sa nebude môcť prihlásiť, kým účet           |
|  znova neaktivujete.                                     |
|                                                          |
|  ⚠ Tento používateľ je gestorom 3 aktívnych VK.          |
|                                                          |
|  [Zrušiť]                          [Áno, deaktivovať]    |
+----------------------------------------------------------+
```

### 2. Vymazanie používateľa
```
+----------------------------------------------------------+
|  Vymazať účet natrvalo?                                  |
|  ======================================================  |
|                                                          |
|  POZOR! Naozaj chcete natrvalo vymazať účet              |
|  Jozef Novák (jozef@mirri.gov.sk)?                       |
|                                                          |
|  Táto akcia je NEVRATNÁ!                                 |
|                                                          |
|  [Zrušiť]                          [Áno, vymazať]        |
+----------------------------------------------------------+
```

### 3. Reset hesla
```
+----------------------------------------------------------+
|  Odoslať link na reset hesla?                            |
|  ======================================================  |
|                                                          |
|  Link na reset hesla bude odoslaný na email              |
|  jozef@mirri.gov.sk                                      |
|                                                          |
|  Link bude platný 1 hodinu.                              |
|                                                          |
|  [Zrušiť]                          [Áno, odoslať]        |
+----------------------------------------------------------+
```

---

## Poznámky

- **SPOLOČNÁ obrazovka** pre Superadmin aj Admin (rozdiel len v dátach)
- **Superadmin** vidí:
  - Všetkých používateľov vrátane Superadmin a Admin
  - Filter podľa rezortov
  - Stĺpec "Rezort" (pre Superadmin je prázdny "-")
- **Admin** vidí:
  - Len používateľov zo svojich rezortov (Gestor, Komisia)
  - Nemá filter rezortov (už je filtrované)
  - Stĺpec "Rezort" (zobrazuje priradenie)
- **Zobrazenie rezortu v tabuľke:**
  - Superadmin: "-" (nemá rezorty)
  - 1 rezort: kód (napr. "MZVaEZ")
  - 2+ rezorty: počet (napr. "2 rezorty")
  - Tooltip: úplný zoznam rezortov
- Uchádzači (UCHADZAC) majú **samostatný zoznam** (viď `05_uchadzaci_zoznam.md`)
- Počet VK sa počíta dynamicky:
  - **Gestor**: `SELECT COUNT(*) FROM vyberove_konania WHERE gestorId = user.id AND status != 'ARCHIVED'`
  - **Komisia**: `SELECT COUNT(DISTINCT vkId) FROM commission_members WHERE userId = user.id AND vk.status != 'ARCHIVED'`
  - **Admin/Superadmin**: "-" (nepočíta sa)
- Soft delete: používateľ sa neobjaví v zozname, ale zostáva v DB (pre históriu VK)
- Ak používateľ čaká na nastavenie hesla >24h (token expired) → možnosť "Poslať link znova"
- Real-time vyhľadávanie: debounce 300ms
- Sortovanie defaultne: **Pridaný (najnovší → najstarší)**
