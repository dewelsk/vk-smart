# Detail výberového konania (Admin, Gestor, Komisia)

## Prístup
- **Admin**: vidí detail VK zo svojich rezortov
- **Gestor**: vidí detail VK, kde je priradený
- **Komisia**: vidí detail VK, kde je členom komisie
- **Superadmin**: vidí detail všetkých VK

## Vstupný bod
- Zo **zoznamu VK** → klik na VK
- URL: `/admin/selection-procedures/:id`

---

## Wireframe - Detail VK (Tab-based)

```
┌─────────────────────────────────────────────────────────────┐
│ VK Smart                                    [Jozef N.] [▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ← Späť na zoznam                                              │
│                                                               │
│ VK/2025/0001: Analytik dát                      [Priprava]   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [Prehľad] [Uchádzači] [Testy] [Komisia] [Dokumenty]   │   │
│ ├───────────────────────────────────────────────────────┤   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────┐   │   │
│ │ │ Základné informácie                             │   │   │
│ │ ├────────────────────────────────────────────────┤   │   │
│ │ │                                                 │   │   │
│ │ │ Identifikátor: VK/2025/0001                    │   │   │
│ │ │ Rezort: Ministerstvo zahraničných vecí (MZVaEZ)│   │   │
│ │ │ Pozícia: Analytik dát                          │   │   │
│ │ │ Druh konania: širšie vnútorné výberové konanie│   │   │
│ │ │ Org. útvar: Odbor implementácie OKP            │   │   │
│ │ │ Odbor ŠS: 1.03 – Medzinárodná spolupráca      │   │   │
│ │ │ Funkcia: hlavný štátny radca                   │   │   │
│ │ │ Druh ŠS: stála štátna služba                   │   │   │
│ │ │ Dátum: 24.07.2025                              │   │   │
│ │ │ Počet miest: 1                                 │   │   │
│ │ │ Status: Príprava                                │   │   │
│ │ │ Vytvoril: Jozef Novák (15.03.2025)            │   │   │
│ │ │                                                 │   │   │
│ │ └────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────┐   │   │
│ │ │ Priradení ľudia                                │   │   │
│ │ ├────────────────────────────────────────────────┤   │   │
│ │ │                                                 │   │   │
│ │ │ Gestor: Jozef Novák (jozef.novak@mirri.gov.sk)│   │   │
│ │ │         [Zmeniť]                                │   │   │
│ │ │                                                 │   │   │
│ │ │ Komisia: 5 členov → [Zobraziť] (tab Komisia)  │   │   │
│ │ │                                                 │   │   │
│ │ └────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │ ┌────────────────────────────────────────────────┐   │   │
│ │ │ Štatistiky                                      │   │   │
│ │ ├────────────────────────────────────────────────┤   │   │
│ │ │                                                 │   │   │
│ │ │ Uchádzači: 15                                  │   │   │
│ │ │ Testy: 3 (Odborný, Všeobecný, IT zručnosti)   │   │   │
│ │ │ Testovanie dokončilo: 12 / 15 (80%)            │   │   │
│ │ │ Hodnotenie dokončilo: 0 / 15 (0%)              │   │   │
│ │ │                                                 │   │   │
│ │ └────────────────────────────────────────────────┘   │   │
│ │                                                        │   │
│ │                                                        │   │
│ │ [Upraviť VK] [Zrušiť VK] [Vymazať VK]                 │   │
│ │                                                        │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Prehľad

### Zobrazuje:
1. **Základné informácie** (read-only)
   - Identifikátor
   - Rezort
   - Pozícia
   - Druh konania
   - Organizačný útvar
   - Odbor štátnej služby
   - Funkcia
   - Druh štátnej služby
   - Dátum konania
   - Počet miest
   - Status (badge)
   - Kto vytvoril + kedy

2. **Priradení ľudia**
   - Gestor (s možnosťou zmeniť)
   - Komisia (počet členov + link na tab Komisia)

3. **Štatistiky**
   - Počet uchádzačov
   - Počet priradených testov
   - Progress testovanie (koľko uchádzačov dokončilo)
   - Progress hodnotenie (koľko uchádzačov má finalizované hodnotenie)

### Akcie:
- **Upraviť VK** - otvorí edit formulár (len ak status PRIPRAVA)
- **Zrušiť VK** - zmení status na ZRUSENE
- **Vymazať VK** - soft delete (len Superadmin/Admin)

---

## Tab 2: Uchádzači

### Wireframe:

```
┌─────────────────────────────────────────────────────────────┐
│ [Prehľad] [Uchádzači] [Testy] [Komisia] [Dokumenty]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Uchádzači (15)               [+ Pridať] [CSV Import]         │
│                                                               │
│ [Hľadať...]                                         [⟳]      │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ # │ Meno          │ Email          │ CIS ID  │ Status  │ │ │
│ ├───┼───────────────┼────────────────┼─────────┼─────────┤ │ │
│ │ 1 │ Peter Novák   │ peter@ex.com   │ UC001   │ Aktívny │ │ │
│ │ 2 │ Mária Kováč   │ maria@ex.com   │ UC002   │ Aktívny │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Zobrazených 1-15 z 15                    [‹] [1] [›]         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Odkaz:** Viď `06_uchadzaci_zoznam.md` pre kompletný popis

**Funkcionality:**
- Zoznam uchádzačov (tabuľka)
- Pridať uchádzača (modal)
- CSV Import (modal)
- Search, filter, pagination
- Akcie: Upraviť, Reset hesla, Deaktivovať, Vymazať

---

## Tab 3: Testy

### Wireframe:

```
┌─────────────────────────────────────────────────────────────┐
│ [Prehľad] [Uchádzači] [Testy] [Komisia] [Dokumenty]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Priradené testy (3)                         [+ Pridať test]  │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Level 1: Odborný test                                   │ │
│ │ ├───────────────────────────────────────────────────────┤ │
│ │ │ Počet otázok: 20                                      │ │
│ │ │ Časový limit: 30 minút                                │ │
│ │ │ Body za otázku: 5                                     │ │
│ │ │ Minimálne body: 60                                    │ │
│ │ │                                                        │ │
│ │ │ [Upraviť] [Odstrániť]                                 │ │
│ │ └───────────────────────────────────────────────────────┘ │
│ │                                                           │ │
│ │ Level 2: Všeobecný test                                  │ │
│ │ ├───────────────────────────────────────────────────────┤ │
│ │ │ ...                                                    │ │
│ │ └───────────────────────────────────────────────────────┘ │
│ │                                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Funkcionalities:**
- Zoznam priradených testov (zo `VKTest`)
- Každý test má konfiguráciu:
  - Level (1, 2, 3...)
  - Počet otázok
  - Časový limit
  - Body za otázku
  - Minimálne body
- Pridať test (modal s výberom testu + konfigurácia)
- Upraviť test (modal s konfiguráciou)
- Odstrániť test

**Modal: Pridať test**

```
┌─────────────────────────────────────────────────────────────┐
│ Pridať test do VK                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Test *                                                       │
│ [Vyberte test...]                                       [▼] │
│                                                              │
│ Level *                                                      │
│ [1....]                                                      │
│ (poradie testu - 1, 2, 3...)                                │
│                                                              │
│ Počet otázok *                                               │
│ [20....]                                                     │
│ (odporúčané: 20)                                            │
│                                                              │
│ Časový limit (minúty) *                                      │
│ [30....]                                                     │
│ (odporúčané: 30 minút)                                      │
│                                                              │
│ Body za otázku *                                             │
│ [5....]                                                      │
│                                                              │
│ Minimálne body na úspech *                                   │
│ [60....]                                                     │
│ (napr. 60 bodov z max 100)                                  │
│                                                              │
│                              [Zrušiť]  [Pridať test]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
POST /api/selection-procedures/:spId/tests
{
  "testId": "test_123",
  "level": 1,
  "questionCount": 20,
  "durationMinutes": 30,
  "scorePerQuestion": 5,
  "minScore": 60
}
```

---

## Tab 4: Komisia

### Wireframe:

```
┌─────────────────────────────────────────────────────────────┐
│ [Prehľad] [Uchádzači] [Testy] [Komisia] [Dokumenty]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Výberová komisia (5 členov)               [+ Pridať člena]  │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ # │ Meno          │ Email              │ Predseda │ Akcie│ │
│ ├───┼───────────────┼────────────────────┼──────────┼──────┤ │
│ │ 1 │ Jozef Novák   │ jozef@mirri.gov.sk │ ✓        │  ⋮   │ │
│ │ 2 │ Mária Kováč   │ maria@mirri.gov.sk │          │  ⋮   │ │
│ │ 3 │ Ján Horák     │ jan@mirri.gov.sk   │          │  ⋮   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Funkcionality:**
- Zoznam členov komisie
- Označenie predsedu komisie (✓)
- Pridať člena (modal s výberom používateľa + checkbox "Predseda")
- Odstrániť člena
- Nastaviť ako predsedu

**Modal: Pridať člena komisie**

```
┌─────────────────────────────────────────────────────────────┐
│ Pridať člena komisie                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Člen komisie *                                               │
│ [Vyberte používateľa...]                                [▼] │
│                                                              │
│ ☐ Nastaviť ako predsedu komisie                             │
│                                                              │
│                              [Zrušiť]  [Pridať]             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**API:**
```
POST /api/selection-procedures/:spId/commission/members
{
  "userId": "user_789",
  "isChairman": true
}
```

**Akcie dropdown:**
- **Nastaviť ako predsedu** - toggle isChairman
- **Odstrániť z komisie** - DELETE

---

## Tab 5: Dokumenty

### Wireframe:

```
┌─────────────────────────────────────────────────────────────┐
│ [Prehľad] [Uchádzači] [Testy] [Komisia] [Dokumenty]          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Generované dokumenty                                          │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Typ dokumentu        │ Dátum generovania  │ Akcie       │ │
│ ├──────────────────────┼────────────────────┼─────────────┤ │
│ │ Súmarný hárok        │ 20.03.2025 14:30   │ [⬇ Stiahnuť]│ │
│ │ Záverečné hodnotenie │ 22.03.2025 10:15   │ [⬇ Stiahnuť]│ │
│ │ Zápisnica            │ 25.03.2025 16:45   │ [⬇ Stiahnuť]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ [Generovať súmarný hárok]                                    │
│ [Generovať záverečné hodnotenie]                             │
│ [Generovať zápisnicu]                                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Funkcionality:**
- Zoznam generovaných dokumentov
- Stiahnuť dokument (PDF)
- Generovať nový dokument (tlačidlo)

**API:**
```
POST /api/selection-procedures/:spId/documents/generate
{
  "type": "SUMARNY_HAROK" | "ZAVERECNE_HODNOTENIE" | "ZAPISNICA"
}

Response 200:
{
  "id": "doc_123",
  "type": "SUMARNY_HAROK",
  "path": "/uploads/vk/VK-2025-0001/sumarny-harok.pdf",
  "generatedAt": "2025-03-20T14:30:00Z"
}
```

**Stiahnuť:**
```
GET /api/selection-procedures/:spId/documents/:docId/download
```

---

## API Endpoints

### 1. Get Selection Procedure Detail
```
GET /api/selection-procedures/:id
```

**Response 200:**
```json
{
  "id": "vk_789",
  "identifier": "VK/2025/0001",
  "institutionId": "inst_123",
  "institution": {
    "id": "inst_123",
    "name": "Ministerstvo zahraničných vecí a európskych záležitostí",
    "code": "MZVaEZ"
  },
  "selectionType": "širšie vnútorné výberové konanie",
  "organizationalUnit": "Odbor implementácie OKP",
  "serviceField": "1.03 – Medzinárodná spolupráca",
  "position": "Analytik dát",
  "serviceType": "stála štátna služba",
  "date": "2025-07-24T00:00:00Z",
  "numberOfPositions": 1,
  "status": "PRIPRAVA",
  "gestorId": "user_456",
  "gestor": {
    "id": "user_456",
    "name": "Jozef",
    "surname": "Novák",
    "email": "jozef.novak@mirri.gov.sk"
  },
  "createdById": "user_123",
  "createdBy": {
    "id": "user_123",
    "name": "Admin",
    "surname": "Adminovic"
  },
  "createdAt": "2025-03-15T14:23:00Z",
  "updatedAt": "2025-03-15T14:23:00Z",
  "statistics": {
    "candidatesCount": 15,
    "testsCount": 3,
    "testingCompleted": 12,
    "evaluationCompleted": 0
  },
  "assignedTests": [
    {
      "id": "vktest_111",
      "level": 1,
      "test": {
        "id": "test_123",
        "name": "Odborný test",
        "type": "ODBORNY"
      },
      "questionCount": 20,
      "durationMinutes": 30,
      "scorePerQuestion": 5,
      "minScore": 60
    }
  ],
  "commission": {
    "id": "comm_222",
    "members": [
      {
        "id": "member_333",
        "user": {
          "id": "user_789",
          "name": "Jozef",
          "surname": "Novák",
          "email": "jozef@mirri.gov.sk"
        },
        "isChairman": true
      }
    ]
  }
}
```

---

### 2. Update Selection Procedure
```
PATCH /api/selection-procedures/:id
{
  "position": "Senior analytik dát",
  "numberOfPositions": 2
}
```

**Validácia:**
- Len Admin/Superadmin
- Len ak status PRIPRAVA

---

### 3. Change Gestor
```
PATCH /api/selection-procedures/:id/gestor
{
  "gestorId": "user_999"
}
```

---

### 4. Cancel Selection Procedure
```
PATCH /api/selection-procedures/:id/cancel
```

**Backend:**
- Zmení status na ZRUSENE
- Odošle notifikáciu uchádzačom

---

### 5. Delete Selection Procedure
```
DELETE /api/selection-procedures/:id
```

**Backend:**
- Soft delete VK
- Soft delete všetkých uchádzačov

---

## Permissions

### Admin
- ✅ Vidí detail VK zo svojich rezortov
- ✅ Môže upraviť VK (ak status PRIPRAVA)
- ✅ Môže pridať/upraviť gestora, testy, komisiu, uchádzačov
- ✅ Môže zrušiť/vymazať VK

### Gestor
- ✅ Vidí detail VK, kde je priradený
- ✅ Môže pridať/upraviť uchádzačov, testy
- ❌ Nemôže upraviť základné info VK
- ❌ Nemôže zrušiť/vymazať VK

### Komisia
- ✅ Vidí detail VK, kde je členom komisie
- ✅ Len čítanie (okrem hodnotenia uchádzačov)

### Superadmin
- ✅ Vidí detail všetkých VK
- ✅ Plný prístup k všetkému

---

## OTÁZKY (na neskôr):

1. **Konfigurácia hodnotenia?**
   - Kde sa konfiguruje hodnotenie (batéria otázok, vlastnosti)?
   - Samostatný tab "Hodnotenie"?

2. **Workflow statusov VK?**
   - Kedy sa mení status automaticky?
   - PRIPRAVA → CAKA_NA_TESTY → TESTOVANIE → HODNOTENIE → DOKONCENE
   - Alebo manuálne?

3. **Testovanie - spustenie?**
   - Ako sa spúšťa testovanie?
   - Admin klikne "Spustiť testovanie" a uchádzači dostanú prístup?

4. **Hodnotenie - workflow?**
   - Kedy začína hodnotenie?
   - Po dokončení testovania všetkými uchádzačmi?

5. **Notifikácie?**
   - Kedy sa odosielajú notifikácie uchádzačom?
   - Pri zmene statusu VK?
   - Pri pridaní do VK?
