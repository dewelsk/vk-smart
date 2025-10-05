# Správa používateľov (Superadmin, Admin, Gestor, Komisia)

## Popis
Obrazovka pre vytvorenie nového používateľa s rolou **SUPERADMIN**, **ADMIN**, **GESTOR** alebo **KOMISIA**. Tieto role reprezentujú **trvalé účty**, ktoré nie sú naviazané na konkrétne VK pri vytváraní.

**Prístup:**
- **Superadmin**: Môže vytvoriť ľubovoľnú rolu (vrátane Superadmin), vidí všetky rezorty
- **Admin**: Môže vytvoriť len Gestor/Komisia, vidí len svoje rezorty, nemôže vytvoriť Superadmin ani Admin

**POZNÁMKA:** Uchádzači sa nevytvárajú cez túto obrazovku! Majú samostatnú obrazovku v kontexte konkrétneho VK.

---

## ASCII Wireframe

```
+----------------------------------------------------------+
|  [VK Smart Logo]      Superadmin/Admin | User | Logout  |
+----------------------------------------------------------+
|                                                          |
|  Správa používateľov > Nový používateľ                   |
|  ================================================         |
|                                                          |
|  +----------------------------------------------------+  |
|  | FORMULÁR - Nový používateľ                         |  |
|  |                                                    |  |
|  | Rola *                                             |  |
|  | [v] Gestor                                         |  |
|  |     ○ Superadmin  (len ak prihlásený Superadmin)  |  |
|  |     ○ Admin       (len ak prihlásený Superadmin)  |  |
|  |     ○ Gestor                                       |  |
|  |     ○ Komisia                                      |  |
|  |                                                    |  |
|  | Osobné údaje                                       |  |
|  | -------------------------------------------------  |  |
|  |                                                    |  |
|  | Meno *                                             |  |
|  | [................................]                 |  |
|  |                                                    |  |
|  | Priezvisko *                                       |  |
|  | [................................]                 |  |
|  |                                                    |  |
|  | Prihlasovacie meno *                               |  |
|  | [................................]                 |  |
|  | (unikátne meno pre prihlásenie do systému)         |  |
|  |                                                    |  |
|  | Email *                                            |  |
|  | [................................]                 |  |
|  |                                                    |  |
|  | Poznámka                                           |  |
|  | [................................]                 |  |
|  | (napr. špecializácia, odbor, atď.)                 |  |
|  |                                                    |  |
|  | Priradenie k rezortu (len Admin/Gestor/Komisia)   |  |
|  | -------------------------------------------------  |  |
|  |                                                    |  |
|  | Rezorty *                                          |  |
|  | ☑ Ministerstvo zahraničných vecí (MZVaEZ)         |  |
|  | ☐ Ministerstvo vnútra (MV)                         |  |
|  | ☐ Ministerstvo zdravotníctva (MZ)                  |  |
|  |                                                    |  |
|  | (i) Superadmin vidí všetky rezorty                 |  |
|  | (i) Admin vidí len svoje rezorty                   |  |
|  | (i) Superadmin NEMÁ rezorty (nepriradený)          |  |
|  |                                                    |  |
|  | Priradenie k VK (voliteľné)                        |  |
|  | -------------------------------------------------  |  |
|  |                                                    |  |
|  | Výberové konanie                                   |  |
|  | [v] Vybrať VK...                                   |  |
|  |                                                    |  |
|  | (i) Platí len pre Gestor/Komisiu                   |  |
|  | (i) Používateľa môžete priradiť k VK aj neskôr     |  |
|  |                                                    |  |
|  | Bezpečnosť a notifikácie                           |  |
|  | -------------------------------------------------  |  |
|  |                                                    |  |
|  | ☑ Povoliť 2FA (povinné pre Admin)                 |  |
|  |                                                    |  |
|  | ☑ Odoslať inštruktáž na prihlásenie emailom        |  |
|  |                                                    |  |
|  | (i) Pre Gestora a Komisiu je 2FA voliteľné        |  |
|  |     Pre Admina je 2FA povinné                     |  |
|  |                                                    |  |
|  |                                                    |  |
|  | [Zrušiť]                        [Vytvoriť účet]    |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
|  (i) Po vytvorení účtu bude odoslaný email s linkou      |
|      na nastavenie hesla. Používateľ sa nebude môcť      |
|      prihlásiť bez nastavenia hesla.                     |
|                                                          |
+----------------------------------------------------------+
```

---

## Elementy

### 1. Header
- Logo "VK Smart"
- Breadcrumb: "Správa používateľov > Nový používateľ"
- User menu: Aktuálne prihlásený používateľ (Superadmin alebo Admin)

### 2. Formulár - Výber role
- **Radio button group** - Rola (povinné)
  - **Superadmin** (zobrazí sa LEN ak je prihlásený Superadmin)
  - **Admin** (zobrazí sa LEN ak je prihlásený Superadmin)
  - **Gestor** (vždy)
  - **Komisia** (vždy)
- Defaultne nie je nič vybrané
- **Dynamické zobrazenie podľa prihláseného používateľa:**
  - Superadmin vidí: Superadmin, Admin, Gestor, Komisia
  - Admin vidí: Gestor, Komisia

### 3. Formulár - Osobné údaje
- **Input text** - Meno (povinné, max 50 znakov)
- **Input text** - Priezvisko (povinné, max 50 znakov)
- **Input text** - Prihlasovacie meno (povinné, max 30 znakov, unique, len a-z, 0-9, bodka, podčiarkovník)
  - Používa sa na prihlásenie do systému
  - Musí byť unikátne v celej databáze
  - Návrh: automaticky generovať z mena/priezviska (napr. "novak.jozef"), admin môže upraviť
- **Input email** - Email (povinné, validácia email formátu, unique)
- **Input text** - Poznámka (voliteľné, max 255 znakov)

### 4. Formulár - Priradenie k rezortu
- **Checkbox group** - Rezorty (povinné pre Admin/Gestor/Komisia, skryté pre Superadmin)
  - Zobrazí sa LEN ak je vybraná rola Admin, Gestor alebo Komisia
  - Ak je vybraný Superadmin → sekcia sa skryje (Superadmin nemá rezorty)
- **Dynamické zobrazenie podľa prihláseného používateľa:**
  - **Superadmin** vidí všetky rezorty (z databázy)
  - **Admin** vidí len svoje rezorty (tie, kde je priradený)
- Minimálne 1 rezort musí byť vybraný (ak sa sekcia zobrazuje)
- **Info box**:
  - "Superadmin vidí všetky rezorty"
  - "Admin vidí len svoje rezorty"
  - "Superadmin NEMÁ priradené rezorty"

### 5. Formulár - Priradenie k VK
- **Dropdown/Select** - Výberové konanie (voliteľné)
  - Načíta sa zoznam aktívnych VK zo servera
  - Možnosť nevybrať nič (používateľa možno priradiť neskôr)
- **Info box**: Vysvetlenie, že priradenie je voliteľné

### 6. Formulár - Bezpečnosť a notifikácie
- **Checkbox** - Povoliť 2FA
  - Pre **Superadmin** a **Admin**: automaticky checked, disabled (povinné)
  - Pre **Gestor** a **Komisia**: voliteľné, defaultne unchecked
- **Checkbox** - Odoslať inštruktáž na prihlásenie emailom
  - Defaultne: checked
  - Ak checked: používateľovi príde email s linkou na nastavenie hesla
  - Ak unchecked: admin musí manuálne poslať prihlasovacie údaje
- **Info box**: "2FA je povinné pre Superadmin a Admin. Pre Gestor a Komisiu je voliteľné."

### 7. Akcie
- **Button** - "Zrušiť" (secondary) - návrat na zoznam používateľov
- **Button** - "Vytvoriť účet" (primary) - submit formulára

### 8. Info box (dole)
- Informácia o procese nastavenia hesla cez email link

---

## Validácie

### Client-side
1. **Rola**: povinné (aspoň jedna vybraná)
2. **Meno**: povinné, max 50 znakov, len písmená a medzery
3. **Priezvisko**: povinné, max 50 znakov, len písmená a medzery
4. **Prihlasovacie meno**: povinné, max 30 znakov, len a-z, 0-9, bodka (.), podčiarkovník (_)
5. **Email**: povinné, validný email formát
6. **Poznámka**: voliteľné, max 255 znakov
7. **Rezorty**:
   - Povinné ak je vybraná rola Admin/Gestor/Komisia
   - Skryté ak je vybraná rola Superadmin
   - Minimálne 1 rezort musí byť vybraný
8. **VK**: voliteľné (len pre Gestor/Komisia)
9. **2FA**: Ak je vybraná rola "Superadmin" alebo "Admin" → automaticky checked a disabled

### Server-side
1. Kontrola duplicity username (unique constraint)
2. Kontrola duplicity emailu (unique constraint)
3. Overenie platnosti role:
   - SUPERADMIN, ADMIN, GESTOR, KOMISIA - NIE UCHADZAC
   - Ak sa pokúša vytvoriť SUPERADMIN/ADMIN → musí byť prihlásený Superadmin
4. Overenie 2FA: ak rola === SUPERADMIN alebo ADMIN → otpEnabled musí byť true
5. Overenie rezortov:
   - Ak rola === ADMIN/GESTOR/KOMISIA → musí mať aspoň 1 rezort
   - Ak rola === SUPERADMIN → rezorty musia byť prázdne
   - Superadmin môže priradiť k ľubovoľným rezortom
   - Admin môže priradiť len k svojim rezortom
6. Overenie existencie VK (ak je vybrané)

---

## Funkcia po odoslaní

### 1. Vytvorenie User záznamu
```typescript
{
  username: "novak.jozef", // prihlasovacie meno (unique!)
  email: "user@mirri.gov.sk",
  password: null, // Heslo ešte nie je nastavené!
  name: "Jozef",
  surname: "Novák",
  role: "GESTOR", // alebo ADMIN, KOMISIA
  note: "Špecializácia na medzinárodné právo",
  otpEnabled: false, // alebo true pre Admin
  temporaryAccount: false, // trvalý účet
  active: false, // neaktívny, kým nenastaví heslo!
  passwordSetToken: "crypto.randomBytes(32).toString('hex')", // token na nastavenie hesla
  passwordSetTokenExpiry: "now() + 24 hours",
  deleted: false, // soft delete flag
  deletedEmail: null // pôvodný email (len pri soft delete)
}
```

### 2. Priradenie k VK (ak bolo vybrané)
- Ak bola vybraná rola **GESTOR** a **VK**:
  - Aktualizuje sa `VyberoveKonanie.gestorId = user.id`
- Ak bola vybraná rola **KOMISIA** a **VK**:
  - Vytvorí sa záznam `CommissionMember` (ak komisia pre VK existuje)
  - Ak komisia ešte neexistuje, musí sa vytvoriť najprv v detaile VK

### 3. Email notifikácia (ak je checked "Odoslať inštruktáž")
- Príjemca: vytvorený používateľ
- Template: **Email pri vytvorení účtu** (viď `docs/14-emailove-notifikacie.md`)
- Obsah:
  - Privítanie
  - Informácia o vytvorení účtu
  - **Link na nastavenie hesla**: `https://app.url/set-password?token={passwordSetToken}`
  - Platnosť linky: 24 hodín
  - Upozornenie: Používateľ sa nebude môcť prihlásiť bez nastavenia hesla

### 4. Success obrazovka
```
+----------------------------------------------------------+
|  ✓ Účet bol úspešne vytvorený!                           |
|                                                          |
|  Email: user@mirri.gov.sk                                |
|  Rola: Gestor                                            |
|  VK: VK/2025/0001 (ak bolo vybrané)                      |
|                                                          |
|  ✉ Email s inštruktážou na nastavenie hesla bol          |
|     odoslaný na adresu user@mirri.gov.sk                 |
|                                                          |
|  (i) Používateľ sa nebude môcť prihlásiť, kým            |
|      nenastaví heslo cez link v emaili (platnosť 24h)    |
|                                                          |
|  [Zavrieť] [Vytvoriť ďalšieho používateľa]               |
+----------------------------------------------------------+
```

---

## Navigácia

### Príchod na obrazovku
- Z hlavného menu: "Používatelia" → "Nový používateľ"
- Z obrazovky "Zoznam používateľov" → tlačidlo "Pridať používateľa"

### Odchod z obrazovky
- **Zrušiť** → návrat na "Zoznam používateľov" (bez uloženia)
- **Vytvoriť účet** → success modal → "Zavrieť" → návrat na "Zoznam používateľov"
- **Vytvoriť účet** → success modal → "Vytvoriť ďalšieho" → reload formulára (prázdny)

---

## API Endpoints

### POST `/api/admin/users`

**POZNÁMKA:** Endpoint je rovnaký pre Superadmin aj Admin. Backend rozhodne podľa prihláseného používateľa.

**Request:**
```json
{
  "role": "GESTOR",
  "username": "novak.jozef",
  "name": "Jozef",
  "surname": "Novák",
  "email": "user@mirri.gov.sk",
  "note": "Špecializácia na medzinárodné právo",
  "institutionIds": ["inst_123", "inst_456"],
  "vkId": "vk_123",
  "otpEnabled": false,
  "sendWelcomeEmail": true
}
```

**Polia:**
- `role`: SUPERADMIN | ADMIN | GESTOR | KOMISIA
- `institutionIds`: pole ID rezortov (povinné pre Admin/Gestor/Komisia, prázdne pre Superadmin)
- `vkId`: voliteľné (len pre Gestor/Komisia)

**Response (201 Created):**
```json
{
  "user": {
    "id": "user_123",
    "username": "novak.jozef",
    "email": "user@mirri.gov.sk",
    "name": "Jozef",
    "surname": "Novák",
    "role": "GESTOR",
    "note": "Špecializácia na medzinárodné právo",
    "otpEnabled": false,
    "active": false,
    "temporaryAccount": false,
    "createdAt": "2025-10-04T10:30:00Z",
    "passwordSetToken": "abc123...",
    "passwordSetTokenExpiry": "2025-10-05T10:30:00Z",
    "institutions": [
      {
        "id": "inst_123",
        "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
        "code": "MZVaEZ"
      }
    ]
  },
  "emailSent": true,
  "vkAssigned": "VK/2025/0001"
}
```

**Response (400 Bad Request - duplicitný email):**
```json
{
  "error": "EMAIL_EXISTS",
  "message": "Používateľ s týmto emailom už existuje"
}
```

**Response (400 Bad Request - duplicitné username):**
```json
{
  "error": "USERNAME_EXISTS",
  "message": "Prihlasovacie meno už je obsadené. Zvoľte iné."
}
```

**Response (400 Bad Request - neplatná rola):**
```json
{
  "error": "INVALID_ROLE",
  "message": "Neplatná rola. Uchádzači sa vytvárajú cez samostatnú obrazovku."
}
```

**Response (403 Forbidden - nepovolená rola):**
```json
{
  "error": "FORBIDDEN_ROLE",
  "message": "Nemáte oprávnenie vytvoriť používateľa s rolou SUPERADMIN/ADMIN. Len Superadmin môže vytvárať adminov."
}
```

**Response (400 Bad Request - chýbajúce rezorty):**
```json
{
  "error": "INSTITUTIONS_REQUIRED",
  "message": "Používateľ s rolou GESTOR musí byť priradený k aspoň jednému rezortu."
}
```

**Response (403 Forbidden - nepovolený rezort):**
```json
{
  "error": "FORBIDDEN_INSTITUTION",
  "message": "Nemáte oprávnenie priradiť používateľa k rezortu MV. Môžete priradiť len k svojim rezortom."
}
```

---

## Error states

1. **Username už existuje**: "Prihlasovacie meno 'novak.jozef' už je obsadené. Zvoľte iné."
2. **Email už existuje**: "Používateľ s emailom user@mirri.gov.sk už existuje"
3. **Neplatný username formát**: "Prihlasovacie meno môže obsahovať len malé písmená, číslice, bodku a podčiarkovník"
4. **Neplatný email formát**: "Zadajte platný email"
5. **Nevyplnené povinné polia**: "Všetky polia označené * sú povinné"
6. **Server error**: "Nepodarilo sa vytvoriť účet. Skúste to znova."
7. **Email sa nepodarilo odoslať**: Warning: "Účet bol vytvorený, ale email sa nepodarilo odoslať. Link na nastavenie hesla: ..."
8. **Neplatné VK**: "Vybrané výberové konanie neexistuje"

---

## Poznámky

- **DÔLEŽITÉ**: Táto obrazovka NESMIE umožniť vytvorenie používateľa s rolou UCHADZAC
- Uchádzači majú samostatnú obrazovku (v kontexte VK)
- Gestor a Komisia sa môžu priradiť k VK aj pri vytváraní účtu, ale je to voliteľné
## Poznámky

- **SPOLOČNÁ obrazovka** pre Superadmin aj Admin (rozdiel len v dátach a oprávneniach)
- **Superadmin** môže:
  - Vytvoriť Superadmin, Admin, Gestor, Komisia
  - Vidieť všetky rezorty
  - Priradiť k ľubovoľným rezortom
- **Admin** môže:
  - Vytvoriť len Gestor, Komisia
  - Vidieť len svoje rezorty
  - Priradiť len k svojim rezortom
- **Superadmin NEMÁ rezorty** (pole `institutions` je prázdne)
- **Admin/Gestor/Komisia MUSIA mať** aspoň 1 rezort
- Priradenie k VK možno urobiť aj neskôr v detaile VK
- **Heslo NIE JE generované** - používateľ si ho nastaví sám cez email link
- Používateľ je **neaktívny** (`active: false`) kým nenastaví heslo
- Link na nastavenie hesla je platný **24 hodín**
- 2FA je **povinné** pre Superadmin a Admin, voliteľné pre Gestor a Komisiu
