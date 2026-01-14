# Stav projektu VK Smart

**Dátum aktualizácie:** 2025-01-14
**Celkový progres:** ~65% (MVP ready)

---

## ✅ Hotové funkcionality

### 1. Autentifikácia a bezpečnosť
- ✅ Login systém (email/password)
- ✅ JWT session management
- ✅ Role-based access control (RBAC)
- ✅ User switching (admin → uchádzač view)
- ✅ Session timeout handling
- ✅ Security settings page (login attempts, 2FA config)
- ✅ Password hashing (bcrypt)
- ✅ Middleware ochrana routes

### 2. User Management
- ✅ CRUD pre používateľov
- ✅ Role management (SUPERADMIN, ADMIN, GESTOR, KOMISIA, UCHADZAC)
- ✅ User search a filtering
- ✅ Batch user operations
- ✅ User status tracking (active/inactive)

### 3. Institution Management
- ✅ CRUD pre inštitúcie
- ✅ Institution categories
- ✅ Search a filtering
- ✅ Institution-user associations

### 4. Applicant Management (Uchádzači)
- ✅ CRUD pre uchádzačov
- ✅ Applicant detail page
- ✅ Status tracking (draft, submitted, in_review, approved, rejected)
- ✅ Search a advanced filtering
- ✅ Applicant-institution linking
- ✅ Document upload (CV, motivation letter)
- ✅ Applicant dashboard (candidate view)

### 5. Test Management
- ✅ CRUD pre testy
- ✅ Test categories (HARD_SKILLS, SOFT_SKILLS, LANGUAGE, PERSONALITY, GENERAL)
- ✅ Question import z DOCX (Mammoth.js)
- ✅ Test practice mode (candidate testing)
- ✅ Test sessions (tracking attempts)
- ✅ Time tracking (duration, time limits)
- ✅ Automatic scoring
- ✅ Test-applicant assignment
- ✅ Test results zobrazenie

### 6. Question Management
- ✅ Question CRUD
- ✅ Multiple choice questions
- ✅ DOCX import (bulk question upload)
- ✅ Question validation
- ✅ Correct answer marking

### 7. Admin Dashboard
- ✅ Overview karty (uchádzači, testy, inštitúcie)
- ✅ Recent activity
- ✅ Quick actions
- ✅ Statistics summary

### 8. UI/UX Components
- ✅ DataTables (sorting, filtering, pagination)
- ✅ Modal dialogs (ConfirmModal)
- ✅ Toast notifications
- ✅ Form validation (inline errors)
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design (Tailwind CSS)
- ✅ Heroicons integration

### 9. Testing Infrastructure
- ✅ E2E tests (Playwright)
- ✅ Backend API tests (Vitest)
- ✅ Test helpers (auth, DB cleanup)
- ✅ CI/CD ready test suite

### 10. Deployment
- ✅ Production deployment (https://vk.retry.sk)
- ✅ PM2 process management
- ✅ PostgreSQL Docker setup
- ✅ Environment configuration
- ✅ Build & deploy scripts

---

## ❌ Chýbajúce funkcionality (MVP Critical)

### 1. 🔴 Evaluation Form (Hodnotiaci formulár)
**Prečo je kritické:** Komisia potrebuje hodnotiť uchádzačov podľa štruktúrovaných kritérií.

**Chýba:**
- Vytvorenie evaluation formu pre komisiu
- Kritériá hodnotenia (konfigurovateľné)
- Bodovanie jednotlivých kritérií
- Komentáre k hodnoteniu
- Uloženie vyplneného formulára
- História hodnotení

**Súbory na vytvorenie:**
- `app/(admin-protected)/applicants/[id]/evaluate/page.tsx`
- `app/api/evaluations/route.ts`
- `prisma/schema.prisma` - Evaluation model

**Odhad:** ~6-8 hodín práce

---

### 2. 🔴 Question Battery (Banka otázok)
**Prečo je kritické:** Gestor potrebuje spravovať veľké množstvo otázok a vyberať ich do testov.

**Chýba:**
- Centrálna banka otázok (repository)
- Kategorizácia otázok (témy, obtiažnosť)
- Vyhľadávanie a filtrovanie otázok
- Výber otázok do testu (drag & drop alebo multi-select)
- Tag system pre otázky
- Question versioning (úpravy, história)
- Bulk operations (mass delete, update)

**Súbory na vytvorenie:**
- `app/(admin-protected)/question-battery/page.tsx`
- `app/(admin-protected)/tests/[id]/questions/page.tsx` (výber otázok)
- `app/api/question-battery/route.ts`
- Update `prisma/schema.prisma` - QuestionTag, QuestionVersion models

**Odhad:** ~10-12 hodín práce

---

### 3. 🔴 PDF Generation (Export hodnotení)
**Prečo je kritické:** Výsledky hodnotenia musia byť exportovateľné do PDF pre archív a distribúciu.

**Chýba:**
- PDF generator (Puppeteer alebo pdf-lib)
- Template pre evaluation report
- Template pre test results
- Batch PDF export (multiple applicants)
- PDF download endpoint
- PDF preview

**Súbory na vytvorenie:**
- `app/api/applicants/[id]/export-pdf/route.ts`
- `lib/pdf-generator.ts`
- `lib/pdf-templates/evaluation.tsx` (React component → HTML → PDF)

**Technológie:**
- Puppeteer (už nainštalované v package.json)
- HTML → PDF rendering

**Odhad:** ~6-8 hodín práce

---

### 4. 🟡 Gestor Test Editor (Rozšírený editor testov)
**Prečo je dôležité:** Gestor potrebuje vytvárať a upravovať testy s pokročilými možnosťami.

**Chýba:**
- Visual test builder
- Question ordering (drag & drop)
- Section management (test sections)
- Point allocation per question
- Test preview mode
- Test duplication
- Test templates

**Súbory na rozšírenie:**
- `app/(admin-protected)/tests/[id]/edit/page.tsx` (nová stránka)
- `components/TestBuilder.tsx` (nový komponent)
- Update `app/api/tests/[id]/route.ts`

**Odhad:** ~8-10 hodín práce

---

### 5. 🟡 2FA Implementation (Two-Factor Authentication)
**Prečo je dôležité:** Bezpečnosť pre admin/gestor účty.

**Čo je hotové:**
- ✅ Security settings page (UI pre zapnutie/vypnutie 2FA)
- ✅ Database fields (twoFactorEnabled, twoFactorSecret)

**Chýba:**
- OTP generation (TOTP, Google Authenticator)
- QR code generation pre setup
- OTP verification pri logine
- Backup codes (recovery codes)
- 2FA enforcement policy

**Súbory na vytvorenie/úpravu:**
- `app/api/auth/2fa/setup/route.ts`
- `app/api/auth/2fa/verify/route.ts`
- `app/admin/login/2fa/page.tsx`
- Update `app/api/auth/[...nextauth]/route.ts`

**Technológie:**
- `speakeasy` (TOTP library)
- `qrcode` (QR code generation)

**Odhad:** ~4-6 hodín práce

---

## 📊 Sumár MVP Critical Features

| Feature | Priorita | Odhad času | Status |
|---------|----------|------------|--------|
| Evaluation Form | 🔴 Critical | 6-8h | ❌ Not started |
| Question Battery | 🔴 Critical | 10-12h | ❌ Not started |
| PDF Generation | 🔴 Critical | 6-8h | ❌ Not started |
| Gestor Test Editor | 🟡 Important | 8-10h | ❌ Not started |
| 2FA Implementation | 🟡 Important | 4-6h | 🟡 Partial (UI done) |

**Celkový odhad zvyšnej práce:** ~34-44 hodín

---

## 🚀 Post-MVP Features (Nice-to-have)

### Monitoring a Logging
- Audit logs (user actions)
- System health monitoring
- Error tracking (Sentry)
- Performance metrics

### Email Notifications
- Email templates
- Applicant notifications (test assigned, results ready)
- Admin notifications (new application, test completed)
- Email queue (background jobs)

### Reporting a Analytics
- Advanced statistics
- Custom reports
- Data visualization (charts)
- Export do Excel

### API Integrations
- REST API pre externe systémy
- Webhook support
- API documentation (Swagger)
- API authentication (API keys)

### Advanced Security
- IP whitelisting
- Session management (force logout)
- Security audit trail
- GDPR compliance features

### UX Improvements
- Onboarding wizard
- Help tooltips
- Keyboard shortcuts
- Dark mode

---

## 📝 Poznámky

### Technický debt
- ⚠️ Niektoré E2E testy potrebujú update (applicants-list zlyhávali)
- ⚠️ .env.local sa nesmie dostať na production (dokumentované v BUGFIX-localhost-redirect.md)
- ⚠️ Prisma generate po každej zmene schémy (zdokumentované v CLAUDE.md)

### Dokumentácia
- ✅ Technická architektúra (`docs/01-technicka-architektura.md`)
- ✅ Tech stack (`docs/02-tech-stack.md`)
- ✅ Testovanie (`docs/13-testovanie.md`)
- ✅ Patterns (form validation, UI components, E2E tests)
- ✅ MVP roadmap (`docs/08-mvp-roadmap.md`)

### Testing Coverage
- ✅ E2E tests pre core flows (login, dashboard, applicants, tests)
- ✅ Backend API tests (CRUD operations)
- ⚠️ Frontend unit tests (minimal coverage)

---

## 🎯 Next Steps

1. **Priorita 1:** Evaluation Form (najviac kritická funkcionalita)
2. **Priorita 2:** Question Battery (potrebné pre kompletný test workflow)
3. **Priorita 3:** PDF Generation (export výsledkov)
4. **Priorita 4:** Gestor Test Editor (UX improvement)
5. **Priorita 5:** 2FA Implementation (dokončiť bezpečnosť)

---

## 📞 Kontakt & Podpora

- **Production:** https://vk.retry.sk
- **Development:** http://localhost:5600
- **GitHub Issues:** Potrebné doplniť URL
- **Dokumentácia:** `/docs/` folder
