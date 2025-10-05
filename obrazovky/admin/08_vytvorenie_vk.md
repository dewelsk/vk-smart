# Vytvorenie výberového konania (Admin)

## Prístup
- **Admin**: môže vytvoriť VK len pre svoje rezorty
- **Superadmin**: môže vytvoriť VK pre ľubovoľný rezort

## Vstupný bod
- Z **dashboard** alebo **zoznamu VK** → tlačidlo **"+ Nové VK"**
- URL: `/admin/selection-procedures/new`

---

## Wireframe - Vytvorenie VK

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na zoznam VK                                           │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Nové výberové konanie                                   │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────┐   │ │
│ │ │ Základné informácie                               │   │ │
│ │ ├──────────────────────────────────────────────────┤   │ │
│ │ │                                                   │   │ │
│ │ │ Rezort *                                          │   │ │
│ │ │ [Ministerstvo zahraničných vecí...         ] [▼] │   │ │
│ │ │                                                   │   │ │
│ │ │ (i) Superadmin vidí všetky rezorty               │   │ │
│ │ │ (i) Admin vidí len svoje rezorty                 │   │ │
│ │ │                                                   │   │ │
│ │ │ Identifikátor VK *                                │   │ │
│ │ │ [VK/2025/............................] [Generovať]│   │ │
│ │ │ (napr. VK/2025/0001)                              │   │ │
│ │ │                                                   │   │ │
│ │ └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────┐   │ │
│ │ │ Detaily konania                                   │   │ │
│ │ ├──────────────────────────────────────────────────┤   │ │
│ │ │                                                   │   │ │
│ │ │ Druh konania *                                    │   │ │
│ │ │ [...........................................]  [▼]│   │ │
│ │ │                                                   │   │ │
│ │ │ Organizačný útvar *                               │   │ │
│ │ │ [................................................]│   │ │
│ │ │                                                   │   │ │
│ │ │ Odbor štátnej služby *                            │   │ │
│ │ │ [...........................................]  [▼]│   │ │
│ │ │                                                   │   │ │
│ │ │ Funkcia *                                         │   │ │
│ │ │ [...........................................]  [▼]│   │ │
│ │ │                                                   │   │ │
│ │ │ Druh štátnej služby *                             │   │ │
│ │ │ [...........................................]  [▼]│   │ │
│ │ │                                                   │   │ │
│ │ │ Dátum konania *                                   │   │ │
│ │ │ [DD.MM.RRRR]  [📅]                                │   │ │
│ │ │                                                   │   │ │
│ │ │ Počet obsadzovaných miest *                       │   │ │
│ │ │ [1....]                                           │   │ │
│ │ │                                                   │   │ │
│ │ └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────────────┐   │ │
│ │ │ Priradenie gestora (voliteľné)                   │   │ │
│ │ ├──────────────────────────────────────────────────┤   │ │
│ │ │                                                   │   │ │
│ │ │ Gestor                                            │   │ │
│ │ │ [Vyberte gestora...........................] [▼] │   │ │
│ │ │                                                   │   │ │
│ │ │ (i) Môžete priradiť gestora aj neskôr            │   │ │
│ │ │ (i) Gestor môže byť z iného rezortu              │   │ │
│ │ │                                                   │   │ │
│ │ └──────────────────────────────────────────────────┘   │ │
│ │                                                          │ │
│ │                                                          │ │
│ │                          [Zrušiť]  [Vytvoriť VK]        │ │
│ │                                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Popis polí a validácie

### 1. Rezort *
- **Dropdown** so zoznamom rezortov
- **Superadmin**: vidí všetky aktívne rezorty
- **Admin**: vidí len svoje rezorty (z `UserInstitution`)
- **Povinné**

### 2. Identifikátor VK *
- **Text input** s tlačidlom "Generovať"
- Formát: `VK/YYYY/####` (napr. `VK/2025/0001`)
- **Automatické generovanie**: posledné číslo v danom roku + 1
- **Manuálne zadanie**: možnosť prepísať
- **Validácia**:
  - Musí byť jedinečný
  - Formát: `VK/YYYY/####`
- **Povinné**

**API pre generovanie:**
```
GET /api/selection-procedures/generate-identifier?year=2025

Response 200:
{
  "identifier": "VK/2025/0042"
}
```

### 3. Druh konania *
- **Dropdown** s preddefinovanými hodnotami:
  - "širšie vnútorné výberové konanie"
  - "vnútorné výberové konanie"
  - "externé výberové konanie"
  - "kombinované výberové konanie"
- **Povinné**

### 4. Organizačný útvar *
- **Text input**
- Max 200 znakov
- **Povinné**

### 5. Odbor štátnej služby *
- **Dropdown** s preddefinovanými hodnotami podľa CIS ŠS:
  - "1.01 – Vnútorná správa"
  - "1.02 – Správa výkonu trestu a väzby"
  - "1.03 – Medzinárodná spolupráca"
  - "1.04 – Obrana"
  - ... (všetky odbory z CIS ŠS)
- **Alebo** text input (ak nie je v zozname)
- **Povinné**

### 6. Funkcia *
- **Dropdown** s preddefinovanými hodnotami:
  - "hlavný štátny radca"
  - "štátny radca"
  - "radca"
  - "odborný radca"
  - ... (všetky funkcie z CIS ŠS)
- **Povinné**

### 7. Druh štátnej služby *
- **Dropdown** s preddefinovanými hodnotami:
  - "stála štátna služba"
  - "dočasná štátna služba"
- **Povinné**

### 8. Dátum konania *
- **Date picker**
- Validácia: dátum nesmie byť v minulosti
- **Povinné**

### 9. Počet obsadzovaných miest *
- **Number input**
- Min: 1, Max: 999
- Default: 1
- **Povinné**

### 10. Gestor
- **Dropdown** so zoznamom používateľov s rolou GESTOR
- **Voliteľné** - môže byť priradený aj neskôr
- **Superadmin**: vidí všetkých gestorov
- **Admin**: vidí gestorov zo svojich rezortov + možnosť vybrať gestora z iného rezortu (všetci gestori)

---

## Proces vytvorenia

### 1. Vyplnenie formulára
- Používateľ vyplní všetky povinné polia
- Klikne na tlačidlo "Generovať" pre automatické vygenerovanie identifikátora

### 2. Klik na "Vytvoriť VK"

**API Request:**
```
POST /api/selection-procedures
{
  "institutionId": "inst_123",
  "identifier": "VK/2025/0042",
  "selectionType": "širšie vnútorné výberové konanie",
  "organizationalUnit": "Odbor implementácie OKP",
  "serviceField": "1.03 – Medzinárodná spolupráca",
  "position": "hlavný štátny radca",
  "serviceType": "stála štátna služba",
  "date": "2025-07-24T00:00:00Z",
  "numberOfPositions": 1,
  "gestorId": "user_456" // voliteľné
}
```

**Backend:**
- Validuje všetky polia
- Skontroluje, či identifikátor je jedinečný
- Skontroluje permissions:
  - Admin môže vytvoriť VK len pre svoje rezorty
  - Superadmin môže vytvoriť VK pre ľubovoľný rezort
- Vytvorí VK so statusom `PRIPRAVA`
- Vytvorí audit log

**Response 201:**
```json
{
  "id": "vk_789",
  "identifier": "VK/2025/0042",
  "institutionId": "inst_123",
  "institution": {
    "id": "inst_123",
    "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
    "code": "MZVaEZ"
  },
  "selectionType": "širšie vnútorné výberové konanie",
  "organizationalUnit": "Odbor implementácie OKP",
  "serviceField": "1.03 – Medzinárodná spolupráca",
  "position": "hlavný štátny radca",
  "serviceType": "stála štátna služba",
  "date": "2025-07-24T00:00:00Z",
  "numberOfPositions": 1,
  "status": "PRIPRAVA",
  "gestorId": "user_456",
  "gestor": {
    "id": "user_456",
    "name": "Jozef",
    "surname": "Novák"
  },
  "createdById": "user_123",
  "createdBy": {
    "id": "user_123",
    "name": "Admin",
    "surname": "Adminovic"
  },
  "createdAt": "2025-03-15T14:23:00Z",
  "updatedAt": "2025-03-15T14:23:00Z"
}
```

### 3. Success
- ✓ "Výberové konanie úspešne vytvorené"
- Redirect → detail VK (`/admin/selection-procedures/:id`)

---

## Error states

### 1. Identifikátor už existuje
```
⚠️ Identifikátor "VK/2025/0042" už existuje.
   Použite iný identifikátor alebo vygenerujte nový.
```

### 2. Neplatný formát identifikátora
```
⚠️ Neplatný formát identifikátora.
   Použite formát: VK/YYYY/####
```

### 3. Dátum v minulosti
```
⚠️ Dátum konania nemôže byť v minulosti
```

### 4. Chýbajúce povinné polia
```
⚠️ Vyplňte všetky povinné polia
```

### 5. Nemáte oprávnenie vytvoriť VK pre tento rezort
```
⚠️ Nemáte oprávnenie vytvoriť VK pre rezort "MZVaEZ"
```

---

## Permissions

### Admin
- ✅ Môže vytvoriť VK len pre svoje rezorty (zo `UserInstitution`)
- ✅ Môže priradiť gestora zo svojich rezortov + všetkých gestorov

### Superadmin
- ✅ Môže vytvoriť VK pre ľubovoľný rezort
- ✅ Môže priradiť ľubovoľného gestora

### Gestor, Komisia
- ❌ Nemôžu vytvoriť VK

---

## API Endpoints

### 1. Generate VK Identifier
```
GET /api/selection-procedures/generate-identifier?year=2025
```

**Response 200:**
```json
{
  "identifier": "VK/2025/0042"
}
```

**Logika:**
- Nájde posledný identifikátor v danom roku
- Vráti nasledujúce číslo (posledné + 1)
- Ak žiadne VK v roku neexistuje, vráti `VK/YYYY/0001`

---

### 2. Get Gestor Options
```
GET /api/users?role=GESTOR&institutionId=inst_123
```

**Response 200:**
```json
{
  "data": [
    {
      "id": "user_456",
      "name": "Jozef",
      "surname": "Novák",
      "email": "jozef.novak@mirri.gov.sk",
      "institutions": [
        {
          "id": "inst_123",
          "name": "Ministerstvo zahraničných vecí",
          "code": "MZVaEZ"
        }
      ]
    }
  ]
}
```

---

### 3. Get Institution Options
```
GET /api/institutions?active=true&userId=user_123
```

**Query params:**
- `active` (boolean, default: true) - len aktívne rezorty
- `userId` (string, optional) - filter rezorty pre daného používateľa (Admin)

**Response 200:**
```json
{
  "data": [
    {
      "id": "inst_123",
      "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
      "code": "MZVaEZ"
    }
  ]
}
```

---

### 4. Create Selection Procedure
```
POST /api/selection-procedures
{
  "institutionId": "inst_123",
  "identifier": "VK/2025/0042",
  ...
}
```

**Response 201:** (viď vyššie)

**Response 400:**
```json
{
  "error": "Validation Error",
  "message": "Identifikátor 'VK/2025/0042' už existuje"
}
```

**Response 403:**
```json
{
  "error": "Forbidden",
  "message": "Nemáte oprávnenie vytvoriť VK pre tento rezort"
}
```

---

## UX - Pokročilé funkcie

### 1. Auto-save draft (voliteľné)
- Uložiť rozpracované VK do localStorage
- Pri návrate načítať zo storage

### 2. Duplicity warning
- Pri zadaní identifikátora realtimovo kontrolovať, či už existuje
- Zobraziť warning pred submitom

### 3. Preddefinované šablóny (voliteľné)
- Možnosť vytvoriť VK zo šablóny
- Šablóna: uložené defaultné hodnoty pre druh konania, odbor, atď.

---

## OTÁZKY (na neskôr):

1. **Automatické generovanie identifikátora?**
   - Má sa identifikátor generovať automaticky pri načítaní formulára?
   - Alebo len po kliknutí na tlačidlo "Generovať"?

2. **Preddefinované hodnoty dropdownov?**
   - Odkiaľ čerpať hodnoty pre odbory, funkcie, druhy konania?
   - CIS ŠS API? Alebo hardcoded v kóde?

3. **Draft mode?**
   - Má VK možnosť uložiť ako koncept (draft) bez odoslania?
   - Alebo sa VK vždy vytvára so statusom PRIPRAVA?

4. **Kto môže byť gestorom?**
   - Len GESTOR rola?
   - Alebo aj ADMIN môže byť gestorom?

5. **Viac gestorov pre jedno VK?**
   - Aktuálne model má `gestorId` (1:1)
   - Má byť možnosť priradiť viacero gestorov? (1:N)
