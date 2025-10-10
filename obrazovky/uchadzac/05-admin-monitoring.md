# Obrazovka: Real-time monitoring (Admin/Komisia)

**Route:** `/admin/vk/[id]/monitoring`

**Účel:** Sledovanie priebehu testov uchádzačov v reálnom čase.

---

## Požiadavky zo zadania

**Admin/Komisia musí vidieť priebeh testov uchádzača:**
- **Koľko času mu zostáva** - synchronizovaný odpočet ako vidí uchádzač
- **Aký test má práve otvorený** (level + typ)
- **Celkový počet otázok**
- **Počet vyplnených otázok**
- **Počet správne vyplnených otázok**
- **Počet nesprávne vyplnených otázok**

**Dodatočné:**
- Admin vidí počet prihlásených uchádzačov pri danom VK
- Admin vidí otvorené testy
- Admin vidí priebežné výsledky
- Môžu prebiehať viaceré VK naraz
- Systém umožňuje prepínanie medzi VK
- Dashboard so stavmi

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  VK/2025/1234 | Monitoring priebehu                             │
│                                                                 │
│  [Refresh] Posledná aktualizácia: pred 3 sekundami             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PREHĽAD VÝBEROVÉHO KONANIA                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Celkový počet uchádzačov: 15                            │   │
│  │ Momentálne testujú: 8                                   │   │
│  │ Dokončili všetky testy: 3                               │   │
│  │ Neúspešní: 2                                            │   │
│  │ Čakajú na začatie: 2                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  UCHÁDZAČI                                                      │
│                                                                 │
│  [Hľadať uchádzača...]                   [Filter: Všetci ▼]    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [ClockIcon] Ing. Ján Novák (VK-001)                     │   │
│  │                                                          │   │
│  │ Status: Testuje                                          │   │
│  │ Aktuálny test: Level 1 - Odborný test                  │   │
│  │                                                          │   │
│  │ Zostávajúci čas: [15:30] (75%)                          │   │
│  │                                                          │   │
│  │ Progress: [████████████░░░░░░░░] 12/20 otázok (60%)    │   │
│  │                                                          │   │
│  │ ✓ Správne: 10 otázok                                    │   │
│  │ ✗ Nesprávne: 2 otázky                                   │   │
│  │ ○ Nezodpovedané: 8 otázok                               │   │
│  │                                                          │   │
│  │           [Detail]            [História testov]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [CheckIcon] Mgr. Mária Kováčová (VK-002)                │   │
│  │                                                          │   │
│  │ Status: Dokončila Level 1                                │   │
│  │ Posledný test: Level 1 - Odborný test                   │   │
│  │                                                          │   │
│  │ Výsledok: 18/20 bodov (90%) - PREŠLA                    │   │
│  │ Čas dokončenia: pred 5 minútami                         │   │
│  │                                                          │   │
│  │ Ďalší test: Level 2 - Test cudzieho jazyka             │   │
│  │ Status ďalšieho testu: Čaká na začatie                  │   │
│  │                                                          │   │
│  │           [Detail]            [História testov]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [XIcon] Bc. Peter Horváth (VK-003)                      │   │
│  │                                                          │   │
│  │ Status: Neúspešný                                        │   │
│  │ Test: Level 1 - Odborný test                            │   │
│  │                                                          │   │
│  │ Výsledok: 10/20 bodov (50%) - NEPREŠIEL                │   │
│  │ Čas dokončenia: pred 15 minútami                        │   │
│  │                                                          │   │
│  │ Uchádzač končí vo výberovom konaní.                     │   │
│  │                                                          │   │
│  │           [Detail]            [História testov]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Komponenty

### 1. Header

**Informácie:**
- Identifikátor VK
- Názov stránky: "Monitoring priebehu"
- Tlačidlo "Refresh" (manuálna aktualizácia)
- Timestamp poslednej aktualizácie
- `data-testid="monitoring-header"`

### 2. Prehľad VK (Summary Card)

**Štatistiky:**
- Celkový počet uchádzačov
- Momentálne testujú
- Dokončili všetky testy
- Neúspešní (zlyhali na niektorom leveli)
- Čakajú na začatie

**Štýl:**
- White card, border, shadow
- Grid layout (5 položiek)
- Ikony pre každú metriku
- `data-testid="vk-summary"`

### 3. Filter a search

**Search input:**
- Placeholder: "Hľadať uchádzača..."
- Real-time filter (local search)
- `data-testid="search-input"`

**Filter dropdown:**
- Všetci
- Testujú
- Dokončili
- Neúspešní
- Čakajú
- `data-testid="status-filter"`

### 4. Uchádzač Card (Real-time)

**Pre testujúceho uchádzača:**

**Header:**
- Icon: ClockIcon (modrá)
- Meno + priezvisko + CIS identifikátor
- Status badge: "Testuje" (modrá)

**Aktuálny test:**
- Level + názov testu
- **Časovač:** (synchronizovaný, countdown)
  - Formát: MM:SS
  - Progress bar (% zostávajúceho času)
  - Farba: zelená > 50%, oranžová 20-50%, červená < 20%

**Progress otázok:**
- Visual progress bar
- Text: "X/Y otázok (Z%)"

**Detailné štatistiky:**
- Správne: X otázok (zelená)
- Nesprávne: Y otázok (červená)
- Nezodpovedané: Z otázok (šedá)

**Tlačidlá:**
- "Detail" (Secondary) - redirect na detail uchádzača
- "História testov" (Secondary) - zobrazí všetky testy

`data-testid="candidate-card-{candidateId}"`

**Pre dokončeného uchádzača:**

**Header:**
- Icon: CheckCircleIcon (zelená) alebo XCircleIcon (červená)
- Meno + priezvisko + CIS identifikátor
- Status badge: "Dokončil Level X" / "Neúspešný"

**Výsledok:**
- Skóre: X/Y bodov (Z%)
- PREŠIEL / NEPREŠIEL
- Čas dokončenia: "pred X minútami"

**Ďalší krok:**
- Ak prešiel: "Ďalší test: Level X - [názov]"
- Ak neprešiel: "Uchádzač končí vo výberovom konaní."

### 5. Auto-refresh

- Auto-refresh každých **5 sekúnd**
- Loading indicator (malý spinner v headeri)
- Smooth update (bez blikania)
- Zachovanie scroll pozície

---

## Funkcionalita

### Načítanie dát

1. GET `/api/admin/vk/[id]/monitoring`
2. Response obsahuje:
   - Summary (celkové štatistiky)
   - Zoznam uchádzačov s aktuálnym stavom
   - Pre testujúcich: real-time progress
3. Dáta sa aktualizujú každých 5 sekúnd (polling)
4. Alternative: WebSocket pre real-time updates (neskoršia fáza)

### Real-time časovač

**Pre každého testujúceho uchádzača:**
- Časovač sa počíta na frontendu
- Synchronizovaný so serverom (`serverStartTime + durationSeconds`)
- Tick každú sekundu
- Zmena farby podľa zostávajúceho času
- Progress bar (vizuálny)

```typescript
const serverStartTime = new Date(session.serverStartTime).getTime()
const now = Date.now()
const elapsed = (now - serverStartTime) / 1000
const remaining = Math.max(0, session.durationSeconds - elapsed)
```

### Počítanie správnych/nesprávnych odpovedí

**V reálnom čase:**
- Server vie, ktoré otázky sú správne (má správne odpovede)
- Pri každom auto-save uchádzača server porovná odpovede
- Vráti počet správnych/nesprávnych v real-time
- Admin vidí aktuálny stav (nie len po dokončení)

**Implementácia:**
- `TestSession.answers` (JSON) obsahuje aktuálne odpovede
- Server pri GET monitoring porovná s `Test.questions` (correct answers)
- Vráti: `correctAnswers: 10, incorrectAnswers: 2, unanswered: 8`

### Filter a search

**Search:**
- Local filter (no server request)
- Hľadá v mene, priezvisku, CIS identifikátore
- Case-insensitive

**Status filter:**
- Filtruje podľa statusu (Testujú, Dokončili, Neúspešní, Čakajú)
- Local filter

### Detail a história

**Detail button:**
- Redirect na `/admin/vk/[id]/candidates/[candidateId]`
- Zobrazí všetky informácie o uchádzačovi

**História testov button:**
- Zobrazí modal/panel s históriou všetkých testov
- Pre každý test: level, názov, výsledok, čas

---

## API Endpoint

### GET /api/admin/vk/[id]/monitoring

Response:
```json
{
  "vk": {
    "id": "clxz...",
    "identifier": "VK/2025/1234"
  },
  "summary": {
    "totalCandidates": 15,
    "currentlyTesting": 8,
    "completed": 3,
    "failed": 2,
    "waiting": 2
  },
  "candidates": [
    {
      "id": "cls1...",
      "name": "Ján",
      "surname": "Novák",
      "cisIdentifier": "VK-001",
      "status": "TESTING",
      "currentSession": {
        "id": "cls2...",
        "test": {
          "level": 1,
          "name": "Odborný test",
          "type": "ODBORNY"
        },
        "serverStartTime": "2025-07-24T10:35:00Z",
        "durationSeconds": 1200,
        "totalQuestions": 20,
        "answeredQuestions": 12,
        "correctAnswers": 10,
        "incorrectAnswers": 2,
        "unansweredQuestions": 8
      }
    },
    {
      "id": "cls3...",
      "name": "Mária",
      "surname": "Kováčová",
      "cisIdentifier": "VK-002",
      "status": "COMPLETED_LEVEL",
      "lastSession": {
        "id": "cls4...",
        "test": {
          "level": 1,
          "name": "Odborný test",
          "type": "ODBORNY"
        },
        "completedAt": "2025-07-24T10:45:00Z",
        "score": 18,
        "maxScore": 20,
        "passed": true
      },
      "nextTest": {
        "level": 2,
        "name": "Test cudzieho jazyka",
        "status": "NOT_STARTED"
      }
    },
    {
      "id": "cls5...",
      "name": "Peter",
      "surname": "Horváth",
      "cisIdentifier": "VK-003",
      "status": "FAILED",
      "lastSession": {
        "id": "cls6...",
        "test": {
          "level": 1,
          "name": "Odborný test",
          "type": "ODBORNY"
        },
        "completedAt": "2025-07-24T10:30:00Z",
        "score": 10,
        "maxScore": 20,
        "passed": false
      }
    }
  ]
}
```

---

## Data-testid attributes

- `monitoring-header` - Header stránky
- `refresh-button` - Tlačidlo "Refresh"
- `last-update-time` - Timestamp poslednej aktualizácie
- `vk-summary` - Prehľad VK (summary card)
- `search-input` - Search input
- `status-filter` - Filter dropdown
- `candidate-card-{candidateId}` - Card uchádzača
- `candidate-status-{candidateId}` - Status badge
- `timer-{candidateId}` - Časovač
- `progress-bar-{candidateId}` - Progress bar otázok
- `correct-count-{candidateId}` - Počet správnych
- `incorrect-count-{candidateId}` - Počet nesprávnych
- `unanswered-count-{candidateId}` - Počet nezodpovedaných
- `detail-button-{candidateId}` - Tlačidlo "Detail"
- `history-button-{candidateId}` - Tlačidlo "História"

---

## Notes

- **Auto-refresh každých 5 sekúnd** (polling)
- **Real-time časovač** na frontenде (synchronizovaný so serverom)
- **Slovenské skloňovanie:** "1 otázka", "2-4 otázky", "5+ otázok"
- **Responsive dizajn** - grid layout pre cards
- **Heroicons:** ClockIcon, CheckCircleIcon, XCircleIcon, LockClosedIcon
- **Loading states** - skeleton cards počas načítavania
- **Error handling** - toast notifikácia pri chybe
- **Optimalizácia:** differential updates (len zmenené cards)
- **WebSocket** (neskoršia fáza) - namiesto pollingu
- **Export do PDF** (neskoršia fáza) - snapshot monitoring obrazovky
