# Testovanie

## Účel

Komplexné testovanie aplikácie pomocou **Playwright MCP** (Model Context Protocol). Pokrývame všetky sekcie a role používateľov.

---

## Stratégia testovania

### Čo testujeme

**Frontend (E2E testy - Playwright):**
- ✅ Prihlásenie a autentifikácia (všetky role)
- ✅ UI flows pre každú rolu (Admin, Gestor, Komisia, Uchádzač)
- ✅ Formuláre a validácie
- ✅ Navigácia medzi stránkami
- ✅ Interaktívne komponenty (časovač, progress bar, modály)
- ✅ Responzívny dizajn (desktop, tablet, mobile)
- ✅ IDSK komponenty rendering
- ✅ Error states a edge cases

**Backend (API testy):**
- ✅ Všetky API endpoints
- ✅ Autentifikácia a autorizácia
- ✅ Input validácia (Zod schemas)
- ✅ Business logika (bodovanie, vyhodnotenie)
- ✅ Databázové operácie (CRUD)
- ✅ File upload/download
- ✅ PDF generovanie

**Integračné testy:**
- ✅ Frontend + Backend integrácia
- ✅ Databáza + API integrácia
- ✅ Email/OTP simulácia

**Performance:**
- ✅ Page load times
- ✅ API response times
- ✅ Large dataset handling
- ✅ Concurrent users

**Accessibility:**
- ✅ WCAG 2.1 AA compliance
- ✅ Screen reader compatibility
- ✅ Keyboard navigation
- ✅ Color contrast

**Visual Regression:**
- ✅ Screenshot comparison
- ✅ Layout consistency
- ✅ IDSK styling integrity

---

## Kedy sa testy spúšťajú

### 1. Lokálny vývoj (manuálne)

```bash
# Pred commitom
npm run test:e2e

# Špecifické testy
npm run test:e2e -- tests/e2e/auth/login.spec.ts

# Watch mode (počas vývoja)
npm run test:e2e:watch
```

### 2. Git hooks (automaticky)

**Pre-commit hook:**
```bash
# .husky/pre-commit
npm run lint
npm run test:unit  # Rýchle unit testy
```

**Pre-push hook:**
```bash
# .husky/pre-push
npm run test:e2e:critical  # Len critical path testy (~2 min)
```

### 3. CI/CD Pipeline (GitHub Actions)

**Pri pull requeste:**
- ✅ Linting a type checking
- ✅ Unit testy
- ✅ E2E testy (všetky)
- ✅ API testy
- ✅ Accessibility testy
- ✅ Visual regression testy

**Pri merge do main:**
- ✅ Všetky testy
- ✅ Performance testy
- ✅ Deployment na staging

**Nočné (scheduled):**
- ✅ Full test suite
- ✅ Performance benchmarks
- ✅ Security scan
- ✅ Dependency audit

---

## Organizácia testov

### Adresárová štruktúra

```
tests/
├── e2e/                          # Playwright E2E testy
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── login-2fa.spec.ts
│   │   ├── logout.spec.ts
│   │   └── password-reset.spec.ts
│   ├── admin/
│   │   ├── dashboard.spec.ts
│   │   ├── vk-create.spec.ts
│   │   ├── vk-list.spec.ts
│   │   ├── vk-detail.spec.ts
│   │   ├── users-create.spec.ts
│   │   ├── users-csv-import.spec.ts
│   │   ├── tests-approve.spec.ts
│   │   └── monitoring.spec.ts
│   ├── gestor/
│   │   ├── tests-create.spec.ts
│   │   ├── tests-edit.spec.ts
│   │   ├── tests-submit-approval.spec.ts
│   │   └── questions-editor.spec.ts
│   ├── komisia/
│   │   ├── candidates-list.spec.ts
│   │   ├── candidate-documents.spec.ts
│   │   ├── evaluation-form.spec.ts
│   │   ├── evaluation-validation.spec.ts
│   │   └── results.spec.ts
│   ├── uchadzac/
│   │   ├── dashboard.spec.ts
│   │   ├── test-start.spec.ts
│   │   ├── test-interface.spec.ts
│   │   ├── test-timer.spec.ts
│   │   ├── test-submit.spec.ts
│   │   ├── test-results.spec.ts
│   │   └── test-levels.spec.ts
│   ├── visual/
│   │   ├── screenshots.spec.ts
│   │   └── regression.spec.ts
│   ├── performance/
│   │   ├── load-time.spec.ts
│   │   └── api-response.spec.ts
│   └── a11y/
│       ├── accessibility.spec.ts
│       └── keyboard-navigation.spec.ts
├── api/                          # API testy
│   ├── auth.spec.ts
│   ├── admin-vk.spec.ts
│   ├── admin-users.spec.ts
│   ├── tests.spec.ts
│   ├── evaluations.spec.ts
│   └── documents.spec.ts
├── integration/                  # Integračné testy
│   ├── end-to-end-flow.spec.ts
│   └── database.spec.ts
├── unit/                         # Unit testy (React komponenty, utils)
│   ├── components/
│   ├── hooks/
│   └── lib/
├── fixtures/                     # Testovacie dáta
│   ├── test-data.json
│   ├── test-data.ts
│   ├── users.csv
│   └── mock-documents/
└── helpers/                      # Helper funkcie
    ├── auth.ts
    ├── database.ts
    ├── api.ts
    └── screenshots.ts
```

**Poznámka:** Testov bude **desiatky** (odhadom 50-100+), preto je každý test v **samostatnom súbore** pre lepšiu organizáciu a paralelné spúšťanie.

---

## Paralelné spúšťanie testov

### Playwright konfigurácia

```typescript
// playwright.config.ts
export default defineConfig({
  // Paralelné spúšťanie
  fullyParallel: true,

  // Počet workerov
  workers: process.env.CI ? 4 : undefined, // CI: 4 workers, Lokálne: podľa CPU

  // Paralelne aj v rámci jedného súboru
  use: {
    workers: '50%', // Použije 50% CPU cores
  },

  // Retry pre flaky testy
  retries: process.env.CI ? 2 : 0,
});
```

### Výhody paralelného spúšťania:

- ⚡ **10x rýchlejšie** - 50 testov za ~5 min namiesto ~50 min
- 🔄 **Nezávislé testy** - každý test má vlastnú DB session
- 🎯 **Izolácia** - testy sa neovplyvňujú navzájom
- 📊 **CI optimalizácia** - viacero workerov v cloude

### Spustenie:

```bash
# Plný paralelizmus (všetky cores)
npm run test:e2e

# Obmedzený paralelizmus (2 workery)
npm run test:e2e -- --workers=2

# Len jeden worker (debugging)
npm run test:e2e -- --workers=1

# Špecifická skupina testov (paralelne)
npm run test:e2e -- tests/e2e/admin/*.spec.ts
```

---

## Test tags (organizácia)

Pre lepšiu organizáciu používame **tagy**:

```typescript
// Príklad tagov v teste
test('Admin login @auth @admin @critical', async ({ page }) => {
  // ...
});

test('Create VK @admin @vk @smoke', async ({ page }) => {
  // ...
});
```

### Dostupné tagy:

| Tag | Význam | Počet testov |
|-----|--------|--------------|
| `@critical` | Kritické cesty (musí fungovať) | ~10 |
| `@smoke` | Smoke testy (rýchly check) | ~15 |
| `@auth` | Autentifikácia | ~8 |
| `@admin` | Admin funkcionalita | ~20 |
| `@gestor` | Gestor funkcionalita | ~8 |
| `@komisia` | Komisia funkcionalita | ~10 |
| `@uchadzac` | Uchádzač funkcionalita | ~12 |
| `@vk` | Výberové konania | ~15 |
| `@tests` | Testy a testovanie | ~10 |
| `@regression` | Regresné testy | ~20 |
| `@visual` | Visual regression | ~5 |
| `@a11y` | Accessibility | ~5 |
| `@performance` | Performance | ~3 |

### Spúšťanie podľa tagov:

```bash
# Len critical testy
npm run test:e2e -- --grep @critical

# Len admin testy
npm run test:e2e -- --grep @admin

# Admin smoke testy
npm run test:e2e -- --grep "@admin.*@smoke"

# Všetko okrem performance testov
npm run test:e2e -- --grep-invert @performance
```

---

## CI/CD integrácia

### GitHub Actions workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Nočné testy o 2:00

jobs:
  # Job 1: Rýchle testy (lint, unit)
  quick-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit

  # Job 2: E2E testy (paralelne)
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]  # 4 paralelné joby
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: docker-compose up -d
      - run: npx prisma migrate deploy
      - run: npx prisma db seed
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/

  # Job 3: Visual regression (len na PR)
  visual-regression:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test tests/e2e/visual/

  # Job 4: Performance (len nočné)
  performance:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test tests/e2e/performance/
```

### Výsledky CI/CD:

- ✅ **PR check** - Všetky testy musia prejsť pred merge
- 📊 **Reports** - HTML report uploadnutý ako artifact
- 🎯 **Matrix strategy** - 4 paralelné joby = 4x rýchlejšie
- ⏰ **Scheduled** - Nočné testy zachytia edge cases

---

## Metriky a reporting

### Playwright HTML Report

```bash
# Vygeneruj report
npx playwright test

# Zobraz report
npx playwright show-report
```

**Report obsahuje:**
- ✅ Pass/Fail pre každý test
- ⏱️ Execution time
- 📸 Screenshots (pri failure)
- 🎬 Video recording (voliteľné)
- 📋 Trace viewer link

### Test Coverage

```bash
# Frontend coverage (Vitest)
npm run test:unit -- --coverage

# E2E coverage (Playwright)
npm run test:e2e -- --coverage
```

**Ciele:**
- Unit tests: >80% coverage
- E2E tests: 100% critical paths
- API tests: 100% endpoints

---

## Testovacie dáta

**DÔLEŽITÉ:** Všetky testovacie dáta sú definované v samostatnom dokumente **`docs/12-testovacie-data.md`**.

Tento dokument obsahuje:
- Testovacie účty pre všetky role (Admin, Gestor, Komisia, Uchádzač)
- Výberové konania v rôznych stavoch
- Testy a otázky
- Prisma seed script
- JSON export pre importovanie do testov

**Pred každým testom sa:**
1. Resetuje databáza
2. Spustí seed script z `docs/12-testovacie-data.md`
3. Vytvorí clean state

**Importovanie v testoch:**
```typescript
// tests/fixtures/test-data.ts
import testData from './test-data.json';

export const TEST_USERS = testData.users;
export const TEST_VK = testData.vk;
```

---

## Konkrétne test scenáre

**POZNÁMKA:** Konkrétne test scenáre (špecifické test súbory s kódom) budú vytvorené **postupne, po dokončení jednotlivých obrazoviek**.

Nemá zmysel navrhovať detailné testy dopredu, keď ešte nevieme:
- Koľko obrazoviek bude
- Aké dáta tam budú
- Aká bude finálna štruktúra

**Proces tvorby testov:**
1. Dokončíme obrazovku (napr. `obrazovky/admin/02_vytvorenie_vk.md`)
2. Implementujeme obrazovku v Next.js
3. Vytvoríme test súbor (napr. `tests/e2e/admin/vytvorenie-vk.spec.ts`)
4. Test pokrýva všetky scenáre z tej konkrétnej obrazovky

---

## Playwright MCP Setup

### Inštalácia

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Install Playwright MCP server (if not already)
# MCP je dostupný cez Claude Code
```

### Konfigurácia

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5600',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5600',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Spustenie testov

### Lokálne

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run tests for specific role
npx playwright test --grep @admin
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Setup database
        run: |
          docker-compose up -d postgres
          npx prisma migrate deploy
          npx prisma db seed

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging

### Playwright Inspector

```bash
npx playwright test --debug
```

### Trace Viewer

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Console logs

```typescript
test('Debug test', async ({ page }) => {
  page.on('console', msg => console.log('Browser log:', msg.text()));
  page.on('pageerror', err => console.error('Browser error:', err));

  await page.goto('/login');
});
```

---

## Test Reports

```bash
# HTML report (default)
npx playwright show-report

# JSON report
npx playwright test --reporter=json

# JUnit report (for CI)
npx playwright test --reporter=junit
```

---

## Zhrnutie

✅ **Testing stratégia:**
- Všeobecná stratégia testovania (čo, kedy, ako)
- Adresárová štruktúra pre organizáciu testov
- Paralelné spúšťanie testov (rýchlejšie execution)
- Test tags pre kategorizáciu
- CI/CD integrácia (GitHub Actions)

✅ **Playwright MCP:**
- Konfigurácia pre automatizované E2E testovanie
- Support pre multiple browsers (Chromium, Firefox, WebKit)
- Screenshot a trace recording pri failure
- HTML reporting

✅ **Testovacie dáta:**
- Definované v `docs/12-testovacie-data.md`
- Žiadna duplicita
- Prisma seed script pre DB setup

✅ **Proces tvorby testov:**
1. Najprv dokončíme obrazovky
2. Implementujeme funkcionalitu
3. Vytvoríme konkrétne testy pre každú obrazovku
4. Testy pokrývajú všetky scenáre z danej obrazovky

⏳ **Konkrétne test súbory:**
- Budú vytvorené **postupne** po dokončení obrazoviek
- Každý test v samostatnom súbore
- Paralelné spúšťanie pre rýchle execution
