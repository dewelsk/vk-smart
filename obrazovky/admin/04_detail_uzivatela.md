# Detail používateľa (Superadmin, Admin, Gestor, Komisia)

## Prístup
- **Superadmin**: vidí všetkých používateľov
- **Admin**: vidí len používateľov zo svojich rezortov
- **Gestor, Komisia**: len čítanie? (OTÁZKA)

## Vstupný bod
- Zo **zoznamu používateľov** (klik na riadok)
- URL: `/admin/users/:id`

---

## Wireframe - Detail používateľa (View Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na zoznam                                              │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Detail používateľa                         [Upraviť]  │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Základné informácie                              │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Meno a priezvisko: Jozef Novák                  │   │   │
│ │ │ Email: jozef.novak@mirri.gov.sk                 │   │   │
│ │ │ Používateľské meno: novak.jozef                 │   │   │
│ │ │ Rola: Gestor                                     │   │   │
│ │ │ Status: ● Aktívny                                │   │   │
│ │ │ Dátum vytvorenia: 15.03.2025 14:23              │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Rezorty (len pre Admin/Gestor/Komisia)          │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ • Ministerstvo zahraničných vecí (MZVaEZ)       │   │   │
│ │ │ • Ministerstvo vnútra (MV)                       │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Výberové konania                                 │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ • VK-2025-001: Analytik dát (Aktívne)           │   │   │
│ │ │ • VK-2025-015: Senior programátor (Ukončené)    │   │   │
│ │ │ • VK-2024-234: Projektový manažér (Aktívne)     │   │   │
│ │ │                                                  │   │   │
│ │ │ [Zobraziť všetky VK (15)]                        │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Poznámka                                         │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Medzinárodný expert pre...                       │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │                                                        │   │
│ │ [Poslať link na nastavenie hesla]                     │   │
│ │ [Deaktivovať] [Vymazať]                                │   │
│ │                                                        │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Wireframe - Detail používateľa (Edit Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na zoznam                                              │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Upraviť používateľa                [Zrušiť] [Uložiť]  │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Základné informácie                              │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Meno *                                           │   │   │
│ │ │ [Jozef.......................................]   │   │   │
│ │ │                                                  │   │   │
│ │ │ Priezvisko *                                     │   │   │
│ │ │ [Novák.......................................]   │   │   │
│ │ │                                                  │   │   │
│ │ │ Email *                                          │   │   │
│ │ │ [jozef.novak@mirri.gov.sk...................]   │   │   │
│ │ │                                                  │   │   │
│ │ │ Používateľské meno: novak.jozef (read-only)     │   │   │
│ │ │ Rola: Gestor (read-only)                        │   │   │
│ │ │ Status: ● Aktívny (read-only)                   │   │   │
│ │ │ Dátum vytvorenia: 15.03.2025 14:23 (read-only)  │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Rezorty (len pre Admin/Gestor/Komisia)          │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ ☑ Ministerstvo zahraničných vecí (MZVaEZ)       │   │   │
│ │ │ ☑ Ministerstvo vnútra (MV)                       │   │   │
│ │ │ ☐ Ministerstvo zdravotníctva (MZ)                │   │   │
│ │ │                                                  │   │   │
│ │ │ (i) Superadmin vidí všetky rezorty               │   │   │
│ │ │ (i) Admin vidí len svoje rezorty                 │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Poznámka                                         │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │ [Medzinárodný expert pre.....................]   │   │   │
│ │ │ [.............................................]   │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Popis polí a funkcionalít

### View Mode (default)
- Všetky polia sú **read-only**
- Tlačidlo **[Upraviť]** v pravom hornom rohu
- Rezorty zobrazené ako zoznam (bullet points)

### Edit Mode (po kliknutí na "Upraviť")
- **Editovateľné polia**:
  - Meno (text input) *
  - Priezvisko (text input) *
  - Email (text input) *
  - Rezorty (checkboxy - len pre Admin/Gestor/Komisia)
  - Poznámka (textarea)

- **Read-only polia** (aj v Edit Mode):
  - Používateľské meno
  - Rola
  - Status
  - Dátum vytvorenia
  - Výberové konania

- **Tlačidlá**: [Zrušiť] [Uložiť]

### Rezorty (viditeľné len pre Admin/Gestor/Komisia)
- **View Mode**: Zoznam rezortov (bullet points)
- **Edit Mode**: Checkboxy pre výber rezortov
- **Superadmin**: Vidí všetky rezorty, môže priradiť ľubovoľné
- **Admin**: Vidí len svoje rezorty, môže priradiť len svoje

### Výberové konania (vždy read-only)
- Zoznam VK, kde je používateľ priradený
- Zobrazuje: kód VK, názov, status (Aktívne/Ukončené)
- Klik na VK → detail VK
- **"Zobraziť všetky VK (15)"** → rozbalí celý zoznam

---

## Akcie

### A) Upraviť
- Klik na tlačidlo **[Upraviť]** prepne obrazovku do **Edit Mode**
- Všetky editovateľné polia sa stanú input fieldmi
- Tlačidlá sa zmenia na **[Zrušiť]** a **[Uložiť]**

**Zrušiť:**
- Zatvorí Edit Mode bez uloženia
- Vráti sa do View Mode s pôvodnými hodnotami

**Uložiť:**
- Validuje všetky polia
- Odošle PATCH request s **všetkými zmenami naraz** (základné info + rezorty)

**API:**
```
PATCH /api/users/:id
{
  "firstName": "Jozef",
  "lastName": "Novák",
  "email": "jozef.novak@mirri.gov.sk",
  "note": "Medzinárodný expert...",
  "institutionIds": ["inst_123", "inst_456"]
}
```

**Validácia:**
- Meno, Priezvisko - povinné, max 100 znakov
- Email - povinný, validný formát, jedinečný (okrem aktuálneho používateľa)
- InstitutionIds - Admin môže priradiť len svoje rezorty, Superadmin ľubovoľné

**Success:**
- ✓ "Používateľ úspešne aktualizovaný"
- Prepne do View Mode s aktualizovanými dátami

**Error:**
- ⚠️ "Email už existuje"
- ⚠️ "Neplatný formát emailu"
- ⚠️ "Nemáte oprávnenie priradiť tento rezort"

---

### B) Poslať link na nastavenie hesla
- Pre používateľov, ktorí ešte nemajú nastavené heslo
- Alebo pre reset hesla

**API:**
```
POST /api/users/:id/send-password-link
```

**Backend:**
- Vygeneruje token (UUID, expirácia 24h)
- Uloží do `PasswordResetToken` (userId, token, expiresAt)
- Pošle email s linkom: `https://vk-smart.gov.sk/set-password?token={token}`

**Success:**
- ✓ "Link na nastavenie hesla bol odoslaný na {email}"

**Error:**
- ⚠️ "Nepodarilo sa odoslať email"

---

### C) Deaktivovať / Aktivovať
- Toggle aktívneho statusu
- Deaktivovaný používateľ sa nemôže prihlásiť

**API:**
```
PATCH /api/users/:id/toggle-active
```

**Backend:**
- Toggle `active` field (true ↔ false)
- Ak deaktivuje: invaliduje všetky aktívne sessions/tokeny

**Confirmation modal (pri deaktivácii):**
```
┌───────────────────────────────────────────┐
│ Deaktivovať používateľa?                  │
├───────────────────────────────────────────┤
│                                           │
│ Používateľ Jozef Novák sa nebude môcť     │
│ prihlásiť do systému.                     │
│                                           │
│ Môžete ho neskôr aktivovať.               │
│                                           │
│         [Zrušiť]  [Deaktivovať]           │
│                                           │
└───────────────────────────────────────────┘
```

**Success:**
- ✓ "Používateľ deaktivovaný"
- ✓ "Používateľ aktivovaný"

---

### D) Vymazať
- **Soft delete** (deleted=true, email=NULL, deletedEmail=email)
- Len Superadmin a Admin

**API:**
```
DELETE /api/users/:id
```

**Backend:**
- UPDATE users SET
  - deleted = true
  - deletedEmail = email
  - email = NULL
  - deletedAt = NOW()

**Confirmation modal:**
```
┌───────────────────────────────────────────┐
│ Vymazať používateľa?                      │
├───────────────────────────────────────────┤
│                                           │
│ Používateľ Jozef Novák bude trvale        │
│ vymazaný zo systému.                      │
│                                           │
│ Táto akcia je nevratná.                   │
│                                           │
│         [Zrušiť]  [Vymazať]               │
│                                           │
└───────────────────────────────────────────┘
```

**Success:**
- ✓ "Používateľ vymazaný"
- Redirect → zoznam používateľov

**Error:**
- ⚠️ "Používateľa nie je možné vymazať (má aktívne VK)"
  - Backend validácia: ak má používateľ aktívne VK, nedovolí vymazať

---

## Permissions

### Superadmin
- ✅ Vidí všetkých používateľov
- ✅ Upraviť všetko
- ✅ Priradiť ľubovoľné rezorty
- ✅ Deaktivovať/Aktivovať
- ✅ Vymazať

### Admin
- ✅ Vidí len používateľov zo svojich rezortov
- ✅ Upraviť (okrem Superadmin používateľov)
- ✅ Priradiť len svoje rezorty
- ✅ Deaktivovať/Aktivovať
- ✅ Vymazať (okrem Superadmin používateľov)

### Gestor, Komisia
- ❓ Len čítanie? (OTÁZKA)
- ❓ Alebo žiadny prístup? (OTÁZKA)

---

## API Endpoints

### 1. Get User Detail
```
GET /api/users/:id
```

**Response 200:**
```json
{
  "id": "user_123",
  "firstName": "Jozef",
  "lastName": "Novák",
  "email": "jozef.novak@mirri.gov.sk",
  "username": "novak.jozef",
  "role": "GESTOR",
  "active": true,
  "createdAt": "2025-03-15T14:23:00Z",
  "note": "Medzinárodný expert pre...",
  "institutions": [
    {
      "id": "inst_123",
      "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
      "code": "MZVaEZ"
    },
    {
      "id": "inst_456",
      "name": "Ministerstvo vnútra",
      "code": "MV"
    }
  ],
  "selectionProcedures": [
    {
      "id": "sp_789",
      "code": "VK-2025-001",
      "jobTitle": "Analytik dát",
      "status": "ACTIVE"
    },
    {
      "id": "sp_790",
      "code": "VK-2025-015",
      "jobTitle": "Senior programátor",
      "status": "COMPLETED"
    }
  ],
  "selectionProcedureCount": 15
}
```

**Response 403:**
```json
{
  "error": "Forbidden",
  "message": "Nemáte oprávnenie zobraziť tohto používateľa"
}
```

**Response 404:**
```json
{
  "error": "Not Found",
  "message": "Používateľ nebol nájdený"
}
```

---

### 2. Update User
```
PATCH /api/users/:id
{
  "firstName": "Jozef",
  "lastName": "Novák",
  "email": "jozef.novak@mirri.gov.sk",
  "note": "Poznámka...",
  "institutionIds": ["inst_123", "inst_456"]
}
```

**Validácia:**
- Meno, Priezvisko - max 100 znakov
- Email - validný formát, jedinečný
- InstitutionIds - Admin môže priradiť len svoje rezorty, Superadmin ľubovoľné

**Response 200:** (rovnaké ako GET)

**Response 400:**
```json
{
  "error": "Validation Error",
  "message": "Email už existuje"
}
```

**Response 403:**
```json
{
  "error": "Forbidden",
  "message": "Nemáte oprávnenie priradiť tento rezort"
}
```

---

### 3. Send Password Link
```
POST /api/users/:id/send-password-link
```

**Response 200:**
```json
{
  "message": "Link na nastavenie hesla bol odoslaný na jozef.novak@mirri.gov.sk"
}
```

---

### 4. Toggle Active
```
PATCH /api/users/:id/toggle-active
```

**Response 200:**
```json
{
  "active": false
}
```

---

### 5. Delete User
```
DELETE /api/users/:id
```

**Response 204:** (No Content)

**Response 400:**
```json
{
  "error": "Bad Request",
  "message": "Používateľa nie je možné vymazať (má aktívne VK)"
}
```

---

## OTÁZKY (na neskôr):

1. **Prístup Gestor/Komisia k detailu používateľa?**
   - Len čítanie?
   - Žiadny prístup?
   - Alebo len pre vlastné VK?

2. **VK v detaile používateľa**
   - Koľko VK zobrazovať? (3, 5, 10?)
   - Alebo pagination?

3. **História zmien**
   - Trackujeme audit log zmien používateľa?
   - Kto, kedy, čo zmenil?
