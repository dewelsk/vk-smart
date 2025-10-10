# Obrazovka: Dashboard uchádzača

**Route:** `/applicant/dashboard`

**Účel:** Prehľad pridelených testov a ich statusov. Prístupový bod pre spustenie/pokračovanie testov.

---

## Požiadavky zo zadania

- Zobrazenie **hlavičky VK** (identifikátor, typ VK, útvar, pozícia, dátum...)
- Zoznam **pridelených testov** (levely 1-6)
- **Postupné levely** - uchádzač môže pristúpiť k level 2 len ak prešiel level 1
- Uchádzač vidí aký test má pred sebou
- Možnosť **začať test** alebo **pokračovať** (ak už začal ale neukončil)
- Zobrazenie výsledkov dokončených testov

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]  Výberové konanie                    [User] [Odhlásiť]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HLAVIČKA VÝBEROVÉHO KONANIA                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Identifikátor: VK/2025/1234                             │   │
│  │ Druh VK: širšie vnútorné výberové konanie               │   │
│  │ Organizačný útvar: odbor implementácie OKP              │   │
│  │ Obsadzovaná funkcia: hlavný štátny radca                │   │
│  │ Dátum VK: 24. júla 2025                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TESTY                                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [CheckIcon] Level 1: Odborný test                       │   │
│  │                                                          │   │
│  │ Status: Dokončený                                        │   │
│  │ Výsledok: 18/20 bodov (90%)                            │   │
│  │ Prešiel: Áno                                            │   │
│  │                                                          │   │
│  │          [Zobraziť výsledok]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [ClockIcon] Level 2: Test cudzieho jazyka (Angličtina) │   │
│  │                                                          │   │
│  │ Status: Prebieha                                         │   │
│  │ Zostávajúci čas: 25:30                                  │   │
│  │ Zodpovedané: 12/30 otázok                               │   │
│  │                                                          │   │
│  │          [Pokračovať v teste]                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [LockIcon] Level 3: Test štátneho jazyka               │   │
│  │                                                          │   │
│  │ Status: Uzamknutý                                        │   │
│  │                                                          │   │
│  │ Tento test sa sprístupní po úspešnom dokončení          │   │
│  │ Level 2: Test cudzieho jazyka                           │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Komponenty

### 1. Hlavička VK (Header Card)

Card s informáciami o VK:
- Identifikátor VK
- Druh výberového konania
- Organizačný útvar
- Odbor štátnej služby
- Obsadzovaná funkcia
- Druh štátnej služby
- Dátum VK

Štýl:
- Border: `border border-gray-200`
- Background: `bg-white`
- Padding: `p-6`
- Rounded: `rounded-lg`
- `data-testid="vk-header"`

### 2. Test Card

Pre každý pridelený test zobrazuje:

**Status badge:**
- Nespustený: šedá (`bg-gray-100 text-gray-800`)
- Prebieha: modrá (`bg-blue-100 text-blue-800`)
- Dokončený (prešiel): zelená (`bg-green-100 text-green-800`)
- Dokončený (neprešiel): červená (`bg-red-100 text-red-800`)
- Uzamknutý: šedá s lock icon (`bg-gray-50 text-gray-500`)

**Ikony:**
- Dokončený: CheckCircleIcon (zelená)
- Prebieha: ClockIcon (modrá)
- Neprešiel: XCircleIcon (červená)
- Uzamknutý: LockClosedIcon (šedá)
- Nespustený: DocumentTextIcon

**Informácie:**
- Level + názov testu
- Status
- Zostávajúci čas (ak prebieha)
- Zodpovedané otázky (ak prebieha)
- Výsledok (ak dokončený): X/Y bodov (%)
- Prešiel/Neprešiel (ak dokončený)

**Tlačidlá:**
- "Začať test" - ak nespustený a nie je uzamknutý (Primary button)
- "Pokračovať v teste" - ak prebieha (Primary button)
- "Zobraziť výsledok" - ak dokončený (Secondary button)
- Disabled (šedý) - ak uzamknutý

`data-testid="test-card-{level}"`

### 3. Locked test explanation

Pre uzamknuté testy:
- Šedý card s lock icon
- Text: "Tento test sa sprístupní po úspešnom dokončení Level X: [názov testu]"
- Žiadne tlačidlo

---

## Funkcionalita

### Načítanie dát

Pri načítaní stránky:
1. GET `/api/applicant/dashboard`
2. Získa:
   - Informácie o VK (hlavička)
   - Zoznam pridelených testov (VKTest + nastavenia)
   - Statusy testov (TestSession pre každý test)
   - Výsledky dokončených testov

### Logic pre levely

**Pravidlá:**
- Level 1 je vždy dostupný (ak nespustený)
- Level N je dostupný len ak Level N-1 bol **úspešne dokončený** (passed=true)
- Ak level N zlyhal (passed=false), ďalšie levely zostávajú uzamknuté
- Uchádzač končí vo VK ak zlyhá na nejakom leveli

**Príklad:**
1. Level 1 (Odborný) - prešiel → Level 2 sa odomkne
2. Level 2 (Cudzí jazyk) - prešiel → Level 3 sa odomkne
3. Level 3 (Štátny jazyk) - zlyhal → Level 4+ zostáva uzamknutý, uchádzač končí

### Real-time update času

Pre testy v stave "Prebieha":
- Zobrazenie zostávajúceho času (countdown)
- Aktualizácia každú sekundu
- Počítané na základe `serverStartTime` + `durationSeconds`
- Ak čas vyprší → redirect na test page (kde sa auto-submit)

### Akcie

**Začať test:**
1. POST `/api/applicant/test/start` (vkTestId)
2. Vytvorí TestSession
3. Redirect na `/applicant/test/[sessionId]`

**Pokračovať v teste:**
1. Redirect na `/applicant/test/[sessionId]` (už existujúca session)

**Zobraziť výsledok:**
1. Redirect na `/applicant/test/[sessionId]/result`

---

## API Endpoint

**GET /api/applicant/dashboard**

Response:
```json
{
  "vk": {
    "identifier": "VK/2025/1234",
    "selectionType": "širšie vnútorné výberové konanie",
    "organizationalUnit": "odbor implementácie OKP",
    "serviceField": "1.03 - Medzinárodná spolupráca",
    "position": "hlavný štátny radca",
    "serviceType": "stála štátna služba",
    "date": "2025-07-24T00:00:00Z"
  },
  "tests": [
    {
      "vkTestId": "clxy...",
      "level": 1,
      "test": {
        "id": "clxz...",
        "name": "Odborný test",
        "type": "ODBORNY"
      },
      "questionCount": 20,
      "durationMinutes": 20,
      "minScore": 12,
      "session": {
        "id": "cls1...",
        "status": "COMPLETED",
        "score": 18,
        "maxScore": 20,
        "passed": true,
        "completedAt": "2025-07-24T10:30:00Z"
      }
    },
    {
      "vkTestId": "clxy...",
      "level": 2,
      "test": {
        "id": "clxz...",
        "name": "Test cudzieho jazyka (Angličtina)",
        "type": "CUDZI_JAZYK"
      },
      "questionCount": 30,
      "durationMinutes": 30,
      "minScore": 9,
      "session": {
        "id": "cls2...",
        "status": "IN_PROGRESS",
        "serverStartTime": "2025-07-24T10:35:00Z",
        "durationSeconds": 1800,
        "answeredQuestions": 12
      }
    },
    {
      "vkTestId": "clxy...",
      "level": 3,
      "test": {
        "id": "clxz...",
        "name": "Test štátneho jazyka",
        "type": "STATNY_JAZYK"
      },
      "questionCount": 5,
      "durationMinutes": 5,
      "minScore": 3,
      "session": null,
      "locked": true,
      "lockedReason": "Dokončite Level 2: Test cudzieho jazyka"
    }
  ]
}
```

---

## Data-testid attributes

- `vk-header` - Card s hlavičkou VK
- `test-card-{level}` - Card pre test (napr. `test-card-1`, `test-card-2`)
- `test-status-badge-{level}` - Status badge
- `test-time-remaining-{level}` - Zostávajúci čas
- `test-progress-{level}` - Zodpovedané otázky
- `test-score-{level}` - Výsledok (body)
- `start-test-button-{level}` - Tlačidlo "Začať test"
- `continue-test-button-{level}` - Tlačidlo "Pokračovať"
- `view-result-button-{level}` - Tlačidlo "Zobraziť výsledok"
- `locked-message-{level}` - Správa o uzamknutom teste

---

## Notes

- **Slovenské skloňovanie:** "1 otázka", "2-4 otázky", "5+ otázok"
- **Časovač synchronizovaný so serverom** (nie client time)
- **Auto-refresh** každých 10 sekúnd (pre aktualizáciu statusov)
- **Responsive dizajn** - cards v grid layout
- **Heroicons** - CheckCircleIcon, ClockIcon, XCircleIcon, LockClosedIcon
- **Loading state** pri načítaní dát
- **Error handling** - toast notifikácia pri chybe
