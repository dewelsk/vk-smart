# Zoznam výberových konaní (Admin, Gestor, Komisia)

## Prístup
- **Admin**: vidí VK len zo svojich rezortov
- **Gestor**: vidí len VK, kde je priradený ako gestor
- **Komisia**: vidí len VK, kde je členom komisie
- **Superadmin**: vidí všetky VK

## Vstupný bod
- Z **dashboard** → "Výberové konania"
- URL: `/admin/selection-procedures`

---

## Wireframe - Zoznam VK

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Výberové konania                                              │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Zoznam VK (24)                            [+ Nové VK]    │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                           │ │
│ │ [Hľadať VK...                           ] [⟳]            │ │
│ │                                                           │ │
│ │ Rezort: [Všetky] ▼   Status: [Všetky] ▼   Rok: [2025] ▼ │ │
│ │                                                           │ │
│ ├───┬──────────┬───────────────┬─────┬────────┬────┬───────┤ │
│ │ # │ Kód VK   │ Pozícia       │ Rez.│ Status │ Uch│ Akcie │ │
│ ├───┼──────────┼───────────────┼─────┼────────┼────┼───────┤ │
│ │ 1 │VK/25/001 │Analytik dát   │MZV  │Priprava│ 15 │  ⋮    │ │
│ │ 2 │VK/25/002 │Senior program.│MV   │Testov. │ 8  │  ⋮    │ │
│ │ 3 │VK/25/003 │Proj. manažér  │MZ   │Hodnot. │ 12 │  ⋮    │ │
│ │ 4 │VK/24/234 │IT špecialista │MZV  │Dokončené│ 5 │  ⋮    │ │
│ │   │          │               │     │        │    │       │ │
│ └───┴──────────┴───────────────┴─────┴────────┴────┴───────┘ │
│                                                               │
│ Zobrazených 1-20 z 24                 [‹] [1] [2] [›]        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Popis polí a funkcionalít

### 1. Header
- **"Zoznam VK (24)"** - celkový počet VK (podľa filtrov)
- **"+ Nové VK"** - otvorí formulár pre vytvorenie nového VK (Admin, Superadmin)
  - Pre Gestor/Komisia sa nezobrazuje

### 2. Search a Filter

#### A) Hľadať VK
- Fulltext search v poliach: kód VK, pozícia, organizačný útvar
- Realtime (debounce 300ms)

#### B) Rezort
- **Dropdown** s rezortami
- **Všetky** (default) - zobrazí všetky VK (podľa permissions)
- **Superadmin**: vidí filter so všetkými rezortami
- **Admin**: vidí filter len so svojimi rezortami
- **Gestor/Komisia**: filter sa nezobrazuje (nemá zmysel)

#### C) Status
- **Dropdown** so statusmi VK
- **Všetky** (default)
- **Príprava** - PRIPRAVA
- **Čaká na testy** - CAKA_NA_TESTY
- **Testovanie** - TESTOVANIE
- **Hodnotenie** - HODNOTENIE
- **Dokončené** - DOKONCENE
- **Zrušené** - ZRUSENE

#### D) Rok
- **Dropdown** s rokmi
- Dynamicky generované podľa existujúcich VK
- Default: aktuálny rok (2025)
- Možnosti: 2025, 2024, 2023, ...

### 3. Akcie

#### A) ⟳ Refresh
- Obnoví zoznam VK

---

## Tabuľka - Stĺpce

### 1. # (poradové číslo)
- Poradové číslo v rámci aktuálnej stránky pagination

### 2. Kód VK
- Identifikátor VK (napr. `VK/2025/0001`)
- **Kliknuteľné** → detail VK
- Sortovateľné (ASC, DESC)

### 3. Pozícia
- Funkcia / názov pozície
- **Kliknuteľné** → detail VK
- Sortovateľné (A-Z, Z-A)

### 4. Rezort
- Kód rezortu (napr. `MZVaEZ` → zobrazí sa skrátene `MZV`)
- Tooltip pri hover: plný názov rezortu
- Sortovateľné (A-Z, Z-A)

### 5. Status
- Badge so statusom:
  - **Príprava** - šedý
  - **Čaká na testy** - žltý
  - **Testovanie** - modrý
  - **Hodnotenie** - oranžový
  - **Dokončené** - zelený
  - **Zrušené** - červený
- Sortovateľné (podľa statusu)

### 6. Uchádzači (Uch)
- Počet uchádzačov v tomto VK
- **Kliknuteľné** → zoznam uchádzačov pre toto VK
- Sortovateľné (ASC, DESC)

### 7. Akcie (⋮)
- Dropdown menu s akciami:
  - **Zobraziť detail** → detail VK
  - **Upraviť** → edit VK (len ak status PRIPRAVA)
  - **Zrušiť VK** → zmena statusu na ZRUSENE
  - **Vymazať** → soft delete (len Superadmin/Admin)

---

## API Endpoints

### 1. Get Selection Procedures List
```
GET /api/selection-procedures?page=1&limit=20&search=analytik&institutionId=inst_123&status=PRIPRAVA&year=2025&sortBy=identifier&sortOrder=desc
```

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `search` (string, optional) - fulltext search
- `institutionId` (string, optional) - filter podľa rezortu
- `status` (enum, optional) - filter podľa statusu
- `year` (int, optional) - filter podľa roku
- `sortBy` (enum: "identifier" | "position" | "status" | "candidatesCount", default: "identifier")
- `sortOrder` (enum: "asc" | "desc", default: "desc")

**Response 200:**
```json
{
  "data": [
    {
      "id": "vk_789",
      "identifier": "VK/2025/0001",
      "position": "Analytik dát",
      "organizationalUnit": "Odbor implementácie OKP",
      "institutionId": "inst_123",
      "institution": {
        "id": "inst_123",
        "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
        "code": "MZVaEZ"
      },
      "status": "PRIPRAVA",
      "numberOfPositions": 1,
      "candidatesCount": 15,
      "gestorId": "user_456",
      "gestor": {
        "id": "user_456",
        "name": "Jozef",
        "surname": "Novák"
      },
      "createdAt": "2025-03-15T14:23:00Z",
      "updatedAt": "2025-03-15T14:23:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 24,
    "totalPages": 2
  }
}
```

---

## Akcie - Detailný popis

### A) Zobraziť detail
- Redirect → `/admin/selection-procedures/:id`

### B) Upraviť
- Zobrazuje sa len ak `status === "PRIPRAVA"`
- Redirect → `/admin/selection-procedures/:id/edit`

**Validácia:**
- Len Admin/Superadmin môžu upraviť
- Len ak status je PRIPRAVA

### C) Zrušiť VK

**Confirmation modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Zrušiť výberové konanie?                           │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ VK VK/2025/0001 bude zrušené.                      │    │
│   │                                                     │    │
│   │ Uchádzači budú notifikovaní o zrušení.             │    │
│   │                                                     │    │
│   │ Táto akcia je nevratná.                            │    │
│   │                                                     │    │
│   │                    [Späť]  [Zrušiť VK]             │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
PATCH /api/selection-procedures/:id/cancel
```

**Backend:**
- Zmení status na `ZRUSENE`
- Odošle notifikáciu uchádzačom (email)
- Vytvorí audit log

**Success:**
- ✓ "Výberové konanie zrušené"
- Refresh zoznamu

---

### D) Vymazať

**Confirmation modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Vymazať výberové konanie?                          │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                     │    │
│   │ VK VK/2025/0001 bude trvale vymazané.              │    │
│   │                                                     │    │
│   │ Všetci uchádzači a dáta budú vymazané.            │    │
│   │                                                     │    │
│   │ Táto akcia je nevratná.                            │    │
│   │                                                     │    │
│   │                    [Späť]  [Vymazať]               │    │
│   │                                                     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
DELETE /api/selection-procedures/:id
```

**Backend:**
- Soft delete: označí VK ako vymazané
- Soft delete všetkých uchádzačov
- Vytvorí audit log

**Validácia:**
- Len Superadmin/Admin
- Len ak status je PRIPRAVA (alebo ZRUSENE?)

**Success:**
- ✓ "Výberové konanie vymazané"
- Refresh zoznamu

---

## Pagination
- Default: 20 záznamov na stránku
- Možnosti: 20, 50, 100
- Navigation: [‹] [1] [2] [3] ... [›]

---

## Empty state

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                  📋                                           │
│                                                               │
│           Žiadne výberové konania                             │
│                                                               │
│   Začnite vytvorením nového výberového konania.              │
│                                                               │
│                  [+ Nové VK]                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Permissions

### Admin
- ✅ Vidí VK len zo svojich rezortov
- ✅ Môže vytvoriť, upraviť, zrušiť, vymazať VK

### Gestor
- ✅ Vidí len VK, kde je priradený ako gestor
- ❌ Nemôže vytvoriť VK
- ✅ Môže upraviť VK (len niektoré polia?)
- ❌ Nemôže zrušiť/vymazať VK

### Komisia
- ✅ Vidí len VK, kde je členom komisie
- ❌ Nemôže vytvoriť, upraviť, zrušiť, vymazať VK
- ✅ Len čítanie

### Superadmin
- ✅ Vidí všetky VK
- ✅ Môže vytvoriť, upraviť, zrušiť, vymazať VK

---

## OTÁZKY (na neskôr):

1. **Gestor môže upraviť VK?**
   - Ktoré polia môže gestor upraviť?
   - Alebo len Admin môže upraviť VK?

2. **Vymazať VK - kedy?**
   - Len ak status je PRIPRAVA?
   - Alebo aj pri iných statusoch?

3. **Zrušiť VK - kedy?**
   - Len ak status nie je DOKONCENE/ZRUSENE?
   - Môže sa zrušiť aj VK v stave TESTOVANIE/HODNOTENIE?

4. **Notifikácie pri zrušení VK?**
   - Má sa odoslať email uchádzačom pri zrušení?
   - Má sa odoslať email gestorom/komisii?

5. **Dashboard?**
   - Má byť dashboard s prehľadom VK?
   - Alebo priamo zoznam VK?
