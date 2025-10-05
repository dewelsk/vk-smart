# Public - Nastavenie hesla

## Popis
Obrazovka pre nastavenie hesla po vytvorení účtu. Používateľ sa na túto obrazovku dostane kliknutím na link z emailu, ktorý dostal po vytvorení účtu.

**URL:** `/set-password?token={passwordSetToken}`

**Prístup:** Verejný (neautentifikovaný)

**Pre role:** ADMIN, GESTOR, KOMISIA

---

## ASCII Wireframe

```
+----------------------------------------------------------+
|  [VK Smart Logo]                                         |
+----------------------------------------------------------+
|                                                          |
|  Nastavenie hesla                                        |
|  ================================================         |
|                                                          |
|  +----------------------------------------------------+  |
|  | Vitajte v systéme VK Smart!                        |  |
|  |                                                    |  |
|  | Pre dokončenie registrácie si nastavte heslo.      |  |
|  |                                                    |  |
|  | Email: user@mirri.gov.sk                           |  |
|  | Rola: Gestor                                       |  |
|  |                                                    |  |
|  | -------------------------------------------------  |  |
|  |                                                    |  |
|  | Nové heslo *                                       |  |
|  | [................................]  [👁]           |  |
|  |                                                    |  |
|  | ⓘ Heslo musí obsahovať:                            |  |
|  |   • Minimálne 12 znakov                            |  |
|  |   • Veľké a malé písmená                           |  |
|  |   • Aspoň jedno číslo                              |  |
|  |   • Aspoň jeden špeciálny znak (!@#$%^&*)          |  |
|  |                                                    |  |
|  | Potvrdenie hesla *                                 |  |
|  | [................................]  [👁]           |  |
|  |                                                    |  |
|  | -------------------------------------------------  |  |
|  |                                                    |  |
|  | [Nastaviť heslo a prihlásiť sa]                    |  |
|  |                                                    |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

---

## Elementy

### 1. Header
- Logo "VK Smart"
- Žiadne menu (verejná stránka)

### 2. Info box
- **Email** - načítaný zo servera na základe tokenu
- **Rola** - načítaná zo servera

### 3. Formulár - Nastavenie hesla
- **Input password** - Nové heslo (povinné)
  - Type: password
  - Toggle visibility (👁 ikona)
  - Real-time validácia
- **Info box** - Požiadavky na heslo
- **Input password** - Potvrdenie hesla (povinné)
  - Type: password
  - Toggle visibility
  - Validácia: musí byť identické s "Nové heslo"

### 4. Akcia
- **Button** - "Nastaviť heslo a prihlásiť sa" (primary)
  - Disabled, kým nie sú splnené všetky validácie
  - Po úspešnom nastavení: redirect na dashboard podľa role

---

## Validácie

### Client-side
1. **Token**: kontrola existencie v URL (ak chýba → error stránka)
2. **Nové heslo**:
   - Povinné
   - Min. 12 znakov
   - Obsahuje veľké a malé písmená
   - Obsahuje aspoň 1 číslo
   - Obsahuje aspoň 1 špeciálny znak (!@#$%^&*)
3. **Potvrdenie hesla**:
   - Povinné
   - Musí byť identické s "Nové heslo"

### Server-side
1. **Token validácia**:
   - Token existuje v databáze
   - Token nie je expirovaný (< 24h)
   - Používateľ ešte nemá nastavené heslo (`password === null`)
2. **Password strength**: zhodná validácia ako na klientovi
3. **Password hashing**: bcrypt s 10 rounds

---

## Funkcia po odoslaní

### 1. Overenie tokenu
```typescript
GET /api/auth/verify-password-token?token={token}

Response (200 OK):
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@mirri.gov.sk",
    "name": "Jozef",
    "surname": "Novák",
    "role": "GESTOR"
  },
  "expiresAt": "2025-10-05T10:30:00Z"
}

Response (400 Bad Request):
{
  "valid": false,
  "error": "TOKEN_EXPIRED",
  "message": "Token vypršal. Požiadajte o nový link."
}

Response (404 Not Found):
{
  "valid": false,
  "error": "TOKEN_NOT_FOUND",
  "message": "Neplatný token."
}
```

### 2. Nastavenie hesla
```typescript
POST /api/auth/set-password

Request:
{
  "token": "abc123...",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@mirri.gov.sk",
    "role": "GESTOR",
    "active": true
  },
  "sessionToken": "jwt_token_here..."
}
```

### 3. Aktualizácia databázy
```typescript
{
  password: await bcrypt.hash(password, 10),
  active: true,
  passwordSetToken: null,
  passwordSetTokenExpiry: null
}
```

### 4. Automatické prihlásenie
- Vytvorí sa JWT session token
- Redirect na dashboard podľa role:
  - `ADMIN` → `/admin/dashboard`
  - `GESTOR` → `/gestor/dashboard`
  - `KOMISIA` → `/komisia/dashboard`

### 5. Email notifikácia (voliteľné)
- Odoslať potvrdzovacie email "Vaše heslo bolo úspešne nastavené"
- Template: viď `docs/14-emailove-notifikacie.md` (typ #3)

---

## Error states

### 1. Neplatný token (URL)
```
+----------------------------------------------------------+
|  [VK Smart Logo]                                         |
+----------------------------------------------------------+
|                                                          |
|  ❌ Neplatný link                                        |
|  ================================================         |
|                                                          |
|  Tento link na nastavenie hesla je neplatný.             |
|                                                          |
|  Možné dôvody:                                           |
|  • Link bol už použitý                                   |
|  • Link je poškodený                                     |
|                                                          |
|  Kontaktujte administrátora systému pre                  |
|  vytvorenie nového účtu.                                 |
|                                                          |
|  [Späť na prihlasovaciu stránku]                         |
|                                                          |
+----------------------------------------------------------+
```

### 2. Expirovaný token (> 24h)
```
+----------------------------------------------------------+
|  [VK Smart Logo]                                         |
+----------------------------------------------------------+
|                                                          |
|  ⏱ Link vypršal                                          |
|  ================================================         |
|                                                          |
|  Tento link na nastavenie hesla vypršal.                 |
|  (Platnosť: 24 hodín)                                    |
|                                                          |
|  Pre získanie nového linku kontaktujte                   |
|  administrátora systému.                                 |
|                                                          |
|  [Späť na prihlasovaciu stránku]                         |
|                                                          |
+----------------------------------------------------------+
```

### 3. Heslo nesplňa požiadavky
- Red outline na input field
- Červená správa pod inputom: "Heslo musí obsahovať min. 12 znakov, veľké a malé písmená, číslo a špeciálny znak"

### 4. Heslá sa nezhodujú
- Red outline na "Potvrdenie hesla"
- Červená správa: "Heslá sa nezhodujú"

### 5. Server error
```
+----------------------------------------------------------+
|  ⚠ Chyba pri nastavení hesla                             |
|                                                          |
|  Nepodarilo sa nastaviť heslo. Skúste to znova alebo     |
|  kontaktujte administrátora.                             |
|                                                          |
|  [Skúsiť znova]                                          |
+----------------------------------------------------------+
```

---

## API Endpoints

### GET `/api/auth/verify-password-token?token={token}`

**Response (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@mirri.gov.sk",
    "name": "Jozef",
    "surname": "Novák",
    "role": "GESTOR"
  },
  "expiresAt": "2025-10-05T10:30:00Z"
}
```

**Response (400 Bad Request - Token expired):**
```json
{
  "valid": false,
  "error": "TOKEN_EXPIRED",
  "message": "Token vypršal. Požiadajte o nový link."
}
```

**Response (404 Not Found - Token not found):**
```json
{
  "valid": false,
  "error": "TOKEN_NOT_FOUND",
  "message": "Neplatný token."
}
```

**Response (409 Conflict - Password already set):**
```json
{
  "valid": false,
  "error": "PASSWORD_ALREADY_SET",
  "message": "Heslo už bolo nastavené. Použite funkciu reset hesla."
}
```

---

### POST `/api/auth/set-password`

**Request:**
```json
{
  "token": "abc123...",
  "password": "SecurePass123!",
  "gdprConsent": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@mirri.gov.sk",
    "name": "Jozef",
    "surname": "Novák",
    "role": "GESTOR",
    "active": true
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (400 Bad Request - Weak password):**
```json
{
  "success": false,
  "error": "WEAK_PASSWORD",
  "message": "Heslo musí obsahovať min. 12 znakov, veľké a malé písmená, číslo a špeciálny znak"
}
```

**Response (400 Bad Request - Invalid token):**
```json
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Neplatný alebo vypršaný token"
}
```

---

## Navigácia

### Príchod na obrazovku
- Kliknutie na link v emaili: `https://app.url/set-password?token={passwordSetToken}`
- Direct URL access (ak má token)

### Odchod z obrazovky
- **Úspešné nastavenie hesla** → automatický redirect na dashboard podľa role
- **Chyba (neplatný/expirovaný token)** → "Späť na prihlasovaciu stránku" → `/login`

---

## Bezpečnostné poznámky

1. **Token security**:
   - Token je kryptograficky bezpečný (crypto.randomBytes(32))
   - Single-use token (po použití sa zneplatní)
   - Time-limited (24h)
   - Stored hashed v databáze (nie plaintext)

2. **Password hashing**:
   - bcrypt s 10 rounds
   - Nikdy nesiela sa plaintext heslo v logu alebo error message

3. **Rate limiting**:
   - Max 5 pokusov na 1 IP adresu za 15 minút
   - Po dosiahnutí limitu: 429 Too Many Requests

---

## Poznámky

- Táto obrazovka je **len pre Admin/Gestor/Komisia** (trvalé účty)
- Uchádzači dostávajú **dočasné heslo priamo v emaili** (nie link na nastavenie)
- Po úspešnom nastavení hesla sa používateľ automaticky prihlási
- Token je **single-use** - po použití sa deaktivuje
- Ak používateľ klikne na starý link (už má heslo), zobrazí sa chyba "PASSWORD_ALREADY_SET"
- Pre reset hesla existuje samostatná obrazovka (viď `/reset-password`)
