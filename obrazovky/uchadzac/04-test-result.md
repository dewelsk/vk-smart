# Obrazovka: Výsledok testu

**Route:** `/applicant/test/[sessionId]/result`

**Účel:** Zobrazenie výsledku dokončeného testu.

---

## Požiadavky zo zadania

- Po vyhodnotení sa zobrazí **dosiahnuté skóre**
- Zobrazenie **správnych odpovedí**
- **Poďakovanie za účasť**
- Výsledok vidí **uchádzač aj admin/tajomník**
- Ak uchádzač prešiel a je ďalší test → možnosť pokračovať
- Ak uchádzač neprešiel → koniec vo VK

---

## Layout (Úspešný test)

```
┌─────────────────────────────────────────────────────────────────┐
│  [CheckCircleIcon]   GRATULUJEME!                               │
│                                                                 │
│         Úspešne ste dokončili Level 1: Odborný test            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    VÁŠ VÝSLEDOK                          │   │
│  │                                                          │   │
│  │              18 / 20 bodov (90%)                        │   │
│  │                                                          │   │
│  │  Minimálny požadovaný počet bodov: 12                   │   │
│  │  Váš výsledok: PREŠIEL                                  │   │
│  │                                                          │   │
│  │  Čas: 18:45 / 20:00 minút                               │   │
│  │  Správne zodpovedané: 18 otázok                         │   │
│  │  Nesprávne zodpovedané: 2 otázky                        │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            DETAILNÝ PREHĽAD ODPOVEDÍ                     │   │
│  │                                                          │   │
│  │  [Zobraziť správne odpovede]                            │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Môžete pokračovať k Level 2: Test cudzieho jazyka            │
│                                                                 │
│              [Späť na dashboard]  [Pokračovať]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Layout (Neúspešný test)

```
┌─────────────────────────────────────────────────────────────────┐
│  [XCircleIcon]   ŽIAĽ, TEST STE NEZVLÁDLI                      │
│                                                                 │
│         Level 1: Odborný test                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    VÁŠ VÝSLEDOK                          │   │
│  │                                                          │   │
│  │              10 / 20 bodov (50%)                        │   │
│  │                                                          │   │
│  │  Minimálny požadovaný počet bodov: 12                   │   │
│  │  Váš výsledok: NEPREŠIEL                                │   │
│  │                                                          │   │
│  │  Čas: 19:30 / 20:00 minút                               │   │
│  │  Správne zodpovedané: 10 otázok                         │   │
│  │  Nesprávne zodpovedané: 10 otázok                       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            DETAILNÝ PREHĽAD ODPOVEDÍ                     │   │
│  │                                                          │   │
│  │  [Zobraziť správne odpovede]                            │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Žiaľ, nesplnili ste požadovaný počet bodov.                   │
│  Vaša účasť vo výberovom konaní týmto končí.                   │
│                                                                 │
│  Ďakujeme za Vašu účasť.                                       │
│                                                                 │
│                    [Späť na dashboard]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Komponenty

### 1. Header (Úspech/Neúspech)

**Úspech:**
- Icon: CheckCircleIcon (veľká, zelená)
- Text: "GRATULUJEME!"
- Zelené pozadie header: `bg-green-50 border-green-200`
- `data-testid="success-header"`

**Neúspech:**
- Icon: XCircleIcon (veľká, červená)
- Text: "ŽIAĽ, TEST STE NEZVLÁDLI"
- Červené pozadie header: `bg-red-50 border-red-200`
- `data-testid="failure-header"`

### 2. Výsledok Card

**Zobrazené informácie:**
- **Skóre:** X / Y bodov (%)
  - Veľký font (text-4xl), bold
  - Farba: zelená (prešiel) / červená (neprešiel)
- **Minimálny počet bodov:** required score
- **Výsledok:** PREŠIEL / NEPREŠIEL
  - Badge: zelený/červený
- **Čas:** X:XX / Y:YY minút
- **Správne zodpovedané:** X otázok
- **Nesprávne zodpovedané:** Y otázok

**Štýl:**
- White card s tieňom
- Centered text
- `data-testid="result-card"`

### 3. Detailný prehľad odpovedí

**Tlačidlo "Zobraziť správne odpovede":**
- Secondary button
- Klik → rozbalí zoznam otázok s odpovedami
- `data-testid="show-answers-button"`

**Rozbalený zoznam:**
- Pre každú otázku:
  - Číslo otázky
  - Text otázky
  - Vaša odpoveď (červená ak nesprávna, zelená ak správna)
  - Správna odpoveď (zelená)
  - Icon: CheckCircleIcon (správna) / XCircleIcon (nesprávna)
- Collapsible (možnosť zabaliť späť)
- `data-testid="answers-list"`

### 4. Next Steps (Ďalšie kroky)

**Ak prešiel a je ďalší level:**
- Text: "Môžete pokračovať k Level X: [názov testu]"
- Tlačidlo "Pokračovať" (Primary)
  - Klik → redirect na dashboard (alebo priamo start ďalšieho testu?)
- `data-testid="continue-button"`

**Ak neprešiel:**
- Text: "Žiaľ, nesplnili ste požadovaný počet bodov. Vaša účasť vo výberovom konaní týmto končí."
- Text: "Ďakujeme za Vašu účasť."
- Len tlačidlo "Späť na dashboard"

**Ak prešiel ale nie je ďalší level:**
- Text: "Úspešne ste dokončili všetky testy. Ďalšie kroky Vám budú oznámené."
- Text: "Ďakujeme za Vašu účasť."

### 5. Action Buttons

- "Späť na dashboard" (Secondary button)
  - Redirect na `/applicant/dashboard`
  - `data-testid="back-to-dashboard-button"`
- "Pokračovať" (Primary button, len ak prešiel a je ďalší level)
  - Redirect na dashboard alebo start ďalšieho testu
  - `data-testid="continue-button"`

---

## Funkcionalita

### Načítanie výsledku

1. GET `/api/applicant/test/[sessionId]/result`
2. Response obsahuje:
   - Test info (názov, level, typ)
   - Výsledok (score, maxScore, passed)
   - Čas (durationSeconds)
   - Počet správnych/nesprávnych
   - Detailné odpovede (otázka, vaša odpoveď, správna odpoveď)
   - Next level info (ak existuje)

### Zobrazenie správnych odpovedí

- Default: zbalené
- Klik na "Zobraziť správne odpovede" → expand
- Animácia (slide down)
- Pre každú otázku:
  - Číslo + text otázky
  - Vaša odpoveď (highlight červená/zelená)
  - Správna odpoveď (highlight zelená)
  - Icon: CheckCircleIcon / XCircleIcon

### Navigation

**Späť na dashboard:**
- Redirect na `/applicant/dashboard`
- Dashboard zobrazí aktualizované statusy testov

**Pokračovať:**
- Ak je ďalší level → redirect na dashboard
- Dashboard ukáže odomknutý ďalší level
- (Alternatíva: priamo start ďalšieho testu → ale lepšie cez dashboard)

---

## API Endpoint

### GET /api/applicant/test/[sessionId]/result

Response (úspech):
```json
{
  "session": {
    "id": "cls1...",
    "status": "COMPLETED",
    "completedAt": "2025-07-24T10:50:00Z"
  },
  "test": {
    "id": "clxz...",
    "name": "Odborný test",
    "type": "ODBORNY",
    "level": 1
  },
  "result": {
    "score": 18,
    "maxScore": 20,
    "successRate": 90,
    "passed": true,
    "minScore": 12,
    "durationSeconds": 1125,
    "correctAnswers": 18,
    "incorrectAnswers": 2
  },
  "answers": [
    {
      "questionId": "q1",
      "questionText": "Aká je hlavná funkcia operačného systému?",
      "questionNumber": 1,
      "yourAnswer": "optB",
      "yourAnswerText": "Správa hardvérových zdrojov",
      "correctAnswer": "optB",
      "correctAnswerText": "Správa hardvérových zdrojov",
      "isCorrect": true
    },
    {
      "questionId": "q2",
      "questionText": "Aké sú výhody OOP?",
      "questionNumber": 2,
      "yourAnswer": ["optA", "optC"],
      "yourAnswerText": ["Znovupoužiteľnosť", "Abstrakcia"],
      "correctAnswer": ["optA", "optB", "optC"],
      "correctAnswerText": ["Znovupoužiteľnosť", "Zapuzdrenie", "Abstrakcia"],
      "isCorrect": false
    }
  ],
  "nextLevel": {
    "level": 2,
    "testName": "Test cudzieho jazyka",
    "available": true
  },
  "vk": {
    "identifier": "VK/2025/1234"
  }
}
```

Response (neúspech):
```json
{
  "result": {
    "passed": false,
    // ... ostatné rovnaké
  },
  "nextLevel": null
}
```

---

## Data-testid attributes

- `success-header` / `failure-header` - Header s ikonou
- `result-card` - Card s výsledkom
- `score-display` - Zobrazenie skóre (X/Y bodov)
- `pass-fail-badge` - Badge "PREŠIEL" / "NEPREŠIEL"
- `time-display` - Zobrazenie času
- `correct-count` - Počet správnych odpovedí
- `incorrect-count` - Počet nesprávnych odpovedí
- `show-answers-button` - Tlačidlo "Zobraziť správne odpovede"
- `answers-list` - Zoznam odpovedí (rozbalený)
- `answer-item-{questionNumber}` - Položka odpovede
- `next-level-message` - Správa o ďalšom leveli
- `continue-button` - Tlačidlo "Pokračovať"
- `back-to-dashboard-button` - Tlačidlo "Späť na dashboard"

---

## Notes

- **Slovenské skloňovanie:** "1 otázka", "2-4 otázky", "5+ otázok"
- **Farby podľa výsledku:**
  - Úspech: zelená (#10b981)
  - Neúspech: červená (#ef4444)
- **Heroicons:** CheckCircleIcon, XCircleIcon
- **Animácie:** smooth collapse/expand pre detailné odpovede
- **Responsive dizajn**
- **Zabránenie opätovnému odoslaniu:** tlačidlo "Odoslať" sa už nezobrazuje
- **PDF export** (neskoršia fáza): možnosť stiahnuť výsledok ako PDF
