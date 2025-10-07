# Obrazovka: Zoznam testov (SUPERADMIN/ADMIN/GESTOR)

## URL
`/tests`

## Účel
Zobrazuje **pool hotových testov**, ktoré môžu byť priradené k výberovým konaniam. Testy majú kategórie (napr. anglický jazyk A1, slovenčina A1, odborný test IT). Systém zobrazuje, ktoré VK využívajú jednotlivé testy a umožňuje **duplikovať** existujúce testy pre rýchle vytvorenie nových verzií.

## Prístup
- **SUPERADMIN** - vidí **všetky testy** v systéme
- **ADMIN** - vidí **len svoje vlastné testy** (kde authorId = userId)
- **GESTOR** - vidí **len svoje vlastné testy** (kde authorId = userId)

## UI Komponenty

### Header
- **Nadpis:** "Testy"
- **Tlačidlo:** "+ Vytvoriť test" (primárne, modré)
- **Breadcrumbs:** Dashboard > Testy

### Filtre a vyhľadávanie
- **Vyhľadávač:**
  - Placeholder: "Hľadať test podľa názvu..."
  - Live search (filter po 3 znakoch)

- **Filtre:**
  - **Typ testu** (dropdown):
    - Všetky typy
    - Odborný
    - Všeobecný
    - Štátny jazyk
    - Cudzí jazyk
    - IT zručnosti
    - Schopnosti a vlastnosti

  - **Stav** (dropdown):
    - Všetky
    - Schválené
    - Neschválené
    - Koncept

  - **Autor** (dropdown, len SUPERADMIN):
    - Všetci autori
    - Meno Priezvisko (zoznam)

### Tabuľka testov

| Názov | Typ | Otázky | Trvanie | Úspešnosť | Použitie | Autor | Stav | Akcie |
|-------|-----|--------|---------|-----------|----------|-------|------|-------|
| Test odborných vedomostí T20 | Odborný | 20 otázok | 45 min | 80% | 🟢 5 VK | Ján Novák | ✅ Schválený | •••  |
| Všeobecný test znalostí | Všeobecný | 30 otázok | 60 min | 70% | - | Mária Horváthová | ⏳ Koncept | ••• |
| Test anglického jazyka B2 | Cudzí jazyk | 40 otázok | 90 min | 75% | 🟢 2 VK (1 aktívne) | Peter Kovač | ✅ Schválený | ••• |

**Stĺpce:**
1. **Názov** - názov testu (klikateľný → detail)
2. **Typ** - badge s farbou podľa typu
3. **Otázky** - počet otázok (napr. "20 otázok")
4. **Trvanie** - odporúčaný čas (napr. "45 min")
5. **Úspešnosť** - odporúčaná úspešnosť (napr. "80%")
6. **Použitie** - zobrazuje:
   - Počet VK, ktoré používajú tento test
   - 🟢 ak je test aktívne používaný (priradený k VK v stave TESTOVANIE)
   - 🟡 ak je priradený len k VK v príprave/hodnotení
   - `-` ak test nie je priradený k žiadnemu VK
7. **Autor** - meno a priezvisko autora
8. **Stav** - badge:
   - ✅ Schválený (zelený)
   - ⏳ Koncept (žltý)
   - ❌ Zamietnutý (červený)
9. **Akcie** - dropdown menu:
   - Zobraziť detail
   - Upraviť (len autor alebo SUPERADMIN)
   - **Duplikovať** → vytvorí kópiu testu s prefixom "Kópia - "
   - Priradiť k VK
   - Exportovať (PDF/Excel)
   - Zmazať (len SUPERADMIN, nie je možné ak je priradený k VK)

### Prázdny stav
Ak nie sú žiadne testy:
```
📝 Žiadne testy

Zatiaľ neboli vytvorené žiadne testy.
Vytvorte prvý test kliknutím na tlačidlo vyššie.

[+ Vytvoriť test]
```

### Pagination
- Zobrazovanie: "Zobrazujem 1-10 z 45 testov"
- Items per page: 10, 25, 50, 100
- Pagination controls: << < 1 2 3 4 5 > >>

## Farby badges - Typ testu
- **Odborný** - fialová (#8B5CF6)
- **Všeobecný** - modrá (#3B82F6)
- **Štátny jazyk** - zelená (#10B981)
- **Cudzí jazyk** - oranžová (#F59E0B)
- **IT zručnosti** - tyrkysová (#06B6D4)
- **Schopnosti a vlastnosti** - ružová (#EC4899)

## API Endpointy

### GET /api/admin/tests
Získa zoznam testov

**Query params:**
- `search` - vyhľadávací reťazec
- `type` - typ testu (enum)
- `approved` - true/false/null
- `authorId` - ID autora
- `page` - číslo stránky
- `limit` - počet záznamov na stránku
- `sortBy` - pole na triedenie (name, createdAt, type)
- `sortOrder` - asc/desc

**Response:**
```json
{
  "tests": [
    {
      "id": "clxx...",
      "name": "Test odborných vedomostí T20",
      "type": "ODBORNY",
      "description": "Test zameraný na odbornú oblasť...",
      "questionCount": 20,
      "recommendedDuration": 45,
      "recommendedQuestionCount": 20,
      "recommendedScore": 80.0,
      "approved": true,
      "approvedAt": "2024-10-05T10:00:00Z",
      "author": {
        "id": "clxx...",
        "name": "Ján",
        "surname": "Novák"
      },
      "usage": {
        "totalVKs": 5,
        "activeVKs": 2,
        "hasActiveUsage": true
      },
      "createdAt": "2024-10-01T08:00:00Z",
      "updatedAt": "2024-10-05T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

### POST /api/admin/tests
Vytvorí nový test (presmerovanie na formulár)

### POST /api/admin/tests/:id/duplicate
**Duplikuje existujúci test** - vytvorí kópiu s prefixom "Kópia - " v názve

**Response:**
```json
{
  "success": true,
  "testId": "new-test-id",
  "message": "Test bol úspešne duplikovaný"
}
```

### DELETE /api/admin/tests/:id
Zmaže test (len SUPERADMIN)

**Response:**
```json
{
  "success": true,
  "message": "Test bol úspešne zmazaný"
}
```

## Validácie
- Nie je možné zmazať test, ktorý je priradený k aktívnemu VK
- Len autor testu alebo SUPERADMIN môže upravovať test
- Koncept môže upravovať len autor
- Schválený test nemôže autor upravovať (len SUPERADMIN)

## Toast notifikácie
- ✅ "Test bol úspešne vytvorený"
- ✅ "Test bol úspešne duplikovaný"
- ✅ "Test bol úspešne zmazaný"
- ❌ "Test nemožno zmazať - je priradený k aktívnym VK"
- ❌ "Nemáte oprávnenie upravovať tento test"

## Interakcie
1. **Klik na riadok/názov** → presmerovanie na detail testu
2. **Klik na "+ Vytvoriť test"** → presmerovanie na formulár vytvorenia testu
3. **Zmena filtra** → automatické prefiltrovanie tabuľky
4. **Vyhľadávanie** → live filter po zadaní 3+ znakov
5. **Akcie menu:**
   - Zobraziť detail → `/tests/:id`
   - Upraviť → `/tests/:id/edit` (len autor alebo SUPERADMIN)
   - **Duplikovať** → KĽÚČOVÁ FUNKCIA:
     * Vytvorí kópiu testu s názvom "Kópia - [pôvodný názov]"
     * Skopíruje všetky otázky a nastavenia
     * Nový test je v stave "Koncept" (approved = false)
     * Autor je nastavený na aktuálneho používateľa
     * Presmeruje na edit stránku nového testu
   - Priradiť k VK → modal s výberom VK
   - Exportovať → stiahnutie PDF/Excel
   - Zmazať → ConfirmModal s potvrdením (len SUPERADMIN)

## Technické poznámky
- DataTable komponent s podporou triedenia
- Server-side pagination a filtrovanie
- Optimistic UI updates pre rýchle akcie
- Cache invalidation po CRUD operáciách
- Export používa generovanie PDF/Excel na backend

## Budúce rozšírenia (v2)
- Bulk operácie (hromadné schvaľovanie, mazanie)
- Import testov z Excel/CSV
- Verziovanie testov
- Štatistiky používania testov
- Porovnanie úspešnosti medzi testami
