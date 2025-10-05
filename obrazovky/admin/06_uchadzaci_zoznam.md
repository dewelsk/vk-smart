# Zoznam uchádzačov (Admin, Gestor, Komisia)

## Kontext
- Zoznam uchádzačov **v kontexte konkrétneho VK**
- Každé VK má svoj vlastný zoznam uchádzačov

## Prístup
- **Admin**: vidí uchádzačov len pre VK vo svojich rezortoch
- **Gestor, Komisia**: vidí uchádzačov len pre VK, kde sú priradení

## Vstupný bod
- Z **detailu VK** → sekcia/tab **"Uchádzači"**
- URL: `/admin/selection-procedures/:spId/candidates`

---

## Wireframe - Zoznam uchádzačov (v rámci VK)

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na detail VK                                           │
│                                                               │
│ VK-2025-001: Analytik dát                                     │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Uchádzači (15)                        [+ Pridať uchádzača]│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                           │ │
│ │ [Hľadať...                          ] [⟳] [CSV Import]   │ │
│ │                                                           │ │
│ │ Filter: [Všetci] ▼   Status: [Všetky] ▼                  │ │
│ │                                                           │ │
│ ├───┬───────────────┬────────────────┬─────────┬──────┬────┤ │
│ │ # │ Meno          │ Email          │ CIS ID  │ St.  │ Ak.│ │
│ ├───┼───────────────┼────────────────┼─────────┼──────┼────┤ │
│ │ 1 │ Peter Novák   │ peter@ex.com   │ UC001   │ Akt. │ ⋮  │ │
│ │ 2 │ Mária Kováč   │ maria@ex.com   │ UC002   │ Neakt│ ⋮  │ │
│ │ 3 │ Ján Horák     │ jan@ex.com     │ UC003   │ Akt. │ ⋮  │ │
│ │   │               │                │         │      │    │ │
│ └───┴───────────────┴────────────────┴─────────┴──────┴────┘ │
│                                                               │
│ Zobrazených 1-15 z 15                    [‹] [1] [›]         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Popis polí a funkcionalít

### 1. Header
- **"Uchádzači (15)"** - počet uchádzačov v tomto VK
- **"+ Pridať uchádzača"** - otvorí modal pre vytvorenie nového uchádzača (z `05_uchadzaci_vytvorenie.md`)

### 2. Search a Filter

#### A) Hľadať
- Fulltext search v poliach: meno, priezvisko, email, CIS identifikátor
- Realtime (debounce 300ms)

#### B) Filter
- **Všetci** (default)
- ❓ Iné filtre? (napr. podľa statusu hodnotenia?)

#### C) Status
- **Všetky** (default)
- **Aktívni** - active=true
- **Neaktívni** - active=false

### 3. Akcie

#### A) ⟳ Refresh
- Obnoví zoznam uchádzačov

#### B) CSV Import
- Otvorí modal pre hromadný import uchádzačov (z `07_uchadzaci_csv_import.md`)

---

## Tabuľka - Stĺpce

### 1. # (poradové číslo)
- Poradové číslo v rámci aktuálnej stránky pagination

### 2. Meno
- Meno a priezvisko uchádzača
- Kliknuteľné → detail uchádzača
- Sortovateľné (A-Z, Z-A)

### 3. Email
- Emailová adresa uchádzača
- Sortovateľné (A-Z, Z-A)

### 4. CIS ID
- CIS identifikátor (prihlasovacie meno)
- Sortovateľné (A-Z, Z-A)
- **Kliknuteľné → skopíruje do clipboard**

### 5. Status
- **Akt.** (Aktívny) - zelený badge
- **Neakt.** (Neaktívny) - šedý badge
- Sortovateľné (aktívni → neaktívni)

### 6. Akcie (⋮)
- Dropdown menu s akciami:
  - **Upraviť** → otvorí modal pre úpravu uchádzača
  - **Reset hesla** → vygeneruje nové heslo a zobrazí ho
  - **Deaktivovať / Aktivovať** → toggle aktívneho statusu
  - **Vymazať** → soft delete

---

## API Endpoints

### 1. Get Candidates List
```
GET /api/selection-procedures/:spId/candidates?page=1&limit=20&search=peter&status=active
```

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `search` (string, optional) - fulltext search
- `status` (enum: "active" | "inactive" | "all", default: "all")
- `sortBy` (enum: "name" | "email" | "cisIdentifier" | "status", default: "name")
- `sortOrder` (enum: "asc" | "desc", default: "asc")

**Response 200:**
```json
{
  "data": [
    {
      "id": "cand_123",
      "firstName": "Peter",
      "lastName": "Novák",
      "email": "peter.novak@example.com",
      "cisIdentifier": "UC001",
      "active": true,
      "createdAt": "2025-03-15T14:23:00Z",
      "note": "Interná poznámka..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

## Akcie - Detailný popis

### A) Upraviť uchádzača

**Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Upraviť uchádzača                                  │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Meno *                                              │    │
│   │ [Peter...........................................] │    │
│   │                                                     │    │
│   │ Priezvisko *                                        │    │
│   │ [Novák...........................................] │    │
│   │                                                     │    │
│   │ Email *                                             │    │
│   │ [peter.novak@example.com........................] │    │
│   │                                                     │    │
│   │ CIS identifikátor *                                 │    │
│   │ [UC001...........................................] │    │
│   │ (i) Musí byť jedinečný v rámci tohto VK            │    │
│   │                                                     │    │
│   │ Poznámka                                            │    │
│   │ [................................................] │    │
│   │ [................................................] │    │
│   │                                                     │    │
│   │                    [Zrušiť]  [Uložiť]              │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
PATCH /api/candidates/:id
{
  "firstName": "Peter",
  "lastName": "Novák",
  "email": "peter.novak@example.com",
  "cisIdentifier": "UC001",
  "note": "Poznámka..."
}
```

**Success:**
- ✓ "Uchádzač úspešne aktualizovaný"
- Refresh zoznamu

---

### B) Reset hesla

**Confirmation modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Resetovať heslo?                                   │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Nové heslo bude vygenerované pre uchádzača        │    │
│   │ Peter Novák.                                        │    │
│   │                                                     │    │
│   │ Staré heslo prestane fungovať.                     │    │
│   │                                                     │    │
│   │                    [Zrušiť]  [Resetovať]           │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
POST /api/candidates/:id/reset-password
```

**Response 200:**
```json
{
  "temporaryPassword": "NewPass123!"
}
```

**Success modal:**
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
│   │ │ VK kód: VK-2025-001                            │ │    │
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

**Confirmation modal (deaktivovať):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Deaktivovať uchádzača?                             │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Uchádzač Peter Novák sa nebude môcť prihlásiť     │    │
│   │ do systému.                                         │    │
│   │                                                     │    │
│   │ Môžete ho neskôr aktivovať.                        │    │
│   │                                                     │    │
│   │                    [Zrušiť]  [Deaktivovať]         │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
PATCH /api/candidates/:id/toggle-active
```

**Success:**
- ✓ "Uchádzač deaktivovaný"
- ✓ "Uchádzač aktivovaný"

---

### D) Vymazať

**Confirmation modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Vymazať uchádzača?                                 │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ Uchádzač Peter Novák bude trvale vymazaný         │    │
│   │ zo systému.                                         │    │
│   │                                                     │    │
│   │ Táto akcia je nevratná.                            │    │
│   │                                                     │    │
│   │                    [Zrušiť]  [Vymazať]             │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
DELETE /api/candidates/:id
```

**Backend:**
- Soft delete: `deleted=true`, `email=NULL`, `deletedEmail=email`

**Success:**
- ✓ "Uchádzač vymazaný"
- Refresh zoznamu (vymazaný uchádzač sa odstráni)

---

## Pagination
- Default: 20 záznamov na stránku
- Možnosti: 20, 50, 100
- Navigation: [‹] [1] [2] [3] ... [›]

---

## Permissions

### Admin
- ✅ Vidí uchádzačov len pre VK vo svojich rezortoch
- ✅ Môže upraviť, resetovať heslo, deaktivovať, vymazať

### Gestor, Komisia
- ✅ Vidí uchádzačov len pre VK, kde sú priradení
- ✅ Môže upraviť, resetovať heslo, deaktivovať, vymazať

### Superadmin
- ✅ Vidí uchádzačov pre všetky VK
- ✅ Môže upraviť, resetovať heslo, deaktivovať, vymazať

---

## OTÁZKY (na neskôr):

1. **Globálny zoznam všetkých uchádzačov?**
   - Chceme samostatnú obrazovku pre všetkých uchádzačov naprieč všetkými VK?
   - Alebo len v kontexte konkrétneho VK?

2. **Detail uchádzača?**
   - Má byť samostatný detail uchádzača?
   - Alebo len modal pre úpravu?

3. **Export uchádzačov?**
   - Export do CSV/Excel?

4. **Filtrovanie podľa statusu hodnotenia?**
   - Filter: Prešli, Neprešli, Čaká na vyhodnotenie?
   - Alebo to bude v inej časti aplikácie (hodnotenie)?
