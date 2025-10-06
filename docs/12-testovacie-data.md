# Testovacie dáta

## Účel

Pre development a demo potrebujeme konzistentné testovacie dáta. Tieto dáta sa automaticky vytvárajú cez Prisma seed script.

**⚠️ POZOR:** Heslá sú v plain texte len pre demo účely! V produkcii sa NIKDY neukladajú plain text heslá.

---

## Testovacie účty

### 1. Admin účty

| Email | Heslo | Meno | Priezvisko | 2FA | Poznámka |
|-------|-------|------|------------|-----|----------|
| `admin@mirri.gov.sk` | `Admin123!` | Ján | Novák | Áno | Hlavný admin |
| `admin2@mirri.gov.sk` | `Admin123!` | Mária | Kovačová | Áno | Backup admin |

**Recovery kódy (pre 2FA):**
- Admin 1: `RECOVER01`
- Admin 2: `RECOVER02`

---

### 2. Vecný gestor účty

| Email | Heslo | Meno | Priezvisko | Poznámka |
|-------|-------|------|------------|----------|
| `gestor1@mirri.gov.sk` | `Gestor123!` | Peter | Horváth | Vytvoril odborné testy |
| `gestor2@mirri.gov.sk` | `Gestor123!` | Eva | Nagyová | Vytvoril jazykové testy |

---

### 3. Komisia účty

#### VK/2025/0001 - Hlavný štátny radca

| Email | Heslo | Meno | Priezvisko | Rola v komisii |
|-------|-------|------|------------|----------------|
| `predseda1@mirri.gov.sk` | `Komisia123!` | Milan | Jurčo | Predseda |
| `clen1@mirri.gov.sk` | `Komisia123!` | Anna | Blažková | Člen |
| `clen2@mirri.gov.sk` | `Komisia123!` | Tomáš | Štefánik | Člen |

#### VK/2025/0002 - Referent

| Email | Heslo | Meno | Priezvisko | Rola v komisii |
|-------|-------|------|------------|----------------|
| `predseda2@mirri.gov.sk` | `Komisia123!` | Lucia | Vargová | Predseda |
| `clen3@mirri.gov.sk` | `Komisia123!` | Martin | Kováč | Člen |
| `clen4@mirri.gov.sk` | `Komisia123!` | Zuzana | Tóthová | Člen |

---

### 4. Uchádzač účty

#### Pre VK/2025/0001 (v rôznych fázach)

| Email | Heslo | Meno | Priezvisko | CIS ID | Status |
|-------|-------|------|------------|--------|--------|
| `uchadzac1@gmail.com` | `Test123!` | Jakub | Molnár | `CIS001` | Test dokončený, úspešný |
| `uchadzac2@gmail.com` | `Test123!` | Katarína | Balogová | `CIS002` | Test dokončený, úspešný |
| `uchadzac3@gmail.com` | `Test123!` | Filip | Szabó | `CIS003` | Test dokončený, neúspešný |
| `uchadzac4@gmail.com` | `Test123!` | Monika | Poliaková | `CIS004` | Test nedokončený |
| `uchadzac5@gmail.com` | `Test123!` | Michal | Urban | `CIS005` | Neprihlásil sa |

#### Pre VK/2025/0002 (pripravuje sa)

| Email | Heslo | Meno | Priezvisko | CIS ID | Status |
|-------|-------|------|------------|--------|--------|
| `uchadzac6@gmail.com` | `Test123!` | Simona | Vašková | `CIS006` | Čaká na testy |
| `uchadzac7@gmail.com` | `Test123!` | Dávid | Lukáč | `CIS007` | Čaká na testy |

---

## Výberové konania

### VK/2025/0001 - Hlavný štátny radca

```json
{
  "identifikator": "VK/2025/0001",
  "druhKonania": "širšie vnútorné výberové konanie",
  "organizacnyUtvar": "Odbor implementácie OKP",
  "odborSS": "1.03 – Medzinárodná spolupráca",
  "funkcia": "hlavný štátny radca",
  "druhSS": "stála štátna služba",
  "datum": "2025-07-24",
  "pocetMiest": 1,
  "status": "TESTOVANIE"
}
```

**Priradené testy:**
1. Odborný test (20 otázok, 20 min, min. 12 bodov)
2. Test cudzieho jazyka - Angličtina B2 (40 otázok, 40 min, min. 14 bodov)

**Komisia:** Predseda1, Clen1, Clen2

**Uchádzači:** 5 (CIS001-CIS005)

---

### VK/2025/0002 - Referent

```json
{
  "identifikator": "VK/2025/0002",
  "druhKonania": "vnútorné výberové konanie",
  "organizacnyUtvar": "Odbor personalistiky",
  "odborSS": "1.01 – Všeobecná štátna správa",
  "funkcia": "referent",
  "druhSS": "stála štátna služba",
  "datum": "2025-08-15",
  "pocetMiest": 2,
  "status": "PRIPRAVA"
}
```

**Priradené testy:** (zatiaľ žiadne)

**Komisia:** Predseda2, Clen3, Clen4

**Uchádzači:** 2 (CIS006-CIS007)

---

### VK/2025/0003 - Riaditeľ odboru (dokončené)

```json
{
  "identifikator": "VK/2025/0003",
  "druhKonania": "širšie vnútorné výberové konanie",
  "organizacnyUtvar": "Sekcia strategického rozvoja",
  "odborSS": "1.02 – Strategické plánovanie",
  "funkcia": "riaditeľ odboru",
  "druhSS": "stála štátna služba",
  "datum": "2025-06-15",
  "pocetMiest": 1,
  "status": "DOKONCENE"
}
```

**Vybraný:** Ján Testovací (CIS999)

---

## Testy

### 1. Odborný test - Medzinárodná spolupráca

```json
{
  "id": "test_001",
  "nazov": "Odborný test - Medzinárodná spolupráca",
  "typ": "ODBORNY",
  "schvaleny": true,
  "autorId": "gestor1@mirri.gov.sk",
  "otazky": [
    {
      "id": "q1",
      "otazka": "Čo znamená skratka EÚ?",
      "odpovede": [
        "Európska únia",
        "Európske unifikované štáty",
        "Európska aliancia"
      ],
      "spravnaOdpoved": 0
    },
    {
      "id": "q2",
      "otazka": "Koľko členských štátov má EÚ v roku 2025?",
      "odpovede": [
        "25",
        "27",
        "30"
      ],
      "spravnaOdpoved": 1
    }
    // ... ďalších 18 otázok
  ]
}
```

---

### 2. Test cudzieho jazyka - Angličtina B2

```json
{
  "id": "test_002",
  "nazov": "Test z anglického jazyka - úroveň B2",
  "typ": "CUDZI_JAZYK",
  "schvaleny": true,
  "autorId": "gestor2@mirri.gov.sk",
  "otazky": [
    {
      "id": "q1",
      "otazka": "Choose the correct form: I ___ to Paris last year.",
      "odpovede": [
        "go",
        "went",
        "have gone"
      ],
      "spravnaOdpoved": 1
    }
    // ... ďalších 39 otázok
  ]
}
```

---

### 3. Všeobecný test

```json
{
  "id": "test_003",
  "nazov": "Všeobecný test",
  "typ": "VSEOBECNY",
  "schvaleny": false,
  "autorId": "gestor1@mirri.gov.sk",
  "otazky": [
    {
      "id": "q1",
      "otazka": "Kto je prezidentom SR v roku 2025?",
      "odpovede": [
        "Peter Pellegrini",
        "Zuzana Čaputová",
        "Andrej Kiska"
      ],
      "spravnaOdpoved": 0
    }
    // ... ďalších 19 otázok
  ]
}
```

---

## Výsledky testov

### Uchádzač 1 (Jakub Molnár) - Úspešný

**Odborný test:**
- Body: 16/20
- Čas: 15 min
- Úspešnosť: 80%
- Status: ÚSPEŠNÝ

**Anglický jazyk:**
- Body: 28/40
- Čas: 35 min
- Úspešnosť: 70%
- Status: ÚSPEŠNÝ

**Hodnotenie komisiou:**
- Sebadôvera: 4
- Komunikačné zručnosti: 5
- Analytické myslenie: 4
- Celkom: 13/15 (87%)

---

### Uchádzač 2 (Katarína Balogová) - Úspešná

**Odborný test:**
- Body: 18/20
- Čas: 18 min
- Úspešnosť: 90%
- Status: ÚSPEŠNÝ

**Anglický jazyk:**
- Body: 32/40
- Čas: 38 min
- Úspešnosť: 80%
- Status: ÚSPEŠNÝ

**Hodnotenie komisiou:**
- Sebadôvera: 5
- Komunikačné zručnosti: 5
- Analytické myslenie: 5
- Celkom: 15/15 (100%)

---

### Uchádzač 3 (Filip Szabó) - Neúspešný

**Odborný test:**
- Body: 10/20
- Čas: 20 min
- Úspešnosť: 50%
- Status: NEÚSPEŠNÝ (minimum 12 bodov)

**Anglický jazyk:** NEABSOLVOVAL (neprešiel odborným testom)

---

## Dokumenty (uploadnuté súbory)

### Uchádzač 1 (Jakub Molnár)

- `cv_jakub_molnar.pdf` (150 KB)
- `motivacny_list_jakub_molnar.pdf` (80 KB)
- `certifikat_angictina_b2.pdf` (200 KB)

### Uchádzač 2 (Katarína Balogová)

- `cv_katarina_balogova.pdf` (180 KB)
- `motivacny_list_katarina_balogova.pdf` (95 KB)
- `diplom_univerzita.pdf` (300 KB)

---

## Hodnotenia komisiou

### Uchádzač 1 (Jakub Molnár)

**Predseda (Milan Jurčo):**
- Sebadôvera: 4
- Komunikačné zručnosti: 5
- Analytické myslenie: 4

**Člen 1 (Anna Blažková):**
- Sebadôvera: 4
- Komunikačné zručnosti: 5
- Analytické myslenie: 4

**Člen 2 (Tomáš Štefánik):**
- Sebadôvera: 4
- Komunikačné zručnosti: 5
- Analytické myslenie: 3

**Priemer:** 4.22/5

---

### Uchádzač 2 (Katarína Balogová)

**Predseda (Milan Jurčo):**
- Sebadôvera: 5
- Komunikačné zručnosti: 5
- Analytické myslenie: 5

**Člen 1 (Anna Blažková):**
- Sebadôvera: 5
- Komunikačné zručnosti: 5
- Analytické myslenie: 5

**Člen 2 (Tomáš Štefánik):**
- Sebadôvera: 5
- Komunikačné zručnosti: 5
- Analytické myslenie: 5

**Priemer:** 5.00/5

---

## Prisma Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole, VKStatus, TestTyp } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Admin users
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@mirri.gov.sk',
      password: await bcrypt.hash('Admin123!', 10),
      name: 'Ján',
      surname: 'Novák',
      role: UserRole.ADMIN,
      otpEnabled: true,
      recoveryCode: await bcrypt.hash('RECOVER01', 10),
      active: true,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@mirri.gov.sk',
      password: await bcrypt.hash('Admin123!', 10),
      name: 'Mária',
      surname: 'Kovačová',
      role: UserRole.ADMIN,
      otpEnabled: true,
      recoveryCode: await bcrypt.hash('RECOVER02', 10),
      active: true,
    },
  });

  console.log('✅ Admin users created');

  // 2. Create Gestor users
  const gestor1 = await prisma.user.create({
    data: {
      email: 'gestor1@mirri.gov.sk',
      password: await bcrypt.hash('Gestor123!', 10),
      name: 'Peter',
      surname: 'Horváth',
      role: UserRole.GESTOR,
      active: true,
    },
  });

  const gestor2 = await prisma.user.create({
    data: {
      email: 'gestor2@mirri.gov.sk',
      password: await bcrypt.hash('Gestor123!', 10),
      name: 'Eva',
      surname: 'Nagyová',
      role: UserRole.GESTOR,
      active: true,
    },
  });

  console.log('✅ Gestor users created');

  // 3. Create Test Types and Categories
  const testType1 = await prisma.testType.create({
    data: {
      name: 'Štátny jazyk',
      description: 'Testy štátneho jazyka',
    },
  });

  const category1 = await prisma.testCategory.create({
    data: {
      name: 'Slovenský jazyk - A1',
      typeId: testType1.id,
      description: 'Základná úroveň',
    },
  });

  console.log('✅ Test types and categories created');

  // 4. Create VK
  const vk1 = await prisma.vyberoveKonanie.create({
    data: {
      identifikator: 'VK/2025/0001',
      druhKonania: 'širšie vnútorné výberové konanie',
      organizacnyUtvar: 'Odbor implementácie OKP',
      odborSS: '1.03 – Medzinárodná spolupráca',
      funkcia: 'hlavný štátny radca',
      druhSS: 'stála štátna služba',
      datum: new Date('2025-07-24'),
      pocetMiest: 1,
      status: VKStatus.TESTOVANIE,
      createdById: admin1.id,
    },
  });

  console.log('✅ VK created');

  // 5. Create Tests
  const test1 = await prisma.test.create({
    data: {
      nazov: 'Odborný test - Medzinárodná spolupráca',
      type: TestTyp.ODBORNY,        // Legacy enum (pre spätnokompatibilitu)
      categoryId: category1.id,     // NOVÁ organizácia
      schvaleny: true,
      otazky: {
        // JSON with questions
      },
    },
  });

  console.log('✅ Tests created');

  // 6. Create Candidates
  const uchadzac1 = await prisma.user.create({
    data: {
      email: 'uchadzac1@gmail.com',
      password: await bcrypt.hash('Test123!', 10),
      name: 'Jakub',
      surname: 'Molnár',
      role: UserRole.UCHADZAC,
      active: true,
    },
  });

  await prisma.candidate.create({
    data: {
      vkId: vk1.id,
      userId: uchadzac1.id,
      identifikatorCIS: 'CIS001',
    },
  });

  console.log('✅ Candidates created');

  // ... more seeding

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Spustenie seedu

```bash
# Reset DB a spustiť seed
npx prisma migrate reset

# Alebo len seed
npx prisma db seed
```

---

## Export testovacích dát (JSON)

Pre potreby testovania vytvoríme JSON súbor s testovacími dátami:

```json
// tests/fixtures/test-data.json
{
  "users": {
    "admin": {
      "email": "admin@mirri.gov.sk",
      "password": "Admin123!",
      "role": "ADMIN"
    },
    "gestor": {
      "email": "gestor1@mirri.gov.sk",
      "password": "Gestor123!",
      "role": "GESTOR"
    },
    "komisia_predseda": {
      "email": "predseda1@mirri.gov.sk",
      "password": "Komisia123!",
      "role": "KOMISIA"
    },
    "uchadzac": {
      "email": "uchadzac1@gmail.com",
      "password": "Test123!",
      "role": "UCHADZAC"
    }
  },
  "vk": {
    "vk1": {
      "identifikator": "VK/2025/0001",
      "status": "TESTOVANIE"
    }
  }
}
```

---

## Bezpečnostné poznámky

⚠️ **DÔLEŽITÉ:**

1. **Nikdy necommitovať** production credentials
2. Plain text heslá **len pre demo/dev**
3. V produkcii:
   - Generovať silné heslá
   - Používať bcrypt s min. 10 rounds
   - Rotovať credentials pravidelne
4. `.env` súbory **NIKDY** do gitu!
5. Seed script spúšťať **len v dev/test** prostredí

---

## Zhrnutie

✅ **Máme definované:**
- 2 Admin účty (s 2FA)
- 2 Gestor účty
- 6 Komisia účty (pre 2 VK)
- 7 Uchádzač účty (v rôznych fázach)
- 3 Výberové konania (rôzne statusy)
- 3 Testy (odborný, jazyk, všeobecný)
- Výsledky testov pre 3 uchádzačov
- Hodnotenia od komisie
- Dokumenty (CV, certifikáty)

✅ **Seed script** vytvorí všetky dáta automaticky

✅ **JSON export** pre E2E testy (Playwright)
