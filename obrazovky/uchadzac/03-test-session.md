# Obrazovka: Test session (Vypĺňanie testu)

**Route:** `/applicant/test/[sessionId]`

**Účel:** Vypĺňanie testu s možnosťou uloženia a návr atu naspäť.

---

## Požiadavky zo zadania

- **KRITICKÉ: Uchádzač môže odísť z testu a vrátiť sa späť** (rozdiel oproti practice)
- Po spustení testu sa spustí **časomiera** (synchronizovaná so serverom)
- Admin vidí v real-time **koľko času zostáva**
- Uchádzač môže **meniť odpovede** kým test neukončí
- Po vypršaní času = **automatické odoslanie**
- Uchádzač môže **manuálne odoslať** test pred vypršaním času
- Session sa ukladá **na server**, nie do sessionStorage

---

## Layout - Režim "Otázka po otázke" (default)

```
┌─────────────────────────────────────────────────────────────────┐
│  HLAVIČKA VK: VK/2025/1234 | Odborný test     [Čas: 15:30]     │
│                                                                 │
│  Zobrazenie: ( • ) Otázka po otázke  ( ) Všetky otázky naraz   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: [████████░░░░░░░░░░░░] 8/20 otázok                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Otázka 8/20:                                            │   │
│  │                                                          │   │
│  │ Aká je hlavná funkcia operačného systému?              │   │
│  │                                                          │   │
│  │ [ ] A) Prehrávanie hudby                                │   │
│  │ [X] B) Správa hardvérových a softvérových zdrojov      │   │
│  │ [ ] C) Rendering 3D grafiky                             │   │
│  │ [ ] D) Kompilácia zdrojového kódu                       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [< Predchádzajúca]                        [Ďalšia >]          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Rýchla navigácia:                                        │   │
│  │ [1✓][2✓][3✓][4✓][5✓][6✓][7✓][8!][9]...[20]             │   │
│  │                                                          │   │
│  │ ✓ = zodpovedané, ! = aktuálna, prázdne = nezodpovedané │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Uložiť a odísť]                             [Odoslať test]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Layout - Režim "Všetky otázky naraz"

```
┌─────────────────────────────────────────────────────────────────┐
│  HLAVIČKA VK: VK/2025/1234 | Odborný test     [Čas: 15:30]     │
│                                                                 │
│  Zobrazenie: ( ) Otázka po otázke  ( • ) Všetky otázky naraz   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Progress: [████████░░░░░░░░░░░░] 8/20 otázok                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Otázka 1/20:                                            │   │
│  │ Aká je hlavná funkcia operačného systému?              │   │
│  │ [ ] A) Prehrávanie hudby                                │   │
│  │ [X] B) Správa hardvérových zdrojov                      │   │
│  │ [ ] C) Rendering 3D grafiky                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Otázka 2/20:                                            │   │
│  │ Čo je to algoritmus?                                    │   │
│  │ [X] A) Postupnosť krokov na riešenie problému           │   │
│  │ [ ] B) Programovací jazyk                               │   │
│  │ [ ] C) Hardvérové zariadenie                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ... (všetky otázky v jednom scrollovateľnom zozname)          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Otázka 20/20:                                           │   │
│  │ Aký je rozdiel medzi RAM a ROM?                         │   │
│  │ [ ] A) RAM je permanentná, ROM dočasná                  │   │
│  │ [ ] B) Žiadny rozdiel                                   │   │
│  │ [X] C) RAM je dočasná, ROM permanentná                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Uložiť a odísť]                             [Odoslať test]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Komponenty

### 1. View Mode Toggle (Prepínač režimu zobrazenia)

**Radio buttons:**
- "Otázka po otázke" (default)
- "Všetky otázky naraz"

**Štýl:**
- Radio button group (horizontálne)
- Persists v sessionStorage (používateľ si môže prepnúť a zostane to)
- `data-testid="view-mode-toggle"`

**Správanie:**
- Prepnutie zachová aktuálne odpovede
- Prepnutie zachová scroll pozíciu (ak je relevantné)
- V režime "všetky naraz" sa deaktivujú tlačidlá "Predchádzajúca"/"Ďalšia"
- Rýchla navigácia funguje v oboch režimoch (v režime "všetky naraz" scrollne na danú otázku)

### 2. Header (Hlavička)

**Informácie:**
- Identifikátor VK
- Názov testu
- **Časovač** (veľký, výrazný)

**Časovač:**
- Formát: MM:SS
- Farba:
  - Zelená: > 5 minút (`text-green-600`)
  - Oranžová: 2-5 minút (`text-orange-600`)
  - Červená: < 2 minúty (`text-red-600`)
- Bliká pri posledných 60 sekundách
- `data-testid="timer"`

**Layout:**
- Fixed top (sticky header)
- Background: `bg-white border-b border-gray-200`
- Padding: `p-4`
- Shadow: `shadow-sm`

### 3. Progress Bar

- Vizuálny progress bar (šírka podľa % zodpovedaných otázok)
- Text: "X/Y otázok"
- `data-testid="progress-bar"`

### 4. Question Card (obidva režimy)

**Zobrazenie otázky:**
- Číslo otázky: "Otázka X/Y:"
- Text otázky (veľký font, bold)
- Typ otázky:
  - SINGLE_CHOICE: radio buttons
  - MULTIPLE_CHOICE: checkboxes
  - TRUE_FALSE: dva radio buttons (Pravda / Nepravda)
  - TEXT: textarea

**Odpovede:**
- Každá možnosť má checkbox/radio + text
- Označená odpoveď: modrý border + modrý background
- Hover efekt
- `data-testid="question-{questionId}"`
- `data-testid="option-{optionId}"`

### 5. Navigation

**Režim "Otázka po otázke":**

**Tlačidlá:**
- "Predchádzajúca" (disabled na prvej otázke)
- "Ďalšia" (disabled na poslednej otázke)
- Secondary button style
- `data-testid="prev-button"`, `data-testid="next-button"`

**Rýchla navigácia:**
- Grid tlačidiel pre každú otázku (1, 2, 3, ...)
- Farby:
  - Zodpovedané: zelená (`bg-green-100 border-green-500`)
  - Aktuálna: modrá (`bg-blue-500 text-white`)
  - Nezodpovedané: šedá (`bg-gray-100 border-gray-300`)
- Klik = jump na danú otázku
- `data-testid="quick-nav-{questionNumber}"`

**Režim "Všetky otázky naraz":**

**Rýchla navigácia:**
- Rovnaká ako v režime "otázka po otázke"
- Klik = smooth scroll na danú otázku
- Aktuálna = otázka viditeľná vo viewport (highlighted počas scrollu)
- `data-testid="quick-nav-{questionNumber}"`

### 6. Action Buttons

**"Uložiť a odísť":**
- Secondary button
- Klik → modal potvrdenia
- Uloží aktuálny stav na server
- Redirect na dashboard
- `data-testid="save-and-leave-button"`

**"Odoslať test":**
- Primary button
- Klik → modal potvrdenia
- Zobrazí počet nezodpovedaných otázok (ak sú)
- Po potvrdení → finalizuje test
- `data-testid="submit-test-button"`

---

## Funkcionalita

### View Mode (Prepínanie režimov)

**Režim "Otázka po otázke" (default):**
- Zobrazuje sa len jedna otázka
- Navigation tlačidlá "Predchádzajúca"/"Ďalšia" sú aktívne
- Aktuálna otázka sa ukladá do state

**Režim "Všetky otázky naraz":**
- Zobrazujú sa všetky otázky v jednom scrollovateľnom zozname
- Navigation tlačidlá "Predchádzajúca"/"Ďalšia" sú skryté
- Rýchla navigácia scrollne na danú otázku (smooth scroll)
- Intersection Observer sleduje, ktorá otázka je aktuálne viditeľná

**Prepnutie režimu:**
- Uloží preferencia do sessionStorage: `test-view-mode`
- Pri ďalšom teste sa použije posledná preferencia
- Zachová aktuálne odpovede (žiadna strata dát)

### Načítanie testu

1. GET `/api/applicant/test/[sessionId]`
2. Response obsahuje:
   - Test data (otázky, možnosti)
   - Current state (uložené odpovede)
   - Server start time + duration
3. Inicializácia časovača (synchronizovaný so serverom)
4. Načítanie poslednej pozície (aktuálna otázka)

### Auto-save

- Každých **5 sekúnd** automaticky uloží odpovede na server
- POST `/api/applicant/test/[sessionId]/save`
- Body: `{ answers: { [questionId]: answer } }`
- Žiadny toast (silent save)
- Loading indicator (malý spinner v headeri)

### Časovač

**Synchronizácia so serverom:**
```typescript
const serverStartTime = new Date(session.serverStartTime).getTime()
const now = Date.now()
const elapsed = (now - serverStartTime) / 1000
const remaining = Math.max(0, session.durationSeconds - elapsed)
```

**Tick každú sekundu:**
- Aktualizácia zobrazeného času
- Zmena farby podľa zostávajúceho času
- Blikanie pri < 60 sekúnd

**Vypršanie času:**
- Zobrazenie modalu: "Čas vypršal. Test sa automaticky odosiela."
- Auto-submit po 3 sekundách
- Redirect na result page

### Uložiť a odísť

1. Klik na "Uložiť a odísť"
2. Modal: "Naozaj chcete odísť? Váš priebeh bude uložený a môžete sa vrátiť naspäť."
3. Confirm → POST `/api/applicant/test/[sessionId]/save`
4. Redirect na `/applicant/dashboard`
5. Session zostáva v stave `IN_PROGRESS`

### Odoslať test

1. Klik na "Odoslať test"
2. Kontrola nezodpovedaných otázok
3. Modal:
   - Ak všetky zodpovedané: "Naozaj chcete odoslať test? Po odoslaní už nebudete môcť meniť odpovede."
   - Ak nezodpovedané: "Máte X nezodpovedaných otázok. Naozaj chcete odoslať test?"
4. Confirm → POST `/api/applicant/test/[sessionId]/submit`
5. Server vyhodnotí test (score, passed)
6. Redirect na `/applicant/test/[sessionId]/result`

### Ochrana pred stratou dát

**Browser refresh/close:**
- `beforeunload` event listener
- Alert: "Máte neuložené zmeny. Naozaj chcete opustiť stránku?"
- Auto-save zabezpečuje minimálnu stratu (max 5 sekúnd)

**Návrat späť:**
- Pri návrate na dashboard a následnom "Pokračovať" sa načíta uložený stav
- Časovač pokračuje od posledného uloženého času

---

## API Endpoints

### GET /api/applicant/test/[sessionId]

Response:
```json
{
  "session": {
    "id": "cls1...",
    "status": "IN_PROGRESS",
    "serverStartTime": "2025-07-24T10:35:00Z",
    "durationSeconds": 1200,
    "answers": {
      "q1": "optA",
      "q2": ["optB", "optC"],
      "q3": "Moja textová odpoveď"
    }
  },
  "test": {
    "id": "clxz...",
    "name": "Odborný test",
    "type": "ODBORNY",
    "questions": [
      {
        "id": "q1",
        "text": "Aká je hlavná funkcia operačného systému?",
        "type": "SINGLE_CHOICE",
        "options": [
          { "id": "optA", "text": "Prehrávanie hudby" },
          { "id": "optB", "text": "Správa hardvérových zdrojov" }
        ],
        "points": 1
      }
    ]
  },
  "vk": {
    "identifier": "VK/2025/1234",
    "position": "hlavný štátny radca"
  }
}
```

### POST /api/applicant/test/[sessionId]/save

Request:
```json
{
  "answers": {
    "q1": "optA",
    "q2": ["optB", "optC"]
  }
}
```

Response:
```json
{
  "success": true,
  "savedAt": "2025-07-24T10:40:00Z"
}
```

### POST /api/applicant/test/[sessionId]/submit

Request:
```json
{
  "answers": {
    "q1": "optA",
    "q2": ["optB", "optC"]
  }
}
```

Response:
```json
{
  "success": true,
  "sessionId": "cls1...",
  "score": 18,
  "maxScore": 20,
  "passed": true
}
```

---

## Data-testid attributes

- `view-mode-toggle` - Prepínač režimu zobrazenia
- `view-mode-single` - Radio button "Otázka po otázke"
- `view-mode-all` - Radio button "Všetky otázky naraz"
- `timer` - Časovač
- `progress-bar` - Progress bar
- `question-{questionId}` - Otázka card
- `option-{optionId}` - Možnosť odpovede
- `prev-button` - Tlačidlo "Predchádzajúca" (len v režime "otázka po otázke")
- `next-button` - Tlačidlo "Ďalšia" (len v režime "otázka po otázke")
- `quick-nav-{questionNumber}` - Rýchla navigácia (1, 2, 3...)
- `save-and-leave-button` - Tlačidlo "Uložiť a odísť"
- `submit-test-button` - Tlačidlo "Odoslať test"
- `confirm-leave-modal` - Modal potvrdenia odchodu
- `confirm-submit-modal` - Modal potvrdenia odoslania

---

## Notes

- **Dva režimy zobrazenia:**
  - "Otázka po otázke" (default) - klasické stránkovanie
  - "Všetky otázky naraz" - všetky otázky v jednom scrollovateľnom zozname
- **Preferencia režimu** sa ukladá do sessionStorage
- **Session sa ukladá na server** (nie sessionStorage ako v practice!)
- **Auto-save každých 5 sekúnd** (+ pri zmene otázky v režime "otázka po otázke")
- **Časovač synchronizovaný so serverom** (nie client time)
- **Ochrana pred stratou dát** (beforeunload event)
- **ConfirmModal komponent** namiesto JavaScript confirm()
- **Slovenské skloňovanie** pre "otázka/otázky/otázok"
- **Heroicons:** ClockIcon, CheckCircleIcon, QuestionMarkCircleIcon, ViewColumnsIcon (pre toggle)
- **Responsive dizajn** - mobile-friendly
- **Smooth scroll** v režime "všetky naraz" pri kliknutí na rýchlu navigáciu
- **Intersection Observer** sleduje viditeľnú otázku v režime "všetky naraz"
