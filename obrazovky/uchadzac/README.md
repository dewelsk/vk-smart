# Návrhy obrazoviek pre uchádzača

Tento adresár obsahuje kompletné návrhy obrazoviek pre uchádzačov vo výberovom konaní.

---

## Prehľad obrazoviek

### 1. [Prihlásenie uchádzača](./01-login.md)
**Route:** `/applicant/login`

Autentifikácia pomocou dočasných prístupových údajov (VK identifikátor + heslo).

**Kľúčové features:**
- Validácia formátu VK identifikátora
- Inline error handling
- Session management
- Audit logging

---

### 2. [Dashboard uchádzača](./02-dashboard.md)
**Route:** `/applicant/dashboard`

Prehľad pridelených testov a ich statusov.

**Kľúčové features:**
- Hlavička VK (identifikátor, pozícia, dátum...)
- Zoznam testov s levelmi (1-6)
- **Postupné levely** - uchádzač môže pristúpiť k level 2 len ak prešiel level 1
- Status badges (Nespustený, Prebieha, Dokončený, Uzamknutý)
- Real-time časovač pre testy v priebehu
- Progress tracking (X/Y otázok)

---

### 3. [Test session](./03-test-session.md)
**Route:** `/applicant/test/[sessionId]`

Vypĺňanie testu s možnosťou uloženia a návratu naspäť.

**Kľúčové features:**
- **Uchádzač môže odísť z testu a vrátiť sa späť** (session na serveri)
- Časovač synchronizovaný so serverom
- Auto-save každých 5 sekúnd
- Progress bar (X/Y otázok)
- Rýchla navigácia medzi otázkami
- Tlačidlo "Uložiť a odísť"
- Tlačidlo "Odoslať test" (s potvrdením)
- Auto-submit pri vypršaní času
- Ochrana pred stratou dát (beforeunload event)

---

### 4. [Výsledok testu](./04-test-result.md)
**Route:** `/applicant/test/[sessionId]/result`

Zobrazenie výsledku dokončeného testu.

**Kľúčové features:**
- Skóre (X/Y bodov, %)
- PREŠIEL / NEPREŠIEL
- Detailný prehľad odpovedí (správne/nesprávne)
- Čas dokončenia
- Ak prešiel → možnosť pokračovať k ďalšiemu levelu
- Ak neprešiel → koniec vo VK

---

### 5. [Admin: Real-time monitoring](./05-admin-monitoring.md)
**Route:** `/admin/vk/[id]/monitoring`

Sledovanie priebehu testov uchádzačov v reálnom čase.

**Kľúčové features:**
- **Koľko času zostáva** (synchronizovaný countdown)
- **Aký test má práve otvorený** (level + typ)
- **Celkový počet otázok**
- **Počet vyplnených otázok**
- **Počet správne vyplnených otázok** (real-time!)
- **Počet nesprávne vyplnených otázok** (real-time!)
- Auto-refresh každých 5 sekúnd
- Filter a search
- Summary štatistiky VK

---

## Flow diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   LOGIN UCHÁDZAČA                           │
│              /applicant/login                               │
│                                                             │
│  Input: VK identifikátor (VK/2025/1234)                    │
│  Input: Dočasné heslo                                       │
│  Submit → Vytvorenie session                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD UCHÁDZAČA                            │
│            /applicant/dashboard                             │
│                                                             │
│  - Hlavička VK                                              │
│  - Zoznam testov (levely 1-6)                              │
│  - Status: Nespustený | Prebieha | Dokončený | Uzamknutý  │
│  - Tlačidlá: Začať | Pokračovať | Zobraziť výsledok        │
└───────────┬─────────────────────────┬───────────────────────┘
            │                         │
            │ [Začať test]            │ [Zobraziť výsledok]
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│               TEST SESSION                                  │
│        /applicant/test/[sessionId]                          │
│                                                             │
│  - Časovač (synchronizovaný so serverom)                   │
│  - Otázky + možnosti odpovedí                              │
│  - Progress bar (X/Y otázok)                               │
│  - Auto-save každých 5 sekúnd                              │
│  - Tlačidlá:                                               │
│    • Uložiť a odísť (späť na dashboard)                    │
│    • Odoslať test (finalizácia)                            │
│  - Auto-submit pri vypršaní času                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ [Odoslať test / Čas vypršal]
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              VÝSLEDOK TESTU                                 │
│      /applicant/test/[sessionId]/result                     │
│                                                             │
│  - Skóre: X/Y bodov (%)                                    │
│  - PREŠIEL / NEPREŠIEL                                     │
│  - Detailný prehľad odpovedí                               │
│  - Tlačidlá:                                               │
│    • Späť na dashboard                                      │
│    • Pokračovať (ak prešiel a je ďalší level)             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ [Späť na dashboard]
                  │
                  ▼
                (DASHBOARD)
```

---

## Admin monitoring flow

```
┌─────────────────────────────────────────────────────────────┐
│           ADMIN: REAL-TIME MONITORING                       │
│             /admin/vk/[id]/monitoring                       │
│                                                             │
│  Pre každého uchádzača:                                     │
│  - Status: Testuje | Dokončil | Neúspešný | Čaká          │
│  - Aktuálny test (level + názov)                           │
│  - Časovač (countdown, synchronizovaný)                     │
│  - Progress: X/Y otázok                                     │
│  - Správne: X otázok (real-time!)                          │
│  - Nesprávne: Y otázok (real-time!)                        │
│  - Nezodpovedané: Z otázok                                  │
│                                                             │
│  Auto-refresh každých 5 sekúnd                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technické detaily

### Session management

**Uchádzač:**
- Session uložená v **secure cookie**
- Role: `UCHADZAC`
- Obsahuje: `candidateId`, `vkId`, `userId`

**TestSession:**
- Uložená v **databáze** (nie sessionStorage!)
- Obsahuje: `answers`, `startTime`, `status`
- Auto-save každých 5 sekúnd
- Umožňuje "odísť a vrátiť sa"

### Časovač synchronizovaný so serverom

```typescript
// Server vracia:
{
  serverStartTime: "2025-07-24T10:35:00Z",
  durationSeconds: 1200
}

// Frontend počíta:
const startTime = new Date(serverStartTime).getTime()
const now = Date.now()
const elapsed = (now - startTime) / 1000
const remaining = Math.max(0, durationSeconds - elapsed)
```

**Výhody:**
- Časovač beží presne podľa servera
- Uchádzač nemôže manipulovať s časom
- Admin vidí ten istý čas ako uchádzač

### Postupné levely (Levels logic)

**Pravidlá:**
- Level 1 je vždy dostupný
- Level N je dostupný len ak Level N-1 bol **úspešne dokončený** (`passed=true`)
- Ak level N zlyhal (`passed=false`), ďalšie levely zostávajú uzamknuté
- Uchádzač končí vo VK ak zlyhá na nejakom leveli

**Implementácia:**
```typescript
// Backend logika
const canAccessLevel = (candidate, level) => {
  if (level === 1) return true

  const previousLevel = level - 1
  const previousSession = getSession(candidate, previousLevel)

  return previousSession?.passed === true
}
```

### Real-time počítanie správnych odpovedí

**Admin monitoring:**
- Server vie, ktoré otázky sú správne (má correct answers v `Test.questions`)
- Pri každom auto-save uchádzača server porovná odpovede
- Vráti počet správnych/nesprávnych v real-time
- Admin vidí aktuálny stav (nie len po dokončení)

**Implementácia:**
```typescript
// Backend
const calculateRealTimeStats = (session, test) => {
  const answers = session.answers
  const questions = test.questions

  let correct = 0, incorrect = 0, unanswered = 0

  questions.forEach(q => {
    const userAnswer = answers[q.id]
    if (!userAnswer) {
      unanswered++
    } else if (isCorrect(userAnswer, q.correctAnswer)) {
      correct++
    } else {
      incorrect++
    }
  })

  return { correct, incorrect, unanswered }
}
```

---

## Databázová schéma (nové tabuľky)

### TestSession

```prisma
model TestSession {
  id              String   @id @default(cuid())

  candidateId     String
  candidate       Candidate @relation(...)

  vkTestId        String
  vkTest          VKTest @relation(...)

  testId          String
  test            Test @relation(...)

  status          SessionStatus @default(NOT_STARTED)

  answers         Json @default("{}")

  startedAt       DateTime?
  lastAccessedAt  DateTime?
  completedAt     DateTime?

  serverStartTime DateTime?
  durationSeconds Int?

  score           Float?
  maxScore        Float?
  passed          Boolean?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([candidateId, vkTestId])
  @@map("test_sessions")
}

enum SessionStatus {
  NOT_STARTED
  IN_PROGRESS
  PAUSED
  COMPLETED
  TIME_EXPIRED
}
```

---

## API Endpoints (zhrnutie)

### Uchádzač

- `POST /api/applicant/login` - Prihlásenie
- `GET /api/applicant/dashboard` - Dashboard (zoznam testov + statusy)
- `POST /api/applicant/test/start` - Spustenie testu (vytvorí TestSession)
- `GET /api/applicant/test/[sessionId]` - Načítanie testu + stavu
- `POST /api/applicant/test/[sessionId]/save` - Uloženie odpovedí (auto-save)
- `POST /api/applicant/test/[sessionId]/submit` - Finalizácia testu
- `GET /api/applicant/test/[sessionId]/result` - Výsledok testu

### Admin

- `GET /api/admin/vk/[id]/monitoring` - Real-time monitoring

---

## Pravidlá implementácie (z CLAUDE.md)

- ✅ **Žiadne EMOJI** - použiť Heroicons
- ✅ **data-testid** atribúty na všetkých elementoch
- ✅ **Inline validácia** s červeným borderom
- ✅ **ConfirmModal** namiesto JavaScript confirm()
- ✅ **Toast notifikácie** (react-hot-toast)
- ✅ **Slovenské skloňovanie** (otázka/otázky/otázok)
- ✅ **Konzistentný dizajn tlačidiel** (Primary/Secondary/Destructive)
- ✅ **Backend testy** pre všetky endpointy
- ✅ **E2E testy** pre celý flow
- ✅ **Form validation pattern** z `docs/patterns/form-validation.md`

---

## Ďalšie kroky (Implementation plan)

1. ✅ Návrhy obrazoviek (hotové)
2. ⏳ Databázová schéma (Prisma migration)
3. ⏳ Backend API endpointy
4. ⏳ Frontend komponenty
5. ⏳ Backend testy
6. ⏳ E2E testy
7. ⏳ Real-time monitoring

---

## Poznámky

- **SSH tunnel beží** na porte 5601
- **Dev server beží** na http://localhost:5600
- **Testovanie:** Admin v defaultnom Chrome profile, uchádzač v novom profile
- **Session management:** Secure cookies, server-side
- **Real-time updates:** Polling každých 5 sekúnd (WebSocket neskôr)
