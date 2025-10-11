# Plán ďalšej práce

## Priorita 1: Oprava prihlásenia ako Uchádzač

### 1.1 Oprava horného banneru "Návrat naspäť"

**Problém:** Banner sa stráca pri otvorení testov

**Analýza:**
- Banner wrapper je v root layout `app/layout.tsx`
- Applicant layout je v `app/applicant/layout.tsx`
- Banner sa pravdepodobne nezobrazuje kvôli nested layouts

**Možné riešenia:**
1. **Option A:** Presunúť banner wrapper do applicant layout
2. **Option B:** Použiť React Context pre zdieľanie banner stavu
3. **Option C:** Vytvoriť dedicated header component v applicant layout

**Odporúčaný prístup:** Option A - jednoduchšie riešenie
- Pridať `<SwitchedUserBannerWrapper />` do `app/applicant/layout.tsx`
- Alebo presunúť kompletný layout handling

**Súbory na úpravu:**
- `app/applicant/layout.tsx`
- Možno `app/layout.tsx` (kontrola ako je banner implementovaný)

---

### 1.2 Oprava E2E testov pre applicant flow

**Problém:** E2E testy nefungujú kvôli zmene routing

**Potrebné zmeny:**
1. Aktualizovať URL v testoch: `/test/[sessionId]` → `/applicant/test/[sessionId]`
2. Aktualizovať URL v testoch: `/my-tests` → `/applicant/my-tests`
3. Skontrolovať či existujú E2E testy pre applicant flow

**Súbory na kontrolu:**
- `tests/e2e/applicant/**` (ak existuje)
- Alebo vytvoriť nové E2E testy

**Test scenáre:**
- Login ako uchádzač
- Dashboard zobrazenie
- Spustenie testu
- Vyplnenie testu
- Submit testu
- Zobrazenie výsledkov

---

## Priorita 2: Prihlásenie pre Komisiu (Používateľov)

### 2.1 Analýza požiadaviek

**Otázky na objasnenie:**
- Ako sa má komisia prihlasovať? (username/password? email?)
- Čo má komisia vidieť po prihlásení? (dashboard? zoznam VK?)
- Má komisia pristupovať k testom? (čítať výsledky? hodnotiť?)
- Má komisia pristupovať k uchadzačom? (zoznam? detaily?)

**Existujúce entity v DB:**
- `User` - môže mať rolu `KOMISAR`
- Potrebujeme vedieť:
  - Ako sa komisár priraďuje k VK?
  - Aké má komisár oprávnenia?

---

### 2.2 Implementácia komisárskeho frontendu

**Kroky:**

#### 2.2.1 Layout a routing
```
app/komisar/
  ├── layout.tsx          # Layout pre komisiu
  ├── dashboard/
  │   └── page.tsx       # Dashboard komisára
  ├── vk/
  │   ├── page.tsx       # Zoznam VK kde je komisár
  │   └── [id]/
  │       └── page.tsx   # Detail VK
  └── login/
      └── page.tsx       # Login page pre komisiu (ak treba)
```

#### 2.2.2 API endpoints
```
app/api/komisar/
  ├── dashboard/
  │   └── route.ts       # GET - dashboard data
  ├── vk/
  │   ├── route.ts       # GET - list VK
  │   └── [id]/
  │       ├── route.ts   # GET - VK detail
  │       └── candidates/
  │           └── route.ts  # GET - candidates for VK
```

#### 2.2.3 Autentifikácia
- Použiť existujúci NextAuth
- Kontrola role `KOMISAR` v middleware
- Switch na komisára z admin účtu (podobne ako switch na uchádzača)

---

### 2.3 Komisársky dashboard

**Obsah dashboardu:**
- Zoznam VK kde je komisár členom
- Počet uchadzačov v každom VK
- Status VK (príprava, testovanie, pohovory, ukončené)
- Možnosť prejsť do detailu VK

**Potrebné API:**
- GET `/api/komisar/dashboard` - vráti VK kde je používateľ komisárom

---

### 2.4 Detail VK pre komisára

**Obsah:**
- Informácie o VK
- Zoznam uchadzačov
- Výsledky testov uchadzačov
- Možnosť pridávať poznámky/hodnotenie?

**Potrebné API:**
- GET `/api/komisar/vk/[id]` - detail VK
- GET `/api/komisar/vk/[id]/candidates` - zoznam uchadzačov

---

## Technické úlohy

### 1. Banner fix (vysoká priorita)
- [ ] Analyzovať prečo sa banner stráca
- [ ] Implementovať riešenie
- [ ] Testovať switch admin → uchádzač
- [ ] Testovať switch admin → komisár (po implementácii)

### 2. E2E testy (stredná priorita)
- [ ] Aktualizovať existujúce testy
- [ ] Vytvoriť nové testy pre applicant flow
- [ ] Spustiť a opraviť zlyhané testy

### 3. Komisársky frontend (vysoká priorita)
- [ ] Vytvoriť layout a routing
- [ ] Implementovať login (ak treba)
- [ ] Vytvoriť dashboard
- [ ] Vytvoriť detail VK
- [ ] Implementovať API endpoints
- [ ] Pridať switch admin → komisár

### 4. Dokumentácia
- [ ] Aktualizovať docs s novým routing
- [ ] Dokumentovať komisársky flow
- [ ] Vytvoriť obrazovky pre komisárske UI

---

## Odhadovaný čas

- Banner fix: 1 hodina
- E2E testy: 2 hodiny
- Komisársky frontend: 4-6 hodín
  - Layout + routing: 1 hodina
  - Dashboard: 1 hodina
  - Detail VK: 2 hodiny
  - API endpoints: 1 hodina
  - Testing: 1 hodina

**Celkom: 7-9 hodín práce**

---

## Prioritizácia

1. **Najprv:** Banner fix (kritické pre UX)
2. **Potom:** Komisársky frontend (hlavná požiadavka)
3. **Nakoniec:** E2E testy (keď je všetko hotové)
