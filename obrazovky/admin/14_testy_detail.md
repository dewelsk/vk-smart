# Obrazovka: Detail testu (SUPERADMIN/ADMIN/GESTOR)

## URL
`/tests/:id`

## Účel
Zobrazuje detailné informácie o teste z **poolу hotových testov**, vrátane otázok, štatistík, zoznamu VK kde je test použitý, a možností úpravy a **duplikácie**.

## Prístup
- **SUPERADMIN** - vidí všetky testy, môže upravovať a schvaľovať
- **ADMIN** - vidí len svoje vlastné testy (kde authorId = userId), môže upravovať neschválené
- **GESTOR** - vidí len svoje vlastné testy (kde authorId = userId), môže upravovať neschválené
- **Autor testu** - môže upravovať vlastné neschválené testy, schválené môže len duplikovať

## UI Komponenty

### Breadcrumbs
`Dashboard > Testy > [Názov testu]`

### Header
```
┌─────────────────────────────────────────────────────────────┐
│  ← Späť na zoznam                                    [Upraviť] [•••] │
│                                                                     │
│  📝 Test odborných vedomostí T20                               │
│  Odborný test | ✅ Schválený                                   │
│                                                                     │
│  Vytvoril: Ján Novák | 1. 10. 2024                              │
│  Naposledy upravené: 5. 10. 2024                                 │
└─────────────────────────────────────────────────────────────┘
```

**Akcie v dropdown (•••):**
- Duplikovať test
- Exportovať (PDF/Excel)
- Priradiť k VK
- Schváliť test (len SUPERADMIN, ak neschválený)
- Zamietnuť test (len SUPERADMIN)
- Archivovaťzmazať (len SUPERADMIN)

### Taby
1. **Prehľad** (aktívny defaultne)
2. **Otázky** (20 otázok)
3. **Štatistiky** (ak má test výsledky)
4. **VK** (zoznam VK, kde je test priradený)
5. **História** (audit log zmien)

---

## Tab: Prehľad

### Základné informácie
```
┌─────────────────────────────────────────┐
│  📋 Základné informácie                 │
│                                         │
│  Názov:                                 │
│  Test odborných vedomostí T20          │
│                                         │
│  Typ testu:                            │
│  🟣 Odborný                            │
│                                         │
│  Popis:                                │
│  Test zameraný na overenie odborných    │
│  vedomostí uchádzačov v oblasti...      │
│                                         │
│  Autor:                                │
│  Ján Novák (jan.novak@example.com)      │
└─────────────────────────────────────────┘
```

### Odporúčané nastavenia
```
┌─────────────────────────────────────────┐
│  ⚙️ Odporúčané nastavenia               │
│                                         │
│  Počet otázok:        20                │
│  Trvanie testu:       45 minút          │
│  Úspešnosť:           80%               │
│  Bodovanie:           20 bodov (max)    │
└─────────────────────────────────────────┘
```

### Štatistiky použitia
```
┌─────────────────────────────────────────┐
│  📊 Štatistiky                          │
│                                         │
│  Počet VK:            5                 │
│  Počet uchádzačov:    47                │
│  Priemerná úspešnosť: 73.5%             │
│  Najvyššie skóre:     95%               │
│  Najnižšie skóre:     45%               │
└─────────────────────────────────────────┘
```

---

## Tab: Otázky

### Filter otázok
- Všetky otázky
- Jednovýberové
- Viacvýberové
- Otvorené
- True/False

### Zoznam otázok

```
┌─────────────────────────────────────────────────────────┐
│  Otázka 1                                      [Upraviť] │
│                                                         │
│  Typ: Jednovýberová | Bodov: 1                         │
│                                                         │
│  Ktorý z nasledujúcich zákonov upravuje štátnu službu?  │
│                                                         │
│  ○ Zákon č. 55/2017 Z. z. ✓ (správna odpoveď)          │
│  ○ Zákon č. 311/2001 Z. z.                             │
│  ○ Zákon č. 300/2005 Z. z.                             │
│  ○ Zákon č. 552/2003 Z. z.                             │
│                                                         │
│  Vysvetlenie: Zákon č. 55/2017 Z. z. o štátnej službe... │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Otázka 2                                      [Upraviť] │
│                                                         │
│  Typ: Viacvýberová | Bodov: 2                          │
│                                                         │
│  Vyberte všetky druhy výberových konaní:               │
│                                                         │
│  ☑ Všeobecné výberové konanie ✓                        │
│  ☑ Zjednodušené výberové konanie ✓                     │
│  ☐ Mimoriadne výberové konanie                         │
│  ☑ Interné výberové konanie ✓                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Otázka 3                                      [Upraviť] │
│                                                         │
│  Typ: Otvorená | Bodov: 3                              │
│                                                         │
│  Popíšte hlavné rozdiely medzi všeobecným a            │
│  zjednodušeným výberovým konaním.                      │
│                                                         │
│  Vzorová odpoveď:                                      │
│  Všeobecné VK zahŕňa všetky fázy vrátane...            │
│                                                         │
│  Kľúčové slová (pre automatické hodnotenie):           │
│  • všeobecné, zjednodušené, komisia, test              │
└─────────────────────────────────────────────────────────┘
```

**Akcie:**
- [+ Pridať otázku] - modal s formulárom
- Drag & drop pre zmenu poradia
- Bulk akcie: Zmazať vybrané, Exportovať vybrané

---

## Tab: Štatistiky

### Prehľad výsledkov
```
┌─────────────────────────────────────────────────────────┐
│  📈 Celková úspešnosť                                   │
│                                                         │
│  ████████████████░░░░ 73.5%                             │
│                                                         │
│  Počet absolvovaní: 47                                 │
│  Úspešných: 35 (74.5%)                                 │
│  Neúspešných: 12 (25.5%)                               │
└─────────────────────────────────────────────────────────┘
```

### Graf úspešnosti v čase
```
┌─────────────────────────────────────────────────────────┐
│  📊 Vývoj úspešnosti                                    │
│                                                         │
│  [Line chart - úspešnosť v čase]                        │
│                                                         │
│  X os: dátum                                           │
│  Y os: % úspešnosť                                     │
└─────────────────────────────────────────────────────────┘
```

### Najťažšie otázky
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Najťažšie otázky (najnižšia úspešnosť)              │
│                                                         │
│  1. Otázka 15: 45% úspešnosť                           │
│     "Ktorý orgán schvaľuje..."                          │
│                                                         │
│  2. Otázka 8: 52% úspešnosť                            │
│     "Aký je rozdiel medzi..."                           │
│                                                         │
│  3. Otázka 3: 61% úspešnosť                            │
│     "Popíšte proces..."                                 │
└─────────────────────────────────────────────────────────┘
```

### Rozdelenie výsledkov
```
┌─────────────────────────────────────────────────────────┐
│  📊 Rozdelenie výsledkov                                │
│                                                         │
│  90-100%: ███████░░░░░░░░░░░░░░░  8 uchádzačov        │
│  80-89%:  ████████████░░░░░░░░░░ 15 uchádzačov        │
│  70-79%:  ██████████░░░░░░░░░░░░ 12 uchádzačov        │
│  60-69%:  ████░░░░░░░░░░░░░░░░░░  5 uchádzačov        │
│  0-59%:   ██████░░░░░░░░░░░░░░░░  7 uchádzačov        │
└─────────────────────────────────────────────────────────┘
```

---

## Tab: VK (Výberové konania)

Zoznam VK, kde je test priradený

| VK ID | Pozícia | Rezort | Stav | Uchádzači | Priem. úspešnosť | Akcie |
|-------|---------|--------|------|-----------|------------------|-------|
| VK-2024-001 | Špecialista IT | MF SR | TESTOVANIE | 12 | 75.5% | Zobraziť |
| VK-2024-015 | Analytik | MV SR | DOKONCENE | 8 | 81.2% | Zobraziť |

**Stĺpce:**
- VK ID - klikateľný link na detail VK
- Pozícia
- Rezort
- Stav VK
- Počet uchádzačov, ktorí test absolvovali
- Priemerná úspešnosť
- Akcie - Zobraziť detail VK

---

## Tab: História

Audit log všetkých zmien

| Dátum | Používateľ | Akcia | Detail |
|-------|------------|-------|--------|
| 5.10.2024 10:15 | Admin SUPERADMIN | Schválil test | - |
| 5.10.2024 09:30 | Ján Novák | Upravil otázku 5 | Zmenené možnosti odpovede |
| 1.10.2024 14:20 | Ján Novák | Vytvoril test | - |

---

## API Endpointy

### GET /api/admin/tests/:id
Získa detail testu

**Response:**
```json
{
  "test": {
    "id": "clxx...",
    "name": "Test odborných vedomostí T20",
    "type": "ODBORNY",
    "description": "Test zameraný na...",
    "questions": [
      {
        "id": "q1",
        "type": "SINGLE_CHOICE",
        "text": "Ktorý z nasledujúcich zákonov...",
        "points": 1,
        "options": [
          { "id": "opt1", "text": "Zákon č. 55/2017 Z. z.", "isCorrect": true },
          { "id": "opt2", "text": "Zákon č. 311/2001 Z. z.", "isCorrect": false }
        ],
        "explanation": "Zákon č. 55/2017 Z. z. o štátnej službe..."
      }
    ],
    "recommendedQuestionCount": 20,
    "recommendedDuration": 45,
    "recommendedScore": 80.0,
    "approved": true,
    "approvedAt": "2024-10-05T10:00:00Z",
    "author": {
      "id": "clxx...",
      "name": "Ján",
      "surname": "Novák",
      "email": "jan.novak@example.com"
    },
    "createdAt": "2024-10-01T08:00:00Z",
    "updatedAt": "2024-10-05T10:00:00Z",
    "statistics": {
      "totalAttempts": 47,
      "averageScore": 73.5,
      "passRate": 74.5,
      "vkCount": 5
    }
  }
}
```

### PUT /api/admin/tests/:id
Aktualizuje test

### POST /api/admin/tests/:id/approve
Schváli test (len SUPERADMIN)

### POST /api/admin/tests/:id/duplicate
Vytvorí kópiu testu

### GET /api/admin/tests/:id/statistics
Získa štatistiky testu

### GET /api/admin/tests/:id/vks
Získa zoznam VK s týmto testom

### GET /api/admin/tests/:id/history
Získa audit log testu

---

## Typy otázok

### 1. Jednovýberová (SINGLE_CHOICE)
- Jedna správna odpoveď
- Radio buttons
- Automatické hodnotenie: 0 alebo plný počet bodov

### 2. Viacvýberová (MULTIPLE_CHOICE)
- Viacero správnych odpovedí
- Checkboxes
- Automatické hodnotenie: proporcionálne body (napr. 2/3 správne = 66% bodov)

### 3. Pravda/Nepravda (TRUE_FALSE)
- Binárna otázka
- Toggle switch
- Automatické hodnotenie: 0 alebo plný počet bodov

### 4. Otvorená (OPEN_ENDED)
- Textová odpoveď
- Textarea
- Manuálne hodnotenie komisiou
- Môže obsahovať vzorovou odpoveď a kľúčové slová

### 5. Priraďovacia (MATCHING)
- Priradenie párov
- Drag & drop
- Automatické hodnotenie

---

## Validácie

- **Úprava testu:**
  - Autor môže upravovať len neschválené testy
  - SUPERADMIN môže upravovať všetky testy
  - Nie je možné upravovať test priradený k aktívnemu VK

- **Schválenie testu:**
  - Len SUPERADMIN
  - Test musí mať min. 5 otázok
  - Všetky otázky musia mať správne odpovede

- **Mazanie testu:**
  - Len SUPERADMIN
  - Nie je možné zmazať test s výsledkami
  - Nie je možné zmazať test priradený k VK

---

## Toast notifikácie

- ✅ "Test bol úspešne aktualizovaný"
- ✅ "Test bol úspešne schválený"
- ✅ "Test bol úspešne duplikovaný"
- ✅ "Otázka bola pridaná"
- ❌ "Nie je možné upravovať schválený test"
- ❌ "Test musí mať min. 5 otázok na schválenie"

---

## Interakcie

1. **[Upraviť]** → presmerovanie na `/tests/:id/edit`
2. **[Duplikovať test]** → vytvorí kópiu s prefixom "Kópia - "
3. **[Schváliť test]** → ConfirmModal + API volanie
4. **[Pridať otázku]** → Modal s formulárom
5. **Klik na otázku** → rozbalí detail/editor otázky
6. **Drag & drop otázok** → zmení poradie + API update
7. **Tab prepínanie** → načíta data pre daný tab (lazy loading)

---

## Technické poznámky

- Questions uložené ako JSON v DB
- Real-time štatistiky (cache 5 min)
- Export PDF generovaný na backend (Puppeteer/PDFKit)
- Drag & drop pomocou DnD Kit
- Audit log cez Prisma middleware
- Optimistic UI pre rýchle úpravy

---

## Budúce rozšírenia (v2)

- AI asistent na generovanie otázok
- Import otázok z Word/PDF
- Obrázky v otázkach
- Video/audio otázky
- Adaptívne testovanie (IRT)
- Časový limit na otázku
- Randomizácia otázok a odpovedí
- Test preview pre uchádzačov
