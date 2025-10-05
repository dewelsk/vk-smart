# MVP Roadmap

## Prehľad MVP

**Cieľ:** Funkčný systém digitalizácie výberových konaní s kľúčovými funkciami.

**Časový rámec:** 4-5 týždňov (v závislosti od kapacity tímu)

**Technológie:** Next.js 14, PostgreSQL, IDSK (verejná časť), Tailwind (admin)

---

## Fáza 1: Foundation & Auth (Týždeň 1)

### 1.1 Project Setup
**Čas: 1 deň**

- [x] Inicializácia Next.js projektu
- [x] Docker Compose setup (PostgreSQL, App, Adminer)
- [x] Prisma setup + databázová schéma
- [x] Základná štruktúra adresárov
- [x] Git repository + .gitignore
- [x] Environment variables (.env.example)

**Výstup:** Projekt beží na `localhost:5600`, DB na `5601`, Adminer na `5602`

### 1.2 Autentifikácia (bez 2FA)
**Čas: 2 dni**

- [ ] NextAuth.js v5 setup
- [ ] Credentials provider
- [ ] Bcrypt hashing
- [ ] Session management
- [ ] Login page (IDSK dizajn)
- [ ] Middleware pre protected routes

**Výstup:** Funkčné prihlásenie pre všetky role

### 1.3 RBAC & Layouts
**Čas: 2 dni**

- [ ] Role-based access control
- [ ] Layout pre Admin (Tailwind)
- [ ] Layout pre Gestor (Tailwind)
- [ ] Layout pre Komisiu (IDSK/Tailwind)
- [ ] Layout pre Uchádzača (IDSK)
- [ ] Redirect logic podľa roly

**Výstup:** Každá rola má svoj dashboard

---

## Fáza 2: Admin - VK Management (Týždeň 2)

### 2.1 Tvorba Výberového Konania
**Čas: 2 dni**

- [ ] Admin dashboard (základný)
- [ ] Formulár na vytvorenie VK (hlavička)
- [ ] API endpoint: `POST /api/admin/vk`
- [ ] Zoznam VK (tabuľka)
- [ ] API endpoint: `GET /api/admin/vk`
- [ ] Detail VK

**Výstup:** Admin vie vytvoriť VK a vidieť zoznam

### 2.2 Správa Používateľov
**Čas: 2 dni**

- [ ] Formulár na vytvorenie používateľa (single)
- [ ] API endpoint: `POST /api/admin/users`
- [ ] Generovanie dočasného hesla
- [ ] Email notifikácia (simulovaná - console.log)
- [ ] Zoznam používateľov
- [ ] API endpoint: `GET /api/admin/users`

**Výstup:** Admin vie vytvoriť účty pre Gestor, Komisiu, Uchádzačov

### 2.3 CSV Import Uchádzačov
**Čas: 1 deň**

- [ ] Upload CSV súboru
- [ ] Parsing a validácia
- [ ] API endpoint: `POST /api/admin/users/bulk`
- [ ] Batch vytvorenie účtov
- [ ] Error handling (duplicity, neplatné dáta)

**Výstup:** Admin vie hromadne vytvoriť uchádzačov z CSV

---

## Fáza 3: Testy (Týždeň 2-3)

### 3.1 Gestor - Editor Testov
**Čas: 2 dni**

- [ ] Formulár na vytvorenie testu
- [ ] Editor otázok (3 odpovede, 1 správna)
- [ ] API endpoint: `POST /api/tests`
- [ ] Ukladanie testov do knižnice
- [ ] Zoznam mojich testov (Gestor)
- [ ] Schvaľovací workflow (Gestor → Admin)

**Výstup:** Gestor vie vytvoriť test a odoslať na schválenie

### 3.2 Admin - Priradenie Testov k VK
**Čas: 1 deň**

- [ ] Schvaľovanie testov od Gestora
- [ ] Priradenie testu k VK
- [ ] Nastavenie parametrov (počet otázok, čas, body, level)
- [ ] API endpoint: `POST /api/admin/tests/assign`

**Výstup:** Admin vie priradiť test k VK s parametrami

### 3.3 Uchádzač - Testovací Modul
**Čas: 3 dni**

- [ ] Zoznam testov pre uchádzača
- [ ] API endpoint: `GET /api/tests/candidate/[id]`
- [ ] Spustenie testu
- [ ] API endpoint: `POST /api/tests/[id]/start`
- [ ] Testovacia obrazovka (IDSK dizajn)
  - [ ] Zobrazenie otázok
  - [ ] Výber odpovedí
  - [ ] Časovač (countdown)
  - [ ] Progress bar
- [ ] Odoslanie testu
- [ ] API endpoint: `POST /api/tests/[id]/submit`
- [ ] Automatické vyhodnotenie
- [ ] Zobrazenie výsledkov

**Výstup:** Uchádzač vie absolvovať test a vidieť výsledok

---

## Fáza 4: Hodnotenie (Týždeň 3-4)

### 4.1 Admin - Konfigurácia Hodnotenia
**Čas: 1 deň**

- [ ] Výber hodnotených vlastností (10 možností)
- [ ] Priradenie batérie otázok
- [ ] Vytvorenie komisie (výber členov)
- [ ] API endpoint: `POST /api/admin/evaluation-config`

**Výstup:** Admin vie nakonfigurovať hodnotenie pre VK

### 4.2 Komisia - Hodnotenie Uchádzačov
**Čas: 3 dni**

- [ ] Zoznam uchádzačov pre komisiu
- [ ] API endpoint: `GET /api/evaluations/[vkId]/candidates`
- [ ] Detail uchádzača
  - [ ] Zobrazenie dokumentov (CV, certifikáty)
  - [ ] Výsledky testov
- [ ] Hodnotiacu formulár
  - [ ] Výber vlastností (preddefinované)
  - [ ] Batéria otázok
  - [ ] Bodovanie 1-5
  - [ ] Validácia max. 2 body rozdiel medzi členmi
- [ ] API endpoint: `POST /api/evaluations/submit`
- [ ] Sumárny prehľad hodnotení

**Výstup:** Komisia vie hodnotiť uchádzačov a vidieť výsledky

### 4.3 Upload Dokumentov
**Čas: 1 deň**

- [ ] Upload dokumentov (CV, certifikáty)
- [ ] API endpoint: `POST /api/documents/upload`
- [ ] Uloženie do lokálneho úložiska
- [ ] Zobrazenie dokumentov v profile uchádzača
- [ ] Download dokumentov

**Výstup:** Admin vie nahrať dokumenty, Komisia ich vie vidieť

---

## Fáza 5: Dokumentácia & 2FA (Týždeň 4)

### 5.1 Generovanie PDF Dokumentov
**Čas: 3 dni**

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
- [ ] API endpoint: `GET /api/documents/generate-pdf/[type]/[vkId]`
- [ ] Download PDF
- [ ] Email odoslanie (simulované)

**Výstup:** Systém vie vygenerovať 3 dokumenty v PDF

### 5.2 OTP / 2FA Simulácia
**Čas: 1 deň**

- [ ] Generovanie 6-miestneho OTP kódu
- [ ] Uloženie s expiráciou (5 min)
- [ ] API endpoint: `POST /api/auth/2fa/generate`
- [ ] Verifikačná obrazovka
- [ ] API endpoint: `POST /api/auth/2fa/verify`
- [ ] Max. 3 pokusy
- [ ] Recovery kód pre Admina

**Výstup:** Admin má 2FA pri prihlásení (simulované v console)

### 5.3 Audit Log
**Čas: 1 deň**

- [ ] Logging všetkých akcií
- [ ] API endpoint: `POST /api/audit/log`
- [ ] Uloženie do DB (AuditLog model)
- [ ] Admin view audit logov
- [ ] API endpoint: `GET /api/audit`
- [ ] Filtrovanie (používateľ, akcia, dátum)

**Výstup:** Všetky akcie sú zalogované, Admin ich vie vidieť

---

## Fáza 6: Testovanie & Fixes (Týždeň 5)

### 6.1 End-to-End Testovanie
**Čas: 2 dni**

- [ ] Test flow: Admin vytvorí VK
- [ ] Test flow: Admin vytvorí uchádzačov
- [ ] Test flow: Gestor vytvorí test
- [ ] Test flow: Admin priradí test
- [ ] Test flow: Uchádzač absolvuje test
- [ ] Test flow: Komisia hodnotí
- [ ] Test flow: Generovanie dokumentácie
- [ ] Identifikácia a oprava bugov

**Výstup:** Funkčný end-to-end flow

### 6.2 UI/UX Polishing
**Čas: 2 dni**

- [ ] IDSK styling pre verejnú časť
- [ ] Responzívny dizajn
- [ ] Loading states
- [ ] Error handling & messages
- [ ] Toast notifikácie
- [ ] Validácia formulárov
- [ ] Accessibility (WCAG)

**Výstup:** Profesionálne vyzerajúca aplikácia

### 6.3 Dokumentácia
**Čas: 1 deň**

- [ ] README.md (inštalácia, spustenie)
- [ ] API dokumentácia (Swagger/OpenAPI?)
- [ ] User guide (základné použitie)
- [ ] Deployment guide

**Výstup:** Kompletná dokumentácia

---

## Mimo MVP (Post-launch)

### Nice-to-have Features:
- [ ] Všetky typy testov (6 levelov)
  - [ ] Všeobecný test
  - [ ] Test štátneho jazyka
  - [ ] Test cudzieho jazyka
  - [ ] IT zručnosti test
  - [ ] Schopnosti a vlastnosti test
- [ ] Pokročilé kombinácie testov (leveling)
- [ ] Import zo SharePointu (namiesto CSV)
- [ ] Real email sending (SMTP)
- [ ] Real OTP (SMS/Email provider)
- [ ] Real-time monitoring (WebSockets)
- [ ] Notifikácie (push, email)
- [ ] Export do Excel
- [ ] Bulk operácie (bulk delete, bulk edit)
- [ ] Pokročilé filtrovanie a search
- [ ] Statistics & reporting dashboard
- [ ] Multi-tenancy (viac organizácií)

### Technické zlepšenia:
- [ ] Unit testy (Vitest)
- [ ] Integration testy
- [ ] E2E testy (Playwright)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Performance optimalizácie
- [ ] Redis cache
- [ ] S3/Azure Blob Storage pre súbory
- [ ] CDN pre static assets
- [ ] Horizontal scaling

---

## Metriky úspechu MVP

✅ **Funkčnosť:**
- Admin vie vytvoriť VK a správať účty
- Gestor vie vytvoriť testy
- Uchádzač vie absolvovať test
- Komisia vie hodnotiť
- Systém vie vygenerovať dokumentáciu

✅ **Bezpečnosť:**
- Autentifikácia a autorizácia funkčná
- 2FA pre Admina (simulované)
- Audit log všetkých akcií
- Heslá hashované

✅ **Použiteľnosť:**
- IDSK dizajn pre verejnú časť
- Responzívny dizajn
- Intuitívne UI
- Jasné error messages

✅ **Technická kvalita:**
- Docker setup funkčný
- Databáza well-structured
- API konzistentné
- Kód type-safe (TypeScript)

---

## Denný Checklist (Example)

### Deň 1: Project Setup
```
[ ] Inicializovať Next.js projekt
[ ] Nastaviť Docker Compose
[ ] Vytvoriť Prisma schému
[ ] Nastaviť Git repo
[ ] Vytvoriť základné routes
[ ] Test: App beží na localhost:5600
```

### Deň 2: Login & Auth
```
[ ] Implementovať NextAuth.js
[ ] Vytvoriť login page (IDSK)
[ ] Implementovať credentials provider
[ ] Test: Používateľ sa vie prihlásiť
[ ] Test: Redirect podľa role
```

...atď.

---

## Rizíka & Mitigácie

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|--------|-----------------|-------|-----------|
| Oneskorenie integrácie IDSK | Stredná | Vysoký | Začať s IDSK hneď, mať fallback na Tailwind |
| Komplexnosť testovacieho modulu | Stredná | Vysoký | Zjednodušiť na MVP (len odborný test) |
| PDF generovanie problémy | Nízka | Stredný | Použiť osvedčenú knižnicu (Puppeteer) |
| Performance issues (DB queries) | Nízka | Stredný | Optimalizovať queries, pridať indexy |
| Deployment komplikácie | Stredná | Stredný | Otestovať deployment skôr, mať Docker ready |

---

## Team Assignment (Example)

**Developer 1 (Full-stack):**
- Setup projektu
- Autentifikácia
- Admin - VK Management

**Developer 2 (Frontend focus):**
- IDSK integrácia
- Uchádzač UI
- Testovací modul

**Developer 3 (Backend focus):**
- Prisma schema
- API endpoints
- PDF generovanie

**Designer (Part-time):**
- IDSK customizácia
- UI/UX review
- Accessibility check
