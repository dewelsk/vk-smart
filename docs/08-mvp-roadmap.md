# MVP Roadmap

## Prehľad MVP

**Cieľ:** Funkčný systém digitalizácie výberových konaní s kľúčovými funkciami.

**Časový rámec:** 4-5 týždňov (v závislosti od kapacity tímu)

**Technológie:** Next.js 14, PostgreSQL, Prisma, Auth.js v5, TailwindCSS, TanStack Query, Playwright, Vitest

**Production:** https://vk.retry.sk (DigitalOcean server)

**Poznámka:** API endpointy sú dokumentované v súboroch obrazoviek (`docs/obrazovky/*.md`)

---

## Fáza 1: Foundation & Auth ✅ HOTOVO

### 1.1 Project Setup ✅
- [x] Inicializácia Next.js projektu
- [x] PostgreSQL na DigitalOcean serveri (Docker container, port 5433)
- [x] PM2 process manager pre production
- [x] Nginx reverse proxy (HTTPS)
- [x] Prisma setup + databázová schéma
- [x] Základná štruktúra adresárov (root-level `app/`)
- [x] Git repository + .gitignore
- [x] Environment variables (.env.local, .env.production)
- [x] Scripts (deploy.sh, db-tunnel.sh)
- [x] SSH tunnel pre lokálny development

**Výstup:** Projekt beží na `localhost:5600` (dev), produkcia na `https://vk.retry.sk`, DB cez SSH tunel na `localhost:5601`

### 1.2 Autentifikácia ✅
- [x] Auth.js (NextAuth v5) setup
- [x] Credentials provider
- [x] Bcrypt hashing pre User aj Candidate
- [x] Session management (JWT)
- [x] Login page
- [x] Middleware pre protected routes (`middleware.ts`)
- [x] Password set token (prvé prihlásenie)
- [x] Security settings (login security delay)
- [x] Role switching (admin môže sa prepnúť na iného používateľa)

**Výstup:** Funkčné prihlásenie pre všetky role, bezpečnostné nastavenia

### 1.3 RBAC & Layouts ✅
- [x] Role-based access control (SUPERADMIN, ADMIN, GESTOR, KOMISIA, CANDIDATE)
- [x] Multi-role support (jeden user môže mať viac rolí)
- [x] Layout pre Admin (TailwindCSS, Header, Sidebar)
- [x] Layout pre Gestor (TODO - planned)
- [x] Layout pre Komisiu (TODO - planned)
- [x] Layout pre Uchádzača/Kandidáta (TODO - in development)
- [x] Redirect logic podľa roly
- [x] Protected routes (route groups: `(admin-protected)`)
- [x] TanStack Query provider v root layout
- [x] Toast notifikácie (react-hot-toast)

**Výstup:** Každá rola má svoj dashboard a prístup len k povoleným stránkam

---

## Fáza 2: Admin - Core Management ✅ HOTOVO

### 2.1 Multi-tenancy (Rezorty/Institutions) ❌ ZRUŠENÉ
- [x] ~~CRUD rezortov~~ **REMOVED** - Feature bol odstránený z projektu
- [x] ~~Priradenie adminov k rezortom~~ **REMOVED**
- [x] ~~SUPERADMIN môže vytvárať rezorty~~ **REMOVED**
- [x] ~~ADMIN vidí len svoje rezorty~~ **REMOVED**
- [x] ~~Filtrovanie VK podľa rezortov~~ **REMOVED**
- [x] ~~Active/inactive toggle pre rezorty~~ **REMOVED**

**Výstup:** ~~Multi-tenant systém funkčný~~ **Feature zrušený - zjednodušenie MVP scope**

**Poznámka:** Institution model a všetky súvisiace funkcie boli odstránené v migrácii `20251010120000_remove_institutions`. Systém teraz funguje bez multi-tenancy.

### 2.2 Tvorba Výberového Konania ✅
- [x] Admin dashboard
- [x] Formulár na vytvorenie VK
- [x] Zoznam VK (tabuľka s filtrovaním)
- [x] Detail VK (tabbed interface)
- [x] Edit VK
- [x] Status flow validácia
- [x] Validačné pravidlá pre VK

**Výstup:** Admin vie vytvoriť a spravovať VK

### 2.3 Správa Používateľov ✅
- [x] Formulár na vytvorenie používateľa (User - staff accounts)
- [x] Generovanie používateľského mena
- [x] Generovanie password set tokenu
- [x] Email notifikácia (simulovaná - console.log)
- [x] Zoznam používateľov (tabuľka s TanStack Table)
- [x] Detail používateľa
- [x] Edit používateľa
- [x] Delete používateľa (soft delete)
- [x] Active/inactive toggle
- [x] Multi-role management (UserRole model - jeden user môže mať viac rolí)
- [x] Role assignment/removal v user detail

**Výstup:** Admin vie vytvoriť a spravovať účty pre staff (ADMIN, GESTOR, KOMISIA)

### 2.3b Správa Uchádzačov (Candidates/Applicants) ✅
- [x] Formulár na vytvorenie kandidáta
- [x] Zoznam kandidátov (Applicants page)
- [x] Detail kandidáta s assigned VK tests
- [x] Edit kandidáta
- [x] Delete kandidáta
- [x] CIS identifikátor (pre integráciu)
- [x] Role switching - admin môže sa prepnúť na kandidáta

**Výstup:** Admin vie vytvoriť a spravovať kandidátov (Candidate model)

### 2.4 Správa Komisie ✅
- [x] Modal pre výber členov komisie
- [x] Multi-select používateľov s rolou KOMISIA
- [x] Výber predsedu komisie
- [x] Validácia nepárneho počtu členov
- [x] Pridávanie/odoberanie členov
- [x] Toggle chairman status
- [x] Zobrazenie komisie v detaile VK

**Výstup:** Admin vie vytvoriť a spravovať komisiu pre VK

### 2.5 Správa Uchádzačov ✅
- [x] Modal pre pridanie uchádzača
- [x] Multi-select používateľov s rolou UCHADZAC
- [x] Automatické prebratie CIS identifikátora
- [x] Zoznam uchádzačov v VK
- [x] Odstránenie uchádzača z VK
- [x] Active/archived candidates
- [x] Email zobrazenie

**Výstup:** Admin vie pridat a správu uchádzačov k VK

### 2.6 Priradenie Gestora ✅
- [x] Select box pre výber gestora
- [x] Filtrovanie len používateľov s rolou GESTOR
- [x] Priradenie gestora k VK
- [x] Zobrazenie gestora v detaile VK

**Výstup:** Admin vie priradiť gestora k VK

### 2.7 CSV Import Uchádzačov ⏳
- [ ] Upload CSV súboru
- [ ] Parsing a validácia
- [ ] Batch vytvorenie účtov
- [ ] Error handling (duplicity, neplatné dáta)
- [ ] Preview pred importom

**Výstup:** Admin vie hromadne vytvoriť uchádzačov z CSV

**Poznámka:** Nie je implementované - low priority

### 2.8 Správa Testov ✅
- [x] CRUD test types (typy testov)
- [x] Test type conditions (podmienky - všeobecná, odborná)
- [x] CRUD testov (Test model)
- [x] Import testov z Word (.docx)
- [x] Parsing Word dokumentov (mammoth library)
- [x] Rozpoznávanie otázok a odpovedí
- [x] Automatická detekcia správnej odpovede
- [x] Question categories
- [x] Test approval workflow
- [x] Zoznam testov (filter, search, sort)
- [x] Detail testu (view questions)
- [x] Edit testu
- [x] Clone testu
- [x] Delete testu
- [x] Priradenie testu k VK (VKTest model)
- [x] Practice test modul (precvičovanie testov pre administrátorov)

**Výstup:** Kompletný systém správy testov a otázok

---

## Fáza 3: UI/UX Components ✅ HOTOVO

### 3.1 Toast Notifikácie ✅
- [x] ToastProvider komponent
- [x] useToast hook
- [x] 4 typy notifikácií (success, error, warning, info)
- [x] Auto-dismiss po 5 sekundách
- [x] Manual close
- [x] Animácie (slide-in)

**Výstup:** Konzistentné notifikácie naprieč aplikáciou

### 3.2 Modálne Okná ✅
- [x] ConfirmModal komponent (danger/warning variants)
- [x] AddCommissionMemberModal
- [x] AddCandidateModal
- [x] GestorSelectModal
- [x] Odstránenie všetkých `alert()` a `confirm()` volání

**Výstup:** Profesionálne modálne dialógy

### 3.3 Data Tables ✅
- [x] DataTable komponent (TanStack Table)
- [x] Sorting
- [x] Pagination
- [x] Custom columns
- [x] Actions column
- [x] Empty state handling

**Výstup:** Konzistentné tabuľky s dobrým UX

### 3.4 Form Components ✅
- [x] Validácia formulárov
- [x] Error states
- [x] Loading states
- [x] React Select integrácia
- [x] Inline error messages

**Výstup:** User-friendly formuláre

---

## Fáza 4: Testing Infrastructure ✅ HOTOVO

### 4.1 E2E Testy (Playwright) ✅
**Hotové:**
- [x] Playwright setup + configuration
- [x] Auth helpers (`tests/helpers/auth.ts`)
- [x] Login test (smoke test)
- [x] Dashboard test
- [x] VK list test
- [x] VK detail test
- [x] VK create and detail test
- [x] VK candidates add test
- [x] VK edit modal test
- [x] VK oral tab test
- [x] Users list test
- [x] Users detail test (role management)
- [x] Applicants create test
- [x] Applicants detail test
- [x] Applicant edit test
- [x] Applicant switch (role switching) test
- [x] Test detail test
- [x] Test import test
- [x] Test navigation test
- [x] Practice test test
- [x] Settings test (security settings)
- [x] ~~Institutions tests~~ **REMOVED** (feature zrušený)
- [x] Production smoke tests

**Výstup:** Kompletné pokrytie E2E testami pre admin flow

**Test scripts:**
- `npm run test:e2e` - všetky E2E testy
- `npm run test:e2e:smoke` - production smoke tests
- Data-testid pattern konzistentne používaný

### 4.2 Backend API Testy (Vitest) ✅
- [x] Vitest setup + configuration
- [x] Applicants API testy (CRUD, search, filter)
- [x] Tests API testy (CRUD, import, clone)
- [x] Practice API testy (start, submit, history)
- [x] Evaluation config API testy
- [x] Security settings API testy
- [x] Question battery testy

**Výstup:** Backend API test coverage

**Test scripts:**
- `npm run test:backend` - všetky backend testy
- `npm run test:backend:watch` - watch mode

### 4.3 Test Patterns & Documentation ✅
- [x] E2E test patterns dokumentácia (`docs/patterns/e2e-form-tests.md`)
- [x] Backend testing patterns (`docs/patterns/backend-testing.md`)
- [x] Form validation patterns (`docs/patterns/form-validation.md`)
- [x] CLAUDE.md - pravidlá pre testovanie
- [x] Data-testid convention (kebab-case)
- [x] Helper functions pre testy

**Výstup:** Konzistentné test patterns naprieč projektom

---

## Fáza 5: Dokumentácia ✅ HOTOVO

### 5.1 Architektúra & Design Docs ✅
- [x] 01-technicka-architektura.md - Produkčná architektúra (DigitalOcean, PM2, Nginx)
- [x] 02-tech-stack.md - Technológie (Next.js 14, Auth.js, TailwindCSS, Playwright, Vitest)
- [x] 03-struktura-projektu.md - Štruktúra projektu (app router, API routes)
- [x] 08-mvp-roadmap.md - Tento súbor
- [x] 13-testovanie.md - Testovacia stratégia
- [x] 23-deployment.md - Deployment proces

### 5.2 Pattern Docs ✅
- [x] patterns/form-validation.md - Form validation patterns
- [x] patterns/icons.md - Heroicons usage
- [x] patterns/ui-components.md - UI component patterns
- [x] patterns/e2e-form-tests.md - E2E test patterns
- [x] patterns/backend-testing.md - Backend API test patterns

### 5.3 Screen Docs (obrazovky/) ✅
- [x] obrazovky/admin/ - Admin screens (VK, Users, Tests, Applicants)
- [x] obrazovky/gestor/ - Gestor screens (planned)
- [x] obrazovky/komisia/ - Komisia screens (planned)

### 5.4 Development Docs ✅
- [x] README.md
- [x] CLAUDE.md - Claude Code rules a patterns
- [x] .env.local - Environment variables (gitignored)
- [x] Seed data scripts (`prisma/seed.ts`)
- [x] Deployment script (`scripts/deploy.sh`)
- [x] DB tunnel script (`scripts/db-tunnel.sh`)

### 5.5 Daily Notes ✅
- [x] docs/daily/ - Denné poznámky a planning

**Výstup:** Kompletná dokumentácia projektu, patterns, deployment

---

## Fáza 6: Testy & Hodnotenie ⏳ NESPRAVENÉ

### 6.1 Gestor - Editor Testov ⏳
- [ ] Formulár na vytvorenie testu
- [ ] Editor otázok (multiple choice)
- [ ] Ukladanie testov do knižnice
- [ ] Zoznam mojich testov (Gestor)
- [ ] Edit/Delete testov
- [ ] Test metadata (typ, level, časový limit)

**Výstup:** Gestor vie vytvoriť testy

### 6.2 Admin - Priradenie Testov k VK ⏳
- [ ] Zoznam dostupných testov
- [ ] Priradenie testu k VK
- [ ] Nastavenie parametrov (počet otázok, čas, body, level)
- [ ] Multiple testy pre jedno VK
- [ ] Validácia test assignments

**Výstup:** Admin vie priradiť testy k VK

### 6.3 Uchádzač - Testovací Modul ⏳
- [ ] Zoznam testov pre uchádzača
- [ ] Spustenie testu
- [ ] Testovacia obrazovka
  - [ ] Zobrazenie otázok
  - [ ] Výber odpovedí
  - [ ] Časovač (countdown)
  - [ ] Progress bar
  - [ ] Možnosť pozastaviť/pokračovať
- [ ] Odoslanie testu
- [ ] Automatické vyhodnotenie
- [ ] Zobrazenie výsledkov
- [ ] History testov

**Výstup:** Uchádzač vie absolvovať test

### 6.4 Komisia - Hodnotenie Uchádzačov ⏳
- [ ] Zoznam uchádzačov pre komisiu
- [ ] Detail uchádzača
  - [ ] Zobrazenie dokumentov
  - [ ] Výsledky testov
  - [ ] História hodnotení
- [ ] Hodnotiacu formulár
  - [ ] Výber vlastností
  - [ ] Batéria otázok
  - [ ] Bodovanie 1-5
  - [ ] Validácia max. 2 body rozdiel
- [ ] Sumárny prehľad hodnotení
- [ ] Export hodnotení

**Výstup:** Komisia vie hodnotiť uchádzačov

---

## Fáza 7: Dokumenty & Reporting ⏳ NESPRAVENÉ

### 7.1 Upload Dokumentov ⏳
- [ ] Upload dokumentov (CV, certifikáty)
- [ ] Uloženie do lokálneho úložiska (/public/uploads)
- [ ] Zobrazenie dokumentov v profile uchádzača
- [ ] Download dokumentov
- [ ] Validácia typu a veľkosti súborov
- [ ] Preview PDF dokumentov

**Výstup:** Správa dokumentov funguje

### 7.2 Generovanie PDF Dokumentov ⏳
- [ ] Sumárny hodnotiaci hárok
  - [ ] Šablóna (React PDF alebo Puppeteer)
  - [ ] Automatické vypĺňanie dát
- [ ] Záverečné hodnotenie
  - [ ] Šablóna
  - [ ] Vypočítanie celkových bodov
  - [ ] Poradie kandidátov
- [ ] Zápisnica z VK
  - [ ] Šablóna
  - [ ] Všetky výsledky
- [ ] Download PDF
- [ ] Email odoslanie (simulované)

**Výstup:** Systém vie vygenerovať dokumentáciu

---

## Fáza 8: Security & Monitoring ⏳ ČIASTOČNE

### 8.1 OTP / 2FA ⏳
- [ ] Generovanie 6-miestneho OTP kódu
- [ ] Uloženie s expiráciou (5 min)
- [ ] Verifikačná obrazovka
- [ ] Max. 3 pokusy
- [ ] Recovery kód pre Admina
- [ ] QR kód pre Authenticator app

**Poznámka:** Aktuálne je v Prisma schéme pripravené (`otpSecret`, `otpEnabled`, `recoveryCode`), ale nie je implementované

**Výstup:** 2FA pre kritické role

### 8.2 Audit Log ⏳
- [ ] Logging všetkých akcií
- [ ] Uloženie do DB (AuditLog model pripravený)
- [ ] Admin view audit logov
- [ ] Filtrovanie (používateľ, akcia, dátum)
- [ ] Export audit logov
- [ ] Retention policy

**Poznámka:** Model v Prisma existuje, ale nie je implementovaný logging

**Výstup:** Kompletný audit trail

### 8.3 Security Hardening ⏳
- [x] Password hashing (bcrypt)
- [x] Session management
- [x] CSRF protection (Next.js built-in)
- [ ] Rate limiting
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection
- [ ] CORS configuration
- [ ] Security headers

**Výstup:** Bezpečná aplikácia

---

## Fáza 9: Performance & Optimization ⏳ PLÁNOVANÉ

### 9.1 Performance Optimalizácie
- [ ] Database indexy
- [ ] Query optimalizácia
- [ ] Eager/lazy loading strategy
- [ ] Pagination optimalizácia
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] Lazy loading componentov

### 9.2 Caching
- [ ] Redis setup (optional)
- [ ] Session cache
- [ ] Query cache
- [ ] Static page cache

### 9.3 Monitoring
- [ ] Error tracking (Sentry?)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring

---

## Fáza 10: Deployment & DevOps ✅ ČIASTOČNE HOTOVO

### 10.1 Production Setup ✅
- [x] DigitalOcean server (165.22.95.150)
- [x] PostgreSQL Docker container (port 5433)
- [x] PM2 process manager setup
- [x] Nginx reverse proxy
- [x] SSL/TLS setup (Let's Encrypt)
- [x] Domain setup (vk.retry.sk)
- [x] Environment variables management (.env.production)
- [x] Database migrations strategy (Prisma migrate deploy)
- [x] Backup strategy (PM2 backups pred každým deploymentom)
- [x] SSH key authentication (deploy user)

**Výstup:** Funkčný production server na https://vk.retry.sk

### 10.2 Deployment Process ✅
- [x] Deployment script (`scripts/deploy.sh`)
  - [x] Local production build
  - [x] Rsync .next/ directory to server
  - [x] Install dependencies on server
  - [x] Run migrations
  - [x] Reload PM2
  - [x] Health check
  - [x] Smoke tests
- [x] Auto-confirm mode (`--yes` flag)
- [x] Backup before deployment
- [x] Git status check
- [x] Production smoke tests (Playwright)

**Deployment command:** `./scripts/deploy.sh`

**Výstup:** Jednoduchý deployment proces s jedným príkazom

### 10.3 CI/CD ⏳
- [ ] GitHub Actions workflow
- [ ] Automated testing on push
- [ ] Automated deployment on merge to main
- [ ] Rollback strategy

**Poznámka:** Zatiaľ manuálny deployment cez `deploy.sh` script

### 10.4 Monitoring & Logging 🔄
- [x] PM2 logs (`pm2 logs vk-retry`)
- [x] PM2 status monitoring (`pm2 status`)
- [x] Application logs (Next.js console logs)
- [x] Health check endpoint (curl test v deploy scripte)
- [ ] Error tracking (Sentry?)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Centralized logging

**Výstup:** Basic monitoring pomocou PM2, advanced monitoring planned

---

## Mimo MVP (Post-launch)

### Nice-to-have Features:
- [ ] Všetky typy testov (6 levelov)
  - [ ] Všeobecný test
  - [ ] Test štátneho jazyka
  - [ ] Test cudzieho jazyka
  - [ ] IT zručnosti test
  - [ ] Schopnosti a vlastnosti test
  - [ ] Kombinácie testov (leveling)
- [ ] Import zo SharePointu (namiesto CSV)
- [ ] Real email sending (SMTP)
- [ ] Real OTP (SMS/Email provider)
- [ ] Real-time monitoring (WebSockets)
- [ ] Notifikácie (push, email)
- [ ] Export do Excel
- [ ] Bulk operácie (bulk delete, bulk edit)
- [ ] Pokročilé filtrovanie a full-text search
- [ ] Statistics & reporting dashboard
- [ ] Calendar view pre VK
- [ ] Kandidát self-registration portal
- [ ] Interview scheduling
- [ ] Video interview integration

### Technické zlepšenia:
- [ ] Unit testy coverage > 80%
- [ ] Integration testy
- [ ] Kompletné E2E test suite
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] S3/Azure Blob Storage pre súbory
- [ ] CDN pre static assets
- [ ] Horizontal scaling (Kubernetes)
- [ ] Database replication
- [ ] Blue-green deployment

---

## Aktuálny Stav Projektu

### ✅ Hotové (Funkčné)
**Infrastructure & Foundation:**
- [x] Production server setup (DigitalOcean, PM2, Nginx, SSL)
- [x] PostgreSQL database (Docker container)
- [x] SSH tunnel pre lokálny development
- [x] Deployment script + smoke tests
- [x] Auth.js v5 (credentials, sessions, multi-role)
- [x] Security settings (login delay)
- [x] Role switching feature

**Admin Management:**
- [x] VK management (CRUD, status flow, validation)
- [x] User management (CRUD, multi-role support)
- [x] Applicant/Candidate management (CRUD, CIS identifier)
- [x] Commission management (members, chairman)
- [x] Gestor assignment
- [x] Test management (CRUD, Word import, practice mode)
- [x] Test types & conditions
- [x] Question categories

**UI/UX:**
- [x] TailwindCSS design system
- [x] Heroicons
- [x] Toast notifications (react-hot-toast)
- [x] Confirm modals (ConfirmModal component)
- [x] Data tables (TanStack Table)
- [x] Form validation patterns
- [x] DateTimePicker component

**Testing:**
- [x] Playwright E2E tests (admin flow kompletne pokryté)
- [x] Vitest backend API tests
- [x] Production smoke tests
- [x] Test patterns & documentation

**Documentation:**
- [x] Kompletná technická dokumentácia
- [x] Pattern guides (forms, testing, UI)
- [x] CLAUDE.md - development rules
- [x] Deployment documentation

### 🔄 Rozpracované
- [ ] Applicant test interface (in development)
- [ ] Question battery feature (TODO)
- [ ] PDF export (planned - Puppeteer)

### ⏳ Nespravené (Prioritné)
1. **Uchádzač - Testovací modul** (test interface pre candidates)
2. **Komisia - Hodnotenie** (evaluation interface)
3. **PDF generovanie** (súmarný hárok, zápisnica)
4. **CSV import** uchádzačov (low priority)
5. **2FA implementácia** (OTP pre kritické role)
6. **Audit log UI** (model pripravený, chýba UI)
7. **Upload dokumentov** (CV, certifikáty)

### 📊 Progress Overview
- **Fáza 1 (Foundation):** ✅ 100% hotovo
- **Fáza 2 (Admin Core):** ✅ 95% hotovo (chýba CSV import - low priority)
- **Fáza 3 (UI/UX):** ✅ 100% hotovo
- **Fáza 4 (Testing):** ✅ 100% hotovo
- **Fáza 5 (Dokumentácia):** ✅ 100% hotovo
- **Fáza 6 (Testy & Hodnotenie):** ⏳ 20% hotovo (admin practice tests)
- **Fáza 7 (Dokumenty):** ⏳ 0% hotovo
- **Fáza 8 (Security):** 🔄 50% hotovo (basic security + settings)
- **Fáza 9 (Performance):** ⏳ 0% hotovo
- **Fáza 10 (Deployment):** ✅ 90% hotovo (chýba CI/CD automation)

**Celkový progress: ~65% MVP hotové**

**Production status:** ✅ Funkčný production server na https://vk.retry.sk

---

## Metriky úspechu MVP

✅ **Funkčnosť (Čiastočne):**
- [x] Admin vie vytvoriť VK a spravovať účty
- [x] Admin vie vytvoriť komisiu
- [ ] Gestor vie vytvoriť testy
- [ ] Uchádzač vie absolvovať test
- [ ] Komisia vie hodnotiť
- [ ] Systém vie vygenerovať dokumentáciu

✅ **Bezpečnosť (Čiastočne):**
- [x] Autentifikácia a autorizácia funkčná
- [x] Heslá hashované
- [x] Role-based access control
- [ ] 2FA pre Admina
- [ ] Audit log všetkých akcií

✅ **Použiteľnosť:**
- [x] Profesionálny dizajn
- [x] Responzívny dizajn
- [x] Intuitívne UI
- [x] Jasné error messages
- [x] Toast notifikácie
- [x] Confirm dialógy

✅ **Technická kvalita:**
- [x] Docker setup funkčný
- [x] Databáza well-structured
- [x] Kód type-safe (TypeScript)
- [x] Dokumentácia kompletná
- [x] E2E testy (čiastočne)

---

## Prioritizácia Ďalších Krokov

### High Priority (Blocking MVP)
1. **Testovací modul** - bez toho systém neplní základnú funkciu
2. **Hodnotenie** - kľúčová časť procesu
3. **PDF generovanie** - výstup z procesu

### Medium Priority
4. **CSV import** - zjednodušenie práce admina
5. **Upload dokumentov** - potrebné pre komisiu
6. **2FA** - bezpečnostný requirement

### Low Priority (Nice to have)
7. **Audit log UI** - model je pripravený, treba len UI
8. **Performance optimalizácie**
9. **Monitoring & alerting**

---

## Odhadovaný Čas do MVP (100%)

**Zostávajúce práce:**
- Testovací modul: 5-7 dní
- Hodnotenie: 4-5 dní
- PDF generovanie: 2-3 dni
- CSV import: 1-2 dni
- 2FA: 1-2 dni
- Upload dokumentov: 1-2 dni
- Bug fixes & polish: 2-3 dni

**Celkový odhad: 16-24 pracovných dní (3-5 týždňov)**

*(závisí od kapacity tímu a komplexnosti)*

---

## Poznámky

- API dokumentácia je súčasťou screen dokumentácie (`docs/obrazovky/*.md`)
- Všetky změny sú commitované s jasným commit message
- E2E testy sú v priečinku `tests/e2e/admin/`
- Database seed data v `scripts/seed-db.ts`
- SSH tunnel script v `scripts/db-tunnel.sh`
