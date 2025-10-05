# Detail uchádzača (Admin, Gestor, Komisia)

## Prístup
- **Admin**: vidí detail uchádzača len pre VK vo svojich rezortoch
- **Gestor**: vidí detail uchádzača len pre VK, kde je priradený
- **Komisia**: vidí detail uchádzača len pre VK, kde je členom komisie
- **Superadmin**: vidí detail všetkých uchádzačov

## Vstupný bod
- Zo **zoznamu uchádzačov** → klik na uchádzača
- URL: `/admin/selection-procedures/:spId/candidates/:candidateId`

---

## Wireframe - Detail uchádzača (View Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na zoznam uchádzačov                                   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Detail uchádzača                           [Upraviť]  │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Základné informácie                              │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Meno a priezvisko: Peter Novák                  │   │   │
│ │ │ Email: peter.novak@example.com                  │   │   │
│ │ │ CIS identifikátor: UC001                        │   │   │
│ │ │ Status: ● Aktívny                                │   │   │
│ │ │ Dátum vytvorenia: 15.03.2025 14:23              │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Výberové konanie                                 │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Kód VK: VK/2025/0001                            │   │   │
│ │ │ Pozícia: Analytik dát                           │   │   │
│ │ │ Rezort: Ministerstvo zahraničných vecí (MZVaEZ) │   │   │
│ │ │ Status VK: Testovanie                           │   │   │
│ │ │                                                  │   │   │
│ │ │ [→ Detail VK]                                    │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Testy (3)                                        │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ ✓ Level 1: Odborný test - 85/100 (Prešiel)     │   │   │
│ │ │ ✓ Level 2: Všeobecný test - 72/100 (Prešiel)   │   │   │
│ │ │ ✗ Level 3: IT zručnosti - 45/100 (Neprešiel)   │   │   │
│ │ │                                                  │   │   │
│ │ │ Celkové hodnotenie testov: 67% (Prešiel)       │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Hodnotenie komisiou                              │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Status: Čaká na hodnotenie                      │   │   │
│ │ │                                                  │   │   │
│ │ │ (Hodnotenie bude dostupné po dokončení testov)  │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Dokumenty (2)                                    │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ • CV.pdf (200 KB) - 15.03.2025          [⬇]     │   │   │
│ │ │ • Motivacny_list.pdf (150 KB) - 15.03.2025 [⬇]  │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Poznámka                                         │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Expert v oblasti dátovej analýzy...             │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │                                                        │   │
│ │ [Poslať link na reset hesla]                          │   │
│ │ [Deaktivovať] [Vymazať]                                │   │
│ │                                                        │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Wireframe - Detail uchádzača (Edit Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na zoznam uchádzačov                                   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Upraviť uchádzača                  [Zrušiť] [Uložiť]  │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Základné informácie                              │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │                                                  │   │   │
│ │ │ Meno *                                           │   │   │
│ │ │ [Peter.......................................]   │   │   │
│ │ │                                                  │   │   │
│ │ │ Priezvisko *                                     │   │   │
│ │ │ [Novák.......................................]   │   │   │
│ │ │                                                  │   │   │
│ │ │ Email *                                          │   │   │
│ │ │ [peter.novak@example.com.....................]   │   │   │
│ │ │                                                  │   │   │
│ │ │ CIS identifikátor *                              │   │   │
│ │ │ [UC001.......................................]   │   │   │
│ │ │ (i) Musí byť jedinečný v rámci tohto VK          │   │   │
│ │ │                                                  │   │   │
│ │ │ Status: ● Aktívny (read-only)                   │   │   │
│ │ │ Dátum vytvorenia: 15.03.2025 14:23 (read-only)  │   │   │
│ │ │                                                  │   │   │
│ │ └─────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌─────────────────────────────────────────────────┐   │   │
│ │ │ Poznámka                                         │   │   │
│ │ ├─────────────────────────────────────────────────┤   │   │
│ │ │ [Expert v oblasti dátovej analýzy............]   │   │   │
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

### Edit Mode (po kliknutí na "Upraviť")
- **Editovateľné polia**:
  - Meno (text input) *
  - Priezvisko (text input) *
  - Email (text input) *
  - CIS identifikátor (text input) *
  - Poznámka (textarea)

- **Read-only polia** (aj v Edit Mode):
  - Status
  - Dátum vytvorenia
  - VK informácie
  - Testy
  - Hodnotenie
  - Dokumenty

- **Tlačidlá**: [Zrušiť] [Uložiť]

### 1. Základné informácie
- **Meno a priezvisko**: spojené z User tabuľky (name + surname)
- **Email**: z Candidate tabuľky
- **CIS identifikátor**: jedinečný v rámci VK
- **Status**: Aktívny / Neaktívny
- **Dátum vytvorenia**: kedy bol uchádzač pridaný do VK

### 2. Výberové konanie (vždy read-only)
- **Kód VK**: identifikátor VK
- **Pozícia**: funkcia/pozícia z VK
- **Rezort**: názov a kód rezortu
- **Status VK**: aktuálny status VK (Príprava, Testovanie, ...)
- **Tlačidlo [→ Detail VK]**: odkaz na detail VK

### 3. Testy (vždy read-only)
- **Zoznam absolvovaných testov** (z TestResult)
- Každý test zobrazuje:
  - Level + názov testu
  - Získané body / max body
  - Status: ✓ Prešiel / ✗ Neprešiel
- **Celkové hodnotenie testov**: priemerná úspešnosť

### 4. Hodnotenie komisiou (vždy read-only)
- **Status hodnotenia**:
  - "Čaká na hodnotenie" - ak ešte nebolo hodnotenie
  - "Hodnotené" - ak už má finalizované hodnotenie
- **Výsledky hodnotenia** (ak finalizované):
  - Hodnotené vlastnosti + body
  - Celkové body
  - Úspešnosť

### 5. Dokumenty (vždy read-only)
- **Zoznam nahratých dokumentov** (CV, Motivačný list, ...)
- Každý dokument:
  - Názov súboru
  - Veľkosť
  - Dátum nahrania
  - Tlačidlo [⬇] Stiahnuť

### 6. Poznámka
- **View Mode**: zobrazený text
- **Edit Mode**: textarea

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
- Odošle PATCH request s aktualizovanými údajmi

**API:**
```
PATCH /api/candidates/:id
{
  "firstName": "Peter",
  "lastName": "Novák",
  "email": "peter.novak@example.com",
  "cisIdentifier": "UC001",
  "note": "Expert v oblasti..."
}
```

**Validácia:**
- Meno, Priezvisko - povinné, max 100 znakov
- Email - povinný, validný formát (nemusí byť jedinečný globálne)
- CIS identifikátor - povinný, jedinečný **v rámci VK**, alfanumerický, max 50 znakov
- Poznámka - max 500 znakov

**Success:**
- ✓ "Uchádzač úspešne aktualizovaný"
- Prepne do View Mode s aktualizovanými dátami

**Error:**
- ⚠️ "CIS identifikátor už existuje v tomto VK"
- ⚠️ "Neplatný formát emailu"
- ⚠️ "Chýbajúce povinné polia"

---

### B) Poslať link na reset hesla
- Vygeneruje nové heslo a odošle ho uchádzačovi emailom

**API:**
```
POST /api/candidates/:id/reset-password
```

**Backend:**
- Vygeneruje nové náhodné heslo
- Hashuje heslo
- Uloží do databázy
- Odošle email s novým heslom

**Response 200:**
```json
{
  "temporaryPassword": "NewPass123!"
}
```

**Success Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ ✓ Heslo resetované                                 │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Nové prihlasovacie údaje pre Peter Novák:         │    │
│   │                                                     │    │
│   │ ┌────────────────────────────────────────────────┐ │    │
│   │ │ VK kód: VK/2025/0001                           │ │    │
│   │ │ CIS identifikátor: UC001                       │ │    │
│   │ │ Heslo: NewPass123!                             │ │    │
│   │ └────────────────────────────────────────────────┘ │    │
│   │                                                     │    │
│   │ ⚠️ Heslo sa zobrazí len raz!                       │    │
│   │                                                     │    │
│   │ [Kopírovať údaje]  [Odoslať email]  [Zavrieť]      │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

### C) Deaktivovať / Aktivovať
- Toggle aktívneho statusu
- Deaktivovaný uchádzač sa nemôže prihlásiť

**API:**
```
PATCH /api/candidates/:id/toggle-active
```

**Backend:**
- Toggle `active` field v User tabuľke
- Invaliduje aktívne sessions/tokeny

**Confirmation modal (pri deaktivácii):**
```
┌───────────────────────────────────────────┐
│ Deaktivovať uchádzača?                    │
├───────────────────────────────────────────┤
│                                           │
│ Uchádzač Peter Novák sa nebude môcť      │
│ prihlásiť do systému.                     │
│                                           │
│ Môžete ho neskôr aktivovať.               │
│                                           │
│         [Zrušiť]  [Deaktivovať]           │
│                                           │
└───────────────────────────────────────────┘
```

**Success:**
- ✓ "Uchádzač deaktivovaný"
- ✓ "Uchádzač aktivovaný"

---

### D) Vymazať
- **Soft delete** (deleted=true, email=NULL, deletedEmail=email)
- Len Superadmin, Admin, Gestor

**API:**
```
DELETE /api/candidates/:id
```

**Backend:**
- Soft delete v Candidate tabuľke
- Soft delete v User tabuľke

**Confirmation modal:**
```
┌───────────────────────────────────────────┐
│ Vymazať uchádzača?                        │
├───────────────────────────────────────────┤
│                                           │
│ Uchádzač Peter Novák bude trvale         │
│ vymazaný zo systému.                      │
│                                           │
│ Táto akcia je nevratná.                   │
│                                           │
│         [Zrušiť]  [Vymazať]               │
│                                           │
└───────────────────────────────────────────┘
```

**Success:**
- ✓ "Uchádzač vymazaný"
- Redirect → zoznam uchádzačov

---

## Permissions

### Admin
- ✅ Vidí detail uchádzača len pre VK vo svojich rezortoch
- ✅ Môže upraviť, resetovať heslo, deaktivovať, vymazať

### Gestor
- ✅ Vidí detail uchádzača len pre VK, kde je priradený
- ✅ Môže upraviť, resetovať heslo, deaktivovať, vymazať

### Komisia
- ✅ Vidí detail uchádzača len pre VK, kde je členom komisie
- ✅ Len čítanie (nemôže upraviť)
- ✅ Môže hodnotiť (v sekcii Hodnotenie)

### Superadmin
- ✅ Vidí detail všetkých uchádzačov
- ✅ Plný prístup k všetkému

---

## API Endpoints

### 1. Get Candidate Detail
```
GET /api/candidates/:id
```

**Response 200:**
```json
{
  "id": "cand_123",
  "firstName": "Peter",
  "lastName": "Novák",
  "email": "peter.novak@example.com",
  "cisIdentifier": "UC001",
  "active": true,
  "createdAt": "2025-03-15T14:23:00Z",
  "note": "Expert v oblasti...",
  "selectionProcedure": {
    "id": "vk_789",
    "identifier": "VK/2025/0001",
    "position": "Analytik dát",
    "status": "TESTOVANIE",
    "institution": {
      "id": "inst_123",
      "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
      "code": "MZVaEZ"
    }
  },
  "testResults": [
    {
      "id": "result_111",
      "test": {
        "id": "test_123",
        "name": "Odborný test",
        "type": "ODBORNY"
      },
      "level": 1,
      "score": 85,
      "maxScore": 100,
      "successRate": 85,
      "passed": true,
      "completedAt": "2025-03-16T10:30:00Z"
    }
  ],
  "documents": [
    {
      "id": "doc_222",
      "type": "CV",
      "name": "CV.pdf",
      "size": 204800,
      "uploadedAt": "2025-03-15T14:30:00Z",
      "path": "/uploads/candidates/cand_123/CV.pdf"
    }
  ],
  "evaluations": [
    {
      "id": "eval_333",
      "member": {
        "id": "member_444",
        "user": {
          "name": "Jozef",
          "surname": "Novák"
        },
        "isChairman": true
      },
      "totalScore": 75,
      "maxScore": 100,
      "successRate": 75,
      "finalized": true,
      "finalizedAt": "2025-03-20T15:00:00Z"
    }
  ]
}
```

**Response 403:**
```json
{
  "error": "Forbidden",
  "message": "Nemáte oprávnenie zobraziť tohto uchádzača"
}
```

**Response 404:**
```json
{
  "error": "Not Found",
  "message": "Uchádzač nebol nájdený"
}
```

---

### 2. Update Candidate
```
PATCH /api/candidates/:id
{
  "firstName": "Peter",
  "lastName": "Novák",
  "email": "peter.novak@example.com",
  "cisIdentifier": "UC001",
  "note": "Expert v oblasti..."
}
```

**Validácia:**
- Meno, Priezvisko - max 100 znakov
- Email - validný formát
- CIS identifikátor - jedinečný v rámci VK, alfanumerický

**Response 200:** (rovnaké ako GET)

**Response 400:**
```json
{
  "error": "Validation Error",
  "message": "CIS identifikátor už existuje v tomto VK"
}
```

---

### 3. Reset Password
```
POST /api/candidates/:id/reset-password
```

**Response 200:**
```json
{
  "temporaryPassword": "NewPass123!"
}
```

---

### 4. Toggle Active
```
PATCH /api/candidates/:id/toggle-active
```

**Response 200:**
```json
{
  "active": false
}
```

---

### 5. Delete Candidate
```
DELETE /api/candidates/:id
```

**Response 204:** (No Content)

---

### 6. Download Document
```
GET /api/documents/:docId/download
```

**Response 200:** (File stream)

---

## OTÁZKY (na neskôr):

1. **Hodnotenie - editácia?**
   - Má komisia upravovať hodnotenie priamo v detaile uchádzača?
   - Alebo samostatná obrazovka pre hodnotenie?

2. **Dokumenty - upload?**
   - Môže admin/gestor nahrať dokumenty za uchádzača?
   - Alebo len uchádzač sám?

3. **Test results - detail?**
   - Má sa zobrazovať detail jednotlivých odpovedí v testoch?
   - Alebo len celkové skóre?

4. **História zmien?**
   - Trackujeme audit log zmien uchádzača?
   - Kto, kedy, čo zmenil?

5. **Viacero VK pre jedného uchádzača?**
   - Môže mať uchádzač (ten istý email) viacero VK?
   - Ak áno, ako sa to zobrazí v detaile?
