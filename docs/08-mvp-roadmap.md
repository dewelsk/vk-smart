# MVP Roadmap

## Prehľad MVP

**Cieľ:** Funkčný systém digitalizácie výberových konaní s kľúčovými funkciami.

**Časový rámec:** 4-5 týždňov (v závislosti od kapacity tímu)

**Technológie:** Next.js 14, PostgreSQL, Prisma, NextAuth.js, Tailwind CSS

**Poznámka:** API endpointy sú dokumentované v súboroch obrazoviek (`docs/obrazovky/*.md`)

---

## Fáza 1: Foundation & Auth ✅ HOTOVO

### 1.1 Project Setup ✅
- [x] Inicializácia Next.js projektu
- [x] Docker Compose setup (PostgreSQL, App, Adminer)
- [x] Prisma setup + databázová schéma
- [x] Základná štruktúra adresárov
- [x] Git repository + .gitignore
- [x] Environment variables (.env.example)
- [x] Scripts (db-tunnel.sh, seed-db.ts)

**Výstup:** Projekt beží na `localhost:5600`, DB cez SSH tunel na `5601`, Adminer na `5602`

### 1.2 Autentifikácia ✅
- [x] NextAuth.js v5 setup
- [x] Credentials provider
- [x] Bcrypt hashing
- [x] Session management
- [x] Login page
- [x] Middleware pre protected routes
- [x] Password set token (prvé prihlásenie)

**Výstup:** Funkčné prihlásenie pre všetky role

### 1.3 RBAC & Layouts ✅
- [x] Role-based access control (SUPERADMIN, ADMIN, GESTOR, KOMISIA, UCHADZAC)
- [x] Layout pre Admin (Tailwind)
- [x] Layout pre Gestor (Tailwind)
- [x] Layout pre Komisiu (Tailwind)
- [x] Layout pre Uchádzača (Tailwind)
- [x] Redirect logic podľa roly
- [x] Protected routes (route groups)

**Výstup:** Každá rola má svoj dashboard a prístup len k povoleným stránkam

---

## Fáza 2: Admin - Core Management ✅ HOTOVO

### 2.1 Multi-tenancy (Rezorty/Institutions) ✅
- [x] CRUD rezortov
- [x] Priradenie adminov k rezortom
- [x] SUPERADMIN môže vytvárať rezorty
- [x] ADMIN vidí len svoje rezorty
- [x] Filtrovanie VK podľa rezortov
- [x] Active/inactive toggle pre rezorty

**Výstup:** Multi-tenant systém funkčný

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
- [x] Formulár na vytvorenie používateľa (single)
- [x] Generovanie používateľského mena
- [x] Generovanie password set tokenu
- [x] Email notifikácia (simulovaná - console.log)
- [x] Zoznam používateľov (tabuľka)
- [x] Detail používateľa
- [x] Edit používateľa
- [x] Delete používateľa (soft delete)
- [x] Active/inactive toggle
- [x] Priradenie k rezortom
- [x] Role management

**Výstup:** Admin vie vytvoriť a spravovať účty pre všetky role

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

### 2.7 CSV Import Uchádzačov 🔄
- [ ] Upload CSV súboru
- [ ] Parsing a validácia
- [ ] Batch vytvorenie účtov
- [ ] Error handling (duplicity, neplatné dáta)
- [ ] Preview pred importom

**Výstup:** Admin vie hromadne vytvoriť uchádzačov z CSV

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

## Fáza 4: Testing Infrastructure 🔄 ROZPRACOVANÉ

### 4.1 E2E Testy (Playwright) 🔄
**Hotové:**
- [x] Playwright setup
- [x] Auth helpers
- [x] Login testy
- [x] Dashboard testy
- [x] VK list testy
- [x] VK detail testy
- [x] VK create testy
- [x] Users list testy
- [x] Users detail testy
- [x] Users create testy
- [x] Institutions list testy
- [x] Commission management testy
- [x] Commission chairman testy

**Chýbajúce:**
- [ ] Candidates management testy (add/remove)
- [ ] Gestor assignment testy
- [ ] VK validation testy
- [ ] Multi-tab navigation testy

**Výstup:** Pokrytie E2E testami pre admin flow

### 4.2 Unit Testy (Vitest) ⏳
- [ ] Helper functions testy
- [ ] Validation functions testy
- [ ] Utils testy
- [ ] Component testy (React Testing Library)

**Výstup:** Unit test coverage

### 4.3 API Testy ⏳
- [ ] API route testy
- [ ] Authentication testy
- [ ] Authorization testy
- [ ] Error handling testy

**Výstup:** Stabilné API

---

## Fáza 5: Dokumentácia ✅ HOTOVO

### 5.1 Architektúra & Design Docs ✅
- [x] 01-architecture.md - Celková architektúra
- [x] 02-database-schema.md - Databázová schéma
- [x] 03-authentication-flow.md - Autentifikačný flow
- [x] 04-roles-permissions.md - RBAC
- [x] 05-vk-lifecycle.md - Životný cyklus VK
- [x] 06-tech-stack.md - Technológie
- [x] 07-folder-structure.md - Štruktúra projektu
- [x] 08-mvp-roadmap.md - Tento súbor
- [x] 09-validation-rules.md - Validačné pravidlá
- [x] 10-internal-comms.md - Interná komunikácia

### 5.2 Feature Docs ✅
- [x] 11-multi-tenancy.md - Multi-tenancy systém
- [x] 12-password-flow.md - Password management
- [x] 13-commission-workflow.md - Komisia workflow
- [x] 14-candidate-management.md - Správa uchádzačov
- [x] 19-notifications-system.md - Toast & Modály

### 5.3 Screen Docs ✅
- [x] obrazovky/01-login.md
- [x] obrazovky/02-admin-dashboard.md
- [x] obrazovky/03-admin-vk-list.md
- [x] obrazovky/04-admin-vk-detail.md
- [x] obrazovky/05-admin-vk-create.md
- [x] obrazovky/06-admin-users-list.md
- [x] obrazovky/07-admin-users-detail.md
- [x] obrazovky/08-admin-users-create.md
- [x] obrazovky/09-admin-institutions-list.md

### 5.4 Development Docs ✅
- [x] README.md
- [x] .env.example
- [x] Docker setup
- [x] Seed data scripts

**Výstup:** Kompletná dokumentácia

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

## Fáza 10: Deployment & DevOps ⏳ PLÁNOVANÉ

### 10.1 Production Setup
- [ ] Production Docker Compose
- [ ] Environment variables management
- [ ] Database migrations strategy
- [ ] Backup strategy
- [ ] SSL/TLS setup
- [ ] Domain setup

### 10.2 CI/CD
- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] Automated deployment
- [ ] Rollback strategy

### 10.3 Monitoring & Logging
- [ ] Application logs
- [ ] Error logs
- [ ] Access logs
- [ ] Centralized logging

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
- [x] Project setup & infrastructure
- [x] Autentifikácia & autorizácia
- [x] Multi-tenancy (Rezorty)
- [x] VK management (CRUD, status flow)
- [x] User management (CRUD, roles)
- [x] Commission management
- [x] Candidate management (add/remove)
- [x] Gestor assignment
- [x] Toast notifications
- [x] Confirm modals
- [x] Data tables
- [x] Validačné pravidlá
- [x] E2E testy (čiastočne)
- [x] Kompletná dokumentácia

### 🔄 Rozpracované
- [ ] CSV import uchádzačov
- [ ] E2E test suite (kompletné pokrytie)
- [ ] Candidate tests (add/remove kandidátov)

### ⏳ Nespravené (Prioritné)
1. **Testovací modul** (Gestor + Uchádzač + Admin)
2. **Hodnotenie** (Komisia)
3. **PDF generovanie**
4. **2FA implementácia**
5. **Audit log implementácia**
6. **Upload dokumentov**

### 📊 Progress Overview
- **Fáza 1 (Foundation):** ✅ 100% hotovo
- **Fáza 2 (Admin Core):** ✅ 95% hotovo (chýba CSV import)
- **Fáza 3 (UI/UX):** ✅ 100% hotovo
- **Fáza 4 (Testing):** 🔄 60% hotovo
- **Fáza 5 (Dokumentácia):** ✅ 100% hotovo
- **Fáza 6 (Testy & Hodnotenie):** ⏳ 0% hotovo
- **Fáza 7 (Dokumenty):** ⏳ 0% hotovo
- **Fáza 8 (Security):** ⏳ 30% hotovo (basic security)
- **Fáza 9 (Performance):** ⏳ 0% hotovo
- **Fáza 10 (Deployment):** ⏳ 0% hotovo

**Celkový progress: ~45% MVP hotové**

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
