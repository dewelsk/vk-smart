# Obrazovka: Kategórie testov

## URL
`/tests/categories`

## Účel
Číselník kategórií pre organizáciu testov. Kategórie umožňujú lepšie filtrovanie a triedenie testov podľa úrovne (A1, B2, atď.) alebo špecializácie.

## Prístup
- **SUPERADMIN** - plná správa kategórií
- **ADMIN** - čítanie kategórií
- **GESTOR** - čítanie kategórií

## UI Komponenty

### Header
```
┌─────────────────────────────────────────────────────────┐
│  ← Späť na Testy                          [+ Pridať kategóriu] │
│                                                         │
│  📂 Kategórie testov                                    │
│  Organizácia testov podľa úrovne a špecializácie       │
└─────────────────────────────────────────────────────────┘
```

### Tabuľka kategórií

| Názov | Typ testu | Popis | Počet testov | Akcie |
|-------|-----------|-------|--------------|-------|
| Slovenský jazyk - A1 | Štátny jazyk | Základná úroveň | 5 | ✏️ 🗑️ |
| Slovenský jazyk - B1 | Štátny jazyk | Stredná úroveň | 8 | ✏️ 🗑️ |
| Anglický jazyk - B2 | Cudzí jazyk | Vyššia stredná úroveň | 12 | ✏️ 🗑️ |
| IT - Java Advanced | IT zručnosti | Pokročilé programovanie v Jave | 3 | ✏️ 🗑️ |
| Právo - Základy | Odborný | Základy práva | 6 | ✏️ 🗑️ |

**Stĺpce:**
1. **Názov** - názov kategórie (klikateľný → zoznam testov s filtrom)
2. **Typ testu** - badge (voliteľné, môže byť prázdne)
3. **Popis** - krátky popis kategórie
4. **Počet testov** - koľko testov má túto kategóriu
5. **Akcie**:
   - ✏️ Upraviť
   - 🗑️ Zmazať (len ak nie sú priradené testy)

### Modal - Pridať/Upraviť kategóriu

```
┌─────────────────────────────────────────────────────────┐
│  Pridať kategóriu                                    [✕] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Názov kategórie *                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Slovenský jazyk - A1                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Typ testu (voliteľné)                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ▼ Štátny jazyk                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Popis                                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Základná úroveň slovenského jazyka podľa CEFR A1 │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│                              [Zrušiť]  [Uložiť kategóriu] │
└─────────────────────────────────────────────────────────┘
```

### Prázdny stav

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                        📂                               │
│                                                         │
│           Žiadne kategórie                              │
│                                                         │
│  Zatiaľ neboli vytvorené žiadne kategórie testov.      │
│  Vytvorte prvú kategóriu pre lepšiu organizáciu.       │
│                                                         │
│                [+ Pridať kategóriu]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Integrácia so Zoznamom testov

Po vytvorení kategórií sa v Zozname testov (`/tests`) pridá filter:

```
Filtre:
  [ Vyhľadávanie ]  [ Typ testu ▼ ]  [ Kategória ▼ ]  [ Stav ▼ ]
```

Dropdown Kategória:
```
┌─────────────────────────────┐
│ Všetky kategórie            │
├─────────────────────────────┤
│ Slovenský jazyk - A1        │
│ Slovenský jazyk - B1        │
│ Anglický jazyk - B2         │
│ IT - Java Advanced          │
│ Právo - Základy             │
└─────────────────────────────┘
```

---

## API Endpointy

### GET /api/admin/tests/categories
Získa zoznam kategórií

**Query params:**
- `search` - vyhľadávací reťazec
- `type` - typ testu (filter)
- `page`, `limit` - pagination

**Response:**
```json
{
  "categories": [
    {
      "id": "clxx...",
      "name": "Slovenský jazyk - A1",
      "type": "STATNY_JAZYK",
      "description": "Základná úroveň slovenského jazyka podľa CEFR A1",
      "testCount": 5,
      "createdAt": "2024-10-01T08:00:00Z",
      "updatedAt": "2024-10-05T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

### POST /api/admin/tests/categories
Vytvorí novú kategóriu (len SUPERADMIN)

**Request:**
```json
{
  "name": "Slovenský jazyk - A1",
  "type": "STATNY_JAZYK",
  "description": "Základná úroveň slovenského jazyka podľa CEFR A1"
}
```

### PUT /api/admin/tests/categories/:id
Aktualizuje kategóriu (len SUPERADMIN)

### DELETE /api/admin/tests/categories/:id
Zmaže kategóriu (len SUPERADMIN)

**Validácia:**
- Nie je možné zmazať kategóriu, ktorá má priradené testy

---

## Dátový model

```prisma
model TestCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  type        TestTyp?
  description String?

  tests       Test[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("test_categories")
}

// Aktualizácia Test modelu
model Test {
  // ... existing fields

  categoryId  String?
  category    TestCategory? @relation(fields: [categoryId], references: [id])
}
```

---

## Validácie

- Názov kategórie musí byť unikátny
- Nie je možné zmazať kategóriu s priradenými testami
- Len SUPERADMIN môže spravovať kategórie
- Ostatní môžu len čítať a filtrovať

---

## Toast notifikácie

- ✅ "Kategória bola úspešne vytvorená"
- ✅ "Kategória bola úspešne aktualizovaná"
- ✅ "Kategória bola úspešne zmazaná"
- ❌ "Kategóriu nemožno zmazať - obsahuje testy"
- ❌ "Názov kategórie už existuje"
- ❌ "Nemáte oprávnenie spravovať kategórie"

---

## Príklady kategórií

### Jazykové testy:
- Slovenský jazyk - A1, A2, B1, B2, C1, C2
- Anglický jazyk - A1, A2, B1, B2, C1, C2
- Nemecký jazyk - A1, A2, B1, B2
- Francúzsky jazyk - A1, A2, B1, B2

### IT testy:
- IT - Základy programovania
- IT - Java Beginner
- IT - Java Advanced
- IT - Python Beginner
- IT - Python Advanced
- IT - SQL Databázy
- IT - Web Development

### Odborné testy:
- Právo - Základy
- Právo - Pokročilý
- Ekonomika - Základy
- Ekonomika - Pokročilý
- Účtovníctvo - Základy
- Manažment - Základy

---

## Budúce rozšírenia (v2)

- Import kategórií z CSV/Excel
- Hierarchia kategórií (parent-child)
- Ikony pre kategórie
- Farbové označenie kategórií
- Automatické odporúčanie kategórie podľa názvu testu (AI)
