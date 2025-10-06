# Otvorené otázky

Tento dokument obsahuje otvorené otázky a diskusné body, ktoré treba vyriešiť počas vývoja.

---

##
Moze byt viac gestorov vo VK?
Co sa ma stat, ak chcem vymazat VK ktore skoncilo?
Je CIS ID unikatne na uchadzaca alebo je to identifikator cloveka?
MA VK nejaky datum zaciatku a konca?


## Sumarizácia otvorených otázok

| # | Otázka | Status | Priorita |
|---|--------|--------|----------|
| 1 | Soft delete vs hard delete | ✅ VYRIEŠENÉ (soft delete) | Vysoká |
| 2 | Oddelené tabuľky pre uchádzačov | ✅ VYRIEŠENÉ (samostatná tabuľka) | Vysoká |
| 3 | Validácia komisie pri vymazaní | 🔄 ČAKÁ NA ROZHODNUTIE | Stredná |
| 4 | Username vs email vs priezvisko | ✅ VYRIEŠENÉ (username) | Vysoká |
| 5 | Prihlasovanie - obrazovky a URL | 🔄 ČAKÁ NA ROZHODNUTIE | Vysoká |
| 6 | Zobrazenie v histórii | ✅ VYRIEŠENÉ (soft delete) | Nízka |
| 7 | Multi-tenancy - Rezorty | ✅ VYRIEŠENÉ (implementovať teraz) | Vysoká |
| 8 | Gestor/Komisia - viazaní na rezort? | ✅ VYRIEŠENÉ (áno, viazaní) | Vysoká |
| 9 | Reset hesla pre uchádzača | 🔄 ČAKÁ NA ROZHODNUTIE | Stredná |
| 10 | URL routing - centrálna definícia | 🔄 ČAKÁ NA ROZHODNUTIE | Stredná |
| 11 | Kategórie testov - globálne vs lokálne | 🔄 ČAKÁ NA ROZHODNUTIE | Nízka |

---

## 1. Vymazanie používateľa vs Deaktivácia

**Dátum:** 2025-10-04

### Soft delete implementácia

**Rozhodnutie:**
- Používame **soft delete** (nie fyzické vymazanie z DB)
- Pri vymazaní: `email = NULL`, `deletedEmail = 'pôvodný@email.sk'`, `deleted = true`

**Dôvod:**
- V ukončených VK sa musí zobrazovať meno vymazaného používateľa
- História a audit log musia zostať zachované
- Možnosť obnovenia účtu v budúcnosti

### Problém: Email unikátnosť

**Scenár:**
1. Vytvorím používateľa `jozef@mirri.gov.sk`
2. Vymažem ho (soft delete) → `email = NULL`, `deletedEmail = jozef@mirri.gov.sk`
3. Chcem vytvoriť nového používateľa s emailom `jozef@mirri.gov.sk`

**Riešenie:**
- `email String? @unique` - nullable s unique constraint
- Vymazaní používatelia majú `email = NULL` (viacero záznamov môže mať NULL)
- Nový používateľ môže použiť ten istý email

**Alternatívne riešenie (ak by to nefungovalo):**
- Pri vymazaní: `email = 'deleted_1696421234_jozef@mirri.gov.sk'`
- Prefix `deleted_` + timestamp zabezpečí unikátnosť

---

### Deaktivácia vs Vymazanie

| Vlastnosť | Deaktivácia | Vymazanie (soft delete) |
|-----------|-------------|-------------------------|
| Email | Ostáva v DB | `NULL` |
| Prihlásenie | ❌ Nemožné | ❌ Nemožné |
| Zobrazenie v zozname | ✅ Áno | ❌ Nie |
| Zobrazenie v ukončených VK | ✅ Áno | ✅ Áno (z histórie) |
| Možnosť reaktivácie | ✅ Áno (1 klik) | 🔄 Možné, ale zložitejšie |
| Vytvorenie nového účtu s rovnakým emailom | ❌ Nie | ✅ Áno |

**Odporúčanie:**
- **Deaktivácia**: Dočasné zablokovanie (dovolenka, zmena pozície)
- **Vymazanie**: Trvalé ukončenie spolupráce (odchod zo štátnej služby)

---

## 2. Oddelená tabuľka pre uchádzačov

**Dátum:** 2025-10-04

### Problém: Username unikátnosť

**Požiadavka:**
- Admin/Gestor/Komisia: `username` musí byť **unikátne** (prihlasovacie meno)
- Uchádzač: môže byť v DB **5x** (rôzne VK s rovnakým CIS identifikátorom)

**Konflikt:**
- Ak máme jednu tabuľku `User` s `username @unique`, uchádzač nemôže byť 5x v DB!

### Riešenie A: Oddelené tabuľky (ODPORÚČANÉ ✅)

```prisma
// Tabuľka pre trvalé účty
model User {
  id       String @id @default(cuid())
  username String @unique              // prihlasovacie meno (unikátne!)
  email    String? @unique             // nullable kvôli soft delete
  deletedEmail String?
  name     String
  surname  String
  role     UserRole                    // ADMIN, GESTOR, KOMISIA (NIE UCHADZAC!)

  deleted  Boolean @default(false)
  deletedAt DateTime?

  // Relations
  gestorVKs VyberoveKonanie[] @relation("GestorVK")
  commissionMemberships CommissionMember[]
}

// Tabuľka pre dočasné účty uchádzačov
model Candidate {
  id            String @id @default(cuid())
  vkId          String
  cisIdentifier String                 // login (z CIS ŠS)
  email         String?
  name          String
  surname       String

  deleted       Boolean @default(false)
  deletedEmail  String?
  deletedAt     DateTime?

  // Relations
  vk            VyberoveKonanie @relation(...)
  testResults   TestResult[]
  documents     Document[]

  @@unique([vkId, cisIdentifier])      // Ten istý CIS ID len 1x v jednom VK
}
```

**Výhody:**
- Jasné oddelenie trvalých vs dočasných účtov
- `User.username` môže byť `@unique`
- Uchádzač môže existovať viackrát (rôzne VK)
- Jednoduchšie queries a validácie
- Menšia tabuľka `User` (len trvalé účty)

**Nevýhody:**
- Duplicita kódu (autentifikácia pre 2 typy účtov)
- Komplexnejšie queries ak potrebujeme "všetkých používateľov"

---

### Riešenie B: Jedna tabuľka s nullable username

```prisma
model User {
  username String? @unique             // NULL pre UCHADZAC
  email    String? @unique
  role     UserRole                    // ADMIN, GESTOR, KOMISIA, UCHADZAC

  candidates Candidate[]               // 1:N pre uchádzačov
}
```

**Výhody:**
- Jedna tabuľka pre všetkých
- Jednoduchšia autentifikácia

**Nevýhody:**
- `username` je nullable → validácia komplikovanejšia
- Zmiešané trvalé a dočasné účty
- User tabuľka bude mať tisíce záznamov (uchádzači)

---

### Otázka na rozhodnutie:

**Chceme oddelenú tabuľku pre uchádzačov?**

**Odporúčanie:** ✅ **ÁNO** - Riešenie A (oddelené tabuľky)

---

## 3. Validácia komisie pri vymazaní člena

**Dátum:** 2025-10-04

### Problém: Nepárny počet členov komisie

**Požiadavka:**
- Komisia musí mať **nepárny počet členov** (minimálne 3)
- Jeden člen je označený ako **predseda** komisie

**Scenár:**
1. VK má komisiu: 3 členovia (predseda + 2 členovia)
2. Admin chce vymazať jedného člena
3. Po vymazaní: 2 členovia → **PÁRNY počet** ❌ NEVALIDNÉ!

### Otázky:

1. **Blokovať vymazanie?**
   - ❌ ERROR: "Nemožno vymazať člena. Komisia musí mať nepárny počet."
   - ⚠️ WARNING: "Pozor! Po vymazaní bude komisia nevalidná. Chcete pokračovať?"

2. **Čo ak vymažeme predsedu komisie?**
   - Automaticky vybrať nového predsedu?
   - Označiť komisiu ako nevalidnú?
   - Blokovať vymazanie predsedu?

3. **Platí validácia len pre aktívne VK?**
   - Pre UKONČENÉ VK: validácia neplatí (história)
   - Pre AKTÍVNE/BUDÚCE VK: validácia PLATÍ

### Návrh riešenia:

**Stupeň 1: Kontrola stavu VK**
```typescript
if (vk.status === 'UKONCENE' || vk.status === 'ARCHIVOVANE') {
  // Povoliť vymazanie bez kontroly
} else {
  // Aktívne/Budúce VK → ďalšia kontrola
}
```

**Stupeň 2: Kontrola počtu členov**
```typescript
const remainingMembers = commission.members.length - 1;

if (remainingMembers < 3) {
  // ERROR: "Komisia musí mať minimálne 3 členov"
  return error;
}

if (remainingMembers % 2 === 0) {
  // WARNING: "Po vymazaní bude komisia mať párny počet členov (X). Chcete pokračovať?"
  showWarningModal();
}
```

**Stupeň 3: Kontrola predsedu**
```typescript
if (memberToDelete.isChairman) {
  // WARNING: "Mažete predsedu komisie! Bude potrebné vybrať nového predsedu."
  // Možnosť: Automaticky povýšiť najstaršieho člena?
}
```

---

### Otázka na rozhodnutie:

1. **Povoliť vymazanie člena komisie ak to poruší validáciu nepárneho počtu?**
   - A) ❌ Blokovať (ERROR)
   - B) ⚠️ Povoliť s warningom
   - C) ⚠️ Povoliť, ale označiť VK ako nevalidné (musí sa doplniť člen)

2. **Vymazanie predsedu:**
   - A) Blokovať
   - B) Povoliť s warningom + manuálny výber nového predsedu
   - C) Povoliť + automaticky vybrať nového predsedu

**Odporúčanie:** 1-C, 2-B

---

## 4. Prihlásenie - Username vs Email

**Dátum:** 2025-10-04

### Zo zadania:

> "Ako login pre uchádzača sa používa identifikátor zo systému CIS ŠS; login pre člena komisie je jeho priezvisko."

### Interpretácia:

- **Uchádzač:** login = CIS identifikátor (napr. `1234567890`)
- **Komisia:** login = priezvisko (napr. `Novák`)
- **Admin/Gestor:** login = ??? (nie je špecifikované)

### Problém:

**Ak je login = priezvisko:**
- Priezvisko **NIE JE** unikátne! (viacero ľudí s priezviskom "Novák")
- Ako rozlíšime 2 členov komisie s rovnakým priezviskom?

### Možné riešenia:

**A) Username = vlastné prihlasovacie meno (ODPORÚČANÉ ✅)**
```prisma
model User {
  username String @unique    // napr. "novak.jozef", "kovacova.maria"
  email    String? @unique
  surname  String            // priezvisko (nie login!)
}
```
- Admin zadá username pri vytváraní účtu (napr. `priezvisko.meno`)
- Garantovaná unikátnosť

**B) Username = priezvisko + generovaný suffix**
- Prvý Novák: `novak`
- Druhý Novák: `novak2`
- Treťí Novák: `novak3`

**C) Login = email**
- Ignorujeme zadanie
- Všetci sa prihlásia emailom

### Otázka na rozhodnutie:

**Ako sa budú prihlásiť Admin/Gestor/Komisia?**
- A) Username (vlastné prihlasovacie meno) ✅ ODPORÚČAM
- B) Email
- C) Priezvisko (problém s duplicitou)

---

## 5. Prihlasovanie - obrazovky a URL

**Dátum:** 2025-10-04

### Problém:

Máme 2 typy účtov s rôznymi prihlasovacími údajmi:
1. **Trvalé účty** (Superadmin/Admin/Gestor/Komisia) - username + heslo
2. **Dočasné účty** (Uchádzač) - VK identifikátor + CIS identifikátor + heslo

**Uchádzač potrebuje vybrať VK**, trvalé účty nie.

### Možnosti:

**Možnosť A: Jedna prihlasovacia obrazovka**
- Login: username alebo CIS identifikátor
- VK identifikátor: [voliteľné - len pre uchádzača, skryté pre iných]
- Heslo: heslo
- Backend rozhodne podľa formátu loginu
- **Problém:** Zložitejšia validácia, mätúce UX

**Možnosť B: Dve oddelené obrazovky ✅ ODPORÚČAM**
- **`/admin`** → Superadmin/Admin/Gestor/Komisia
  - Username + heslo
  - Link "Reset hesla"
- **`/login`** → Uchádzač
  - VK identifikátor (dropdown zo zoznamu aktívnych VK)
  - CIS identifikátor + heslo
  - **BEZ** reset hesla (kontaktuje admina)

### Návrh URL (používateľ):
- `/admin` - prihlásenie pre Superadmin/Admin/Gestor/Komisia
- `/login` - prihlásenie pre Uchádzača
- `/set-password?token={token}` - nastavenie hesla (trvalé účty)
- `/reset-password?token={token}` - reset hesla (trvalé účty)

**Výhody riešenia B:**
- Jasné oddelenie úloh
- Lepší UX (uchádzač vie kam ísť)
- Jednoduchšie validácie
- Link na uchádzačské prihlásenie môže byť v emaili

### Otázka na rozhodnutie:

1. **Koľko prihlasovacích obrazoviek?** (1 vs 2)
2. **Aké URL?** (`/admin` a `/login` alebo iné?)

**Odporúčanie:** Možnosť B (2 obrazovky, `/admin` a `/login`)

---

## 6. Soft delete - zobrazenie v histórii

**Dátum:** 2025-10-04

### Požiadavka:

> "Aj po deaktivácii a vymazaní sa bude meno zobrazovať v ukončených VK"

### Riešenie:

**Možnosť A: Soft delete (používateľ v DB)**
- Vymazaný používateľ má `deleted = true`
- V ukončených VK sa načíta z DB (JOIN)
- Jednoduché

**Možnosť B: Denormalizácia (uložiť meno priamo v Commission/VK)**
```prisma
model CommissionMember {
  userId    String?         // NULL ak je používateľ vymazaný
  userName  String          // uložené meno (pre históriu)
  userSurname String        // uložené priezvisko
}
```
- Aj po hard delete máme meno v histórii
- Komplexnejšie (duplicita dát)

**Rozhodnutie:** Možnosť A (soft delete stačí)

---

## 7. Multi-tenancy - Rezorty

**Dátum:** 2025-10-04

### Požiadavka:

Systém môže byť buď:
- **Centralizovaný** - všetky ministerstvá v jednej inštancii
- **Decentralizovaný** - každé ministerstvo má vlastnú kópiu

Ak centralizovaný:
- Admin z MZV nevidí VK z Ministerstva vnútra
- Admin z MZV nevidí adminov z Ministerstva vnútra
- Potreba **Superadmin** role pre správu rezortov a adminov
- Admin môže byť priradený k **viacerým rezortom** (napr. MZ + MŠ)
- Gestor/Komisia môžu byť zdieľaní medzi rezortmi (experti)

### Rozhodnutie: ✅ VYRIEŠENÉ

**Implementovať multi-tenancy TERAZ** s názvom **"Rezort"**

**Riešenie:**
1. Nová entita `Institution` (Rezort) - ministerstvá, úrady
2. Nová rola `SUPERADMIN` - správca celého systému
3. Admin priradený k 1 alebo viac rezortom (M:N)
4. VK patrí k 1 rezortu
5. Gestor/Komisia môžu byť priradení k VK z iného rezortu

**Názov:** **Rezort** (nie Inštitúcia, Organizačná jednotka, atď.)

**Implementácia:**
- Viď `docs/16-role-a-opravnenia.md` pre detaily
- Databázový model: `Institution`, `User.institutions[]`, `VyberoveKonanie.institutionId`
- Superadmin obrazovky: Správa rezortov, Správa adminov

---

## 8. Gestor/Komisia - viazaní na rezort alebo globálni?

**Dátum:** 2025-10-04

### Pôvodný návrh:
- Gestor/Komisia sú **globálni** (nie sú viazaní na rezort)
- Admin z MZ môže priradiť gestora z MV k svojmu VK
- Zdieľaní experti medzi rezortmi

### Problém:
- Ako vyberie admin z MZ gestora z MV? (zoznam všetkých gestorov?)
- Komplikované filtrovanie

### Rozhodnutie: ✅ VYRIEŠENÉ

**Gestor/Komisia SÚ viazaní na rezort** (cez vytvorenie adminom)

**Pravidlá:**
1. Admin vytvára Gestora/Komisiu → automaticky priradený k rezortu admina
2. Admin vidí len Gestorov/Komisiu svojho rezortu (ktorých vytvoril on alebo iný admin toho istého rezortu)
3. Gestor/Komisia NEMÔŽU byť zdieľaní medzi rezortmi

**Výhody:**
- Jednoduché filtrovanie
- Jasné rozdelenie používateľov po rezortoch
- Každý rezort má svojich ľudí

**Nevýhody:**
- Ak ten istý človek pracuje pre 2 rezorty → musí mať 2 účty (alebo Admin musí byť priradený k obom rezortom a vytvoriť 1 účet)

**Implementácia:**
- Gestor/Komisia majú `institutions[]` (M:N) rovnako ako Admin
- Pri vytváraní Gestora/Komisie → admin priradí k svojmu rezortu (alebo viacerým, ak má viac)
- Zoznam Gestorov/Komisie filtrovaný podľa rezortu admina

---

## 9. Reset hesla pre uchádzača

**Dátum:** 2025-10-04

### Problém:

Uchádzač má **dočasný účet** s **dočasným heslom** pre jedno konkrétne VK.

V podkladoch (PDF zadanie) nie je špecifikované, či môže uchádzač resetovať heslo.

### Možnosti:

**Možnosť A: Uchádzač NEMÔŽE resetovať heslo ✅ ODPORÚČAM**
- Dočasný účet s dočasným heslom pre jedno VK
- Ak zabudne heslo → kontaktuje admina/gestora
- Admin/Gestor mu vygeneruje nový prístup
- **Výhody:**
  - Jednoduchšie (bez reset flow pre uchádzača)
  - Bezpečnejšie (uchádzač nemôže manipulovať s účtom)
  - Konsistentné s konceptom dočasného účtu
- **Nevýhody:**
  - Uchádzač musí kontaktovať admina (horšie UX)

**Možnosť B: Uchádzač MÔŽE resetovať heslo**
- Prihlasovacia obrazovka `/login` má link "Zabudli ste heslo?"
- Uchádzač zadá: VK identifikátor + CIS identifikátor + email
- Dostane email s resetovacím linkom
- **Výhody:**
  - Lepší UX (samoobsluha)
- **Nevýhody:**
  - Komplexnejšie (extra funkcionalita pre dočasné účty)
  - Bezpečnostné riziko (uchádzač môže obísť kontrolu)

### Otázka na rozhodnutie:

**Môže uchádzač resetovať heslo?**
- A) ✅ NIE - kontaktuje admina/gestora
- B) ÁNO - má vlastný reset flow

**Odporúčanie:** Možnosť A (uchádzač NEMÔŽE resetovať heslo)

---

## 10. URL routing - centrálna definícia

**Dátum:** 2025-10-04

### Problém:

URL sú roztrúsené v dokumentácii na viacerých miestach. Ak zmeníme URL, musíme to upravovať na 30+ miestach.

### Návrh riešenia:

**Vytvoriť centrálny súbor s definíciou všetkých URL:**

`docs/17-url-routing.md`

```markdown
## Verejné URL (neautentifikované)
- /login - prihlásenie uchádzača
- /admin - prihlásenie admin/gestor/komisia/superadmin
- /set-password?token={token} - nastavenie hesla (trvalé účty)
- /reset-password?token={token} - reset hesla (trvalé účty)

## Admin/Superadmin URL
- /admin/dashboard
- /admin/users - zoznam používateľov
- /admin/users/new - nový používateľ
- /admin/users/:id - detail používateľa
- /admin/vk - zoznam VK
- /admin/vk/new - nové VK
- /admin/vk/:id - detail VK
...

## API Endpoints
- POST /api/auth/login
- POST /api/auth/set-password
- GET /api/admin/users
...
```

**V obrazovkách potom len odkaz:**
```markdown
Navigácia: `/admin/users/new` (viď docs/17-url-routing.md)
```

### Otázka na rozhodnutie:

1. **Vytvoriť centrálny súbor URL?** (ÁNO/NIE)
2. **Aký formát?** (Markdown tabuľka / JSON / TypeScript konštanty)

**Odporúčanie:** ÁNO - vytvoriť `docs/17-url-routing.md` (Markdown tabuľka)

---

## 11. Kategórie a typy testov - zdieľanie medzi rezortmi

**Dátum:** 2025-10-06

### Súčasný stav:

**Implementované:**
- ✅ `TestType` model - editovateľné typy testov (napr. "Štátny jazyk", "Cudzí jazyk")
- ✅ `TestCategory` model s poľom `typeId` (odkaz na TestType model)
- ✅ Kategórie obsahujú testy a patria k typom testov
- ✅ Hierarchia: TestType 1:N TestCategory 1:N Test
- ✅ Používatelia môžu filtrovať testy podľa kategórií alebo typov
- ✅ SUPERADMIN môže spravovať typy testov a kategórie cez UI

### Otázka:

**Sú kategórie a typy testov globálne (zdieľané medzi rezortmi) alebo lokálne (každý rezort má svoje)?**

**Možnosť A: Globálne (všetci vidia všetko) ✅ SÚČASNÁ IMPLEMENTÁCIA**
- Kategórie sú zdieľané medzi všetkými rezortmi
- SUPERADMIN vytvára kategórie centrálne
- Všetci vidia všetky kategórie a typy testov
- **Výhody:**
  - Jednoduchšie (už implementované)
  - Jednotná taxonomia testov naprieč celým systémom
  - Znovupoužiteľnosť testov medzi rezortmi
- **Nevýhody:**
  - Rezorty nemôžu mať vlastné špecifické kategórie
  - Väčší zoznam kategórií na výber

**Možnosť B: Lokálne (každý rezort má svoje)**
- Pridať `institutionId` do `TestCategory`
- Admin vytvára kategórie pre svoj rezort
- Každý rezort má svoje kategórie
- **Výhody:**
  - Flexibilita - každý rezort si prispôsobí kategórie
  - Menší zoznam kategórií pri filtráciach
- **Nevýhody:**
  - Komplexnejšie (vyžaduje zmenu schémy)
  - Duplicita (viacero rezortov vytvorí "Slovenský jazyk A1")
  - Nemožnosť zdieľať testy medzi rezortmi

**Možnosť C: Hybridné (globálne + lokálne)**
- SUPERADMIN vytvára globálne kategórie (pre všetkých)
- Admin môže vytvoriť lokálne kategórie (len pre svoj rezort)
- **Výhody:**
  - Flexibilita + jednotnosť
- **Nevýhody:**
  - Najkomplexnejšie riešenie

### Budúce rozšírenie:

Ak sa rozhodneme meniť z globálneho na lokálne/hybridné:

```prisma
model TestCategory {
  id            String      @id @default(cuid())
  name          String      @unique

  // Aktuálna implementácia: odkaz na TestType model
  typeId        String?
  type          TestType?   @relation(fields: [typeId], references: [id], onDelete: SetNull)

  description   String?

  // Pre lokálne/hybridné riešenie (budúce rozšírenie):
  institutionId String?                                    // NULL = globálna kategória
  institution   Institution? @relation(...)
  isGlobal      Boolean     @default(false)                // TRUE = vytvorená SUPERADMINom

  tests         Test[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([name, institutionId])                          // Unikátny názov v rámci rezortu
  @@map("test_categories")
}
```

### Otázka na rozhodnutie:

**Majú byť kategórie a typy testov globálne alebo lokálne?**
- A) ✅ Globálne (súčasný stav) - jednoduchšie, centrálna taxonomia
- B) Lokálne - každý rezort má svoje
- C) Hybridné - kombinácia oboch

**Odporúčanie:** Možnosť A (globálne) - zatiaľ ponechať súčasný stav. Ak sa v budúcnosti ukáže potreba lokálnych kategórií, možno rozšíriť na hybridné riešenie.

**Status:** 🔄 ČAKÁ NA ROZHODNUTIE

---

## Poznámky

- Tento dokument sa priebežne aktualizuje
- Po vyriešení otázky → označiť ako ✅ VYRIEŠENÉ
- Pridávať nové otázky podľa potreby
