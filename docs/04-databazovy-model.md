# Databázový model - Prisma Schema

## Kompletná Prisma schéma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USERS & AUTH ====================

// POZNÁMKA: Zvážiť oddelené tabuľky pre trvalé účty (User) a dočasné účty (Candidate)
// Viď docs/15-otvorene-otazky.md - Otázka #2

enum UserRole {
  SUPERADMIN  // Správca celého systému, spravuje rezorty a adminov
  ADMIN       // Správca rezortu, vytvára VK
  GESTOR      // Spravuje konkrétne VK
  KOMISIA     // Hodnotí uchádzačov
  UCHADZAC    // Dočasný účet pre VK
}

// ==================== MULTI-TENANCY: REZORTY ====================

// Institution (Rezort) - Organizačná jednotka (ministerstvo, úrad)
// Každý Admin je priradený k 1 alebo viacerým rezortom
// Každé VK patrí k 1 rezortu
// Gestor/Komisia môžu byť priradení k VK z iného rezortu (zdieľaní experti)
model Institution {
  id          String   @id @default(cuid())
  name        String                           // "Ministerstvo zahraničných vecí a európskych záležitostí"
  code        String   @unique                 // "MZVaEZ" (krátky kód)
  description String?                          // voliteľný popis

  // Status
  active      Boolean  @default(true)          // aktívny rezort?

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       UserInstitution[]                // M:N admini priradení k rezortu
  vks         VyberoveKonanie[]                // VK patriace tomuto rezortu

  @@map("institutions")
}

// M:N join table pre User <-> Institution
// Admin môže byť priradený k viacerým rezortom
model UserInstitution {
  id            String   @id @default(cuid())

  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  // Kedy bol admin priradený k rezortu
  assignedAt    DateTime @default(now())
  assignedBy    String?                        // kto ho priradil (Superadmin ID)

  @@unique([userId, institutionId])            // Jeden user len 1x v jednom rezorte
  @@map("user_institutions")
}

// User model - Trvalé účty (Superadmin, Admin, Gestor, Komisia)
// SOFT DELETE: Pri vymazaní: email = NULL, deletedEmail = pôvodný email, deleted = true
model User {
  id            String   @id @default(cuid())
  username      String   @unique               // prihlasovacie meno (unikátne!)
  email         String?  @unique               // email (nullable kvôli soft delete)
  password      String?                        // heslo (Bcrypt hashed) - NULL ak ešte nie je nastavené!
  name          String                         // meno
  surname       String                         // priezvisko
  role          UserRole                       // rola
  note          String?                        // poznámka (špecializácia, odbor, atď.)

  // 2FA / OTP
  otpSecret     String?                        // OTP tajný kľúč
  otpEnabled    Boolean  @default(false)       // 2FA zapnuté?
  recoveryCode  String?                        // recovery kód

  // Password set token (pre nových používateľov)
  passwordSetToken       String?   @unique    // token na nastavenie hesla
  passwordSetTokenExpiry DateTime?            // expirácia tokenu (24h)

  // Soft delete
  deleted       Boolean  @default(false)       // soft delete flag
  deletedAt     DateTime?                      // kedy vymazaný
  deletedEmail  String?                        // pôvodný email vymazaného používateľa

  // Metadata
  active        Boolean  @default(true)        // aktívny?
  temporaryAccount Boolean @default(false)     // dočasný účet uchádzača?
  archivedAt    DateTime?                      // kedy archivovaný (len pre UCHADZAC)
  createdAt     DateTime @default(now())       // dátum vytvorenia
  updatedAt     DateTime @updatedAt            // dátum aktualizácie
  lastLoginAt   DateTime?                      // posledné prihlásenie

  // Relations
  institutions  UserInstitution[]              // M:N rezorty, kde je admin priradený
  createdVKs    VyberoveKonanie[]  @relation("CreatedBy")
  gestorVKs     VyberoveKonanie[]  @relation("GestorVK")  // VK kde je gestorom
  candidates    Candidate[]                    // uchádzač môže byť v N VK (teoreticky, prakticky 1)
  commissionMemberships CommissionMember[]
  evaluations   Evaluation[]
  auditLogs     AuditLog[]
  testResults   TestResult[]

  @@map("users")
}

// ==================== VÝBEROVÉ KONANIA ====================

model VyberoveKonanie {
  id                String   @id @default(cuid())
  identifier        String   @unique            // identifikátor VK (napr. VK/2025/1234)

  // Multi-tenancy: Rezort
  institutionId     String                      // rezort, ku ktorému VK patrí
  institution       Institution @relation(fields: [institutionId], references: [id])

  // Fixné polia z hlavičky
  selectionType     String                      // druh konania
  organizationalUnit String                     // organizačný útvar
  serviceField      String                      // odbor štátnej služby
  position          String                      // funkcia
  serviceType       String                      // druh štátnej služby
  date              DateTime                    // dátum

  // Počet obsadzovaných miest
  numberOfPositions Int      @default(1)        // počet miest

  // Status
  status            VKStatus @default(PRIPRAVA) // status VK

  // Priradení ľudia
  gestorId          String?                     // gestor pre toto VK (voliteľné, môže byť z iného rezortu!)
  gestor            User?    @relation("GestorVK", fields: [gestorId], references: [id])

  // Metadata
  createdById       String                      // vytvoril (user ID)
  createdBy         User     @relation("CreatedBy", fields: [createdById], references: [id])
  createdAt         DateTime @default(now())    // dátum vytvorenia
  updatedAt         DateTime @updatedAt         // dátum aktualizácie

  // Relations
  candidates        Candidate[]
  assignedTests     VKTest[]
  commission        Commission?
  evaluationConfig  EvaluationConfig?
  documents         GeneratedDocument[]

  @@map("vyberove_konania")
}

enum VKStatus {
  PRIPRAVA           // Admin pripravuje
  CAKA_NA_TESTY      // Čaká na schválené testy
  TESTOVANIE         // Prebieha testovanie
  HODNOTENIE         // Prebieha hodnotenie komisiou
  DOKONCENE          // VK dokončené
  ZRUSENE            // VK zrušené
}

// ==================== TESTY ====================

model Test {
  id            String     @id @default(cuid())
  name          String                         // názov testu
  type          TestTyp                        // typ testu
  description   String?                        // popis

  // Otázky (JSON array)
  questions     Json                           // otázky (Question[])

  // Nastavenia (pre schválenie)
  recommendedQuestionCount  Int?              // odporúčaný počet otázok
  recommendedDuration       Int?              // odporúčaná minutáž
  recommendedScore          Float?            // odporúčané body

  // Status
  approved      Boolean    @default(false)    // schválený?
  approvedAt    DateTime?                     // dátum schválenia

  // Autor
  authorId      String?                       // autor (user ID)

  // Metadata
  createdAt     DateTime   @default(now())    // dátum vytvorenia
  updatedAt     DateTime   @updatedAt         // dátum aktualizácie

  // Relations
  vkAssignments VKTest[]
  results       TestResult[]

  @@map("tests")
}

enum TestTyp {
  ODBORNY
  VSEOBECNY
  STATNY_JAZYK
  CUDZI_JAZYK
  IT_ZRUCNOSTI
  SCHOPNOSTI_VLASTNOSTI
}

// M:N relation VK <-> Test s konfiguráciou
model VKTest {
  id            String   @id @default(cuid())

  vkId          String
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  testId        String
  test          Test     @relation(fields: [testId], references: [id])

  // Level v poradí (1, 2, 3...)
  level         Int                           // level testu

  // Konfigurácia pre tento VK
  questionCount Int                           // počet otázok
  durationMinutes Int                         // čas v minútach
  scorePerQuestion Float                      // body za otázku
  minScore      Float                         // minimálne body na úspech

  createdAt     DateTime @default(now())      // dátum vytvorenia

  @@unique([vkId, testId])
  @@unique([vkId, level])  // Každý level len raz
  @@map("vk_tests")
}

// Question type (stored in JSON)
// {
//   id: string,
//   question: string,        // otázka
//   answers: string[],       // 3 odpovede
//   correctAnswer: number    // správna odpoveď - index (0, 1, 2)
// }

// ==================== KANDIDÁTI ====================

// Candidate model - Dočasné účty uchádzačov (viazané na VK)
// POZNÁMKA: Zvážiť oddelenie od User tabuľky (samostatná tabuľka bez userId)
// SOFT DELETE: Pri vymazaní: email = NULL, deletedEmail = pôvodný email, deleted = true
model Candidate {
  id                String   @id @default(cuid())

  vkId              String
  vk                VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  userId            String   // BEZ @unique - umožní N:1 (user môže mať viac candidates pre rôzne VK)
  user              User     @relation(fields: [userId], references: [id])

  // Identifikátor z CIS ŠS (používa sa ako login!)
  cisIdentifier     String                      // identifikátor z CIS ŠS

  // Kontaktné údaje
  email             String?                     // email uchádzača (voliteľné)

  // Status
  isArchived        Boolean  @default(false)    // archivovaný po skončení VK?

  // Soft delete
  deleted           Boolean  @default(false)    // soft delete flag
  deletedAt         DateTime?                   // kedy vymazaný
  deletedEmail      String?                     // pôvodný email vymazaného uchádzača

  // Metadata
  registeredAt      DateTime @default(now())    // dátum registrácie

  // Relations
  testResults       TestResult[]
  documents         Document[]
  evaluations       Evaluation[]

  @@unique([vkId, cisIdentifier])  // Ten istý CIS ID môže byť len 1x v jednom VK
  @@map("candidates")
}

// ==================== VÝSLEDKY TESTOV ====================

model TestResult {
  id            String   @id @default(cuid())

  candidateId   String
  candidate     Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  testId        String
  test          Test     @relation(fields: [testId], references: [id])

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  // Výsledky
  answers       Json                           // odpovede ({ questionId: answerIndex }[])
  score         Float                          // body získané
  maxScore      Float                          // maximálne body
  successRate   Float                          // percento úspešnosti (0-100)
  passed        Boolean                        // prešiel minimálnym prahom?

  // Čas
  startedAt     DateTime                       // čas začiatku testu
  completedAt   DateTime?                      // čas dokončenia testu
  durationSeconds Int?                         // trvanie v sekundách

  // Metadata
  createdAt     DateTime @default(now())       // dátum vytvorenia

  @@unique([candidateId, testId])
  @@map("test_results")
}

// ==================== KOMISIA ====================

model Commission {
  id            String   @id @default(cuid())

  vkId          String   @unique
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  chairmanId    String?  // predseda komisie - ID používateľa

  createdAt     DateTime @default(now())

  // Relations
  members       CommissionMember[]

  @@map("commissions")
}

model CommissionMember {
  id            String   @id @default(cuid())

  commissionId  String
  commission    Commission @relation(fields: [commissionId], references: [id], onDelete: Cascade)

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  isChairman    Boolean  @default(false)  // je predseda komisie?

  createdAt     DateTime @default(now())

  // Relations
  evaluations   Evaluation[]

  @@unique([commissionId, userId])
  @@map("commission_members")
}

// ==================== HODNOTENIE ====================

// Konfigurácia hodnotenia pre VK
model EvaluationConfig {
  id            String   @id @default(cuid())

  vkId          String   @unique
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  // Ktoré vlastnosti sa hodnotia (JSON array)
  evaluatedTraits String[]                     // hodnotené vlastnosti (napr. ["Sebadovera", "Svedomitost", ...])

  // Batéria otázok (JSON)
  questionBattery Json                         // batéria otázok

  createdAt     DateTime @default(now())       // dátum vytvorenia
  updatedAt     DateTime @updatedAt            // dátum aktualizácie

  @@map("evaluation_configs")
}

model Evaluation {
  id            String   @id @default(cuid())

  candidateId   String
  candidate     Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  memberId      String
  member        CommissionMember @relation(fields: [memberId], references: [id])

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  // Hodnotenie (JSON)
  // { vlastnost: string, body: number }[]
  evaluation    Json     // hodnotenie

  // Celkové body
  totalScore    Float    // celkové body
  maxScore      Float    // maximálne body
  successRate   Float    // percento úspešnosti

  // Status
  finalized     Boolean  @default(false)  // finalizované?
  finalizedAt   DateTime?                  // dátum finalizácie

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([candidateId, memberId])
  @@map("evaluations")
}

// ==================== DOKUMENTY ====================

model Document {
  id            String   @id @default(cuid())

  candidateId   String
  candidate     Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  type          DocTyp   // typ dokumentu
  name          String   // názov dokumentu
  path          String   // relatívna cesta v /uploads

  uploadedAt    DateTime @default(now())  // dátum nahrania

  @@map("documents")
}

enum DocTyp {
  CV
  MOTIVACNY_LIST
  CERTIFIKAT
  INE
}

model GeneratedDocument {
  id            String   @id @default(cuid())

  vkId          String
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  type          GenDocTyp  // typ dokumentu
  path          String     // cesta k súboru

  generatedAt   DateTime @default(now())  // dátum generovania

  @@map("generated_documents")
}

enum GenDocTyp {
  SUMARNY_HAROK
  ZAVERECNE_HODNOTENIE
  ZAPISNICA
}

// ==================== AUDIT LOG ====================

model AuditLog {
  id            String   @id @default(cuid())

  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  action        String   // akcia: "LOGIN", "CREATE_VK", "SUBMIT_TEST", ...
  entity        String?  // entita: "VK", "User", "Test", ...
  entityId      String?  // ID entity

  // Dodatočné info (JSON)
  details       Json?    // dodatočné detaily

  // IP adresa
  ipAddress     String?  // IP adresa používateľa

  timestamp     DateTime @default(now())  // čas akcie

  @@index([userId])
  @@index([action])
  @@index([timestamp])
  @@map("audit_logs")
}
```

## ER Diagram

```
User
 ├─1:N─► VyberoveKonanie (createdBy)
 ├─1:1─► Candidate
 ├─1:N─► CommissionMember
 ├─1:N─► Evaluation
 ├─1:N─► TestResult
 └─1:N─► AuditLog

VyberoveKonanie
 ├─1:N─► Candidate
 ├─1:N─► VKTest (M:N s Test)
 ├─1:1─► Commission
 ├─1:1─► EvaluationConfig
 └─1:N─► GeneratedDocument

Test
 ├─1:N─► VKTest (M:N s VyberoveKonanie)
 └─1:N─► TestResult

Candidate
 ├─1:N─► TestResult
 ├─1:N─► Document
 └─1:N─► Evaluation

Commission
 └─1:N─► CommissionMember
     └─1:N─► Evaluation
```

## Príklady dotazov

### 1. Získať všetky VK s počtom kandidátov
```typescript
const vks = await prisma.vyberoveKonanie.findMany({
  include: {
    _count: {
      select: { candidates: true }
    },
    createdBy: {
      select: { name: true, surname: true }
    }
  }
});
```

### 2. Získať kandidáta s výsledkami testov
```typescript
const candidate = await prisma.candidate.findUnique({
  where: { id: candidateId },
  include: {
    user: true,
    testResults: {
      include: {
        test: true
      }
    },
    evaluations: {
      include: {
        member: {
          include: {
            user: true
          }
        }
      }
    },
    documents: true
  }
});
```

### 3. Získať výsledky VK
```typescript
const vysledky = await prisma.candidate.findMany({
  where: { vkId },
  include: {
    user: true,
    testResults: {
      select: {
        score: true,        // body
        maxScore: true,     // maximálne body
        passed: true        // prešiel?
      }
    },
    evaluations: {
      select: {
        totalScore: true,   // celkové body
        maxScore: true,     // maximálne body
        successRate: true   // percento úspešnosti
      }
    }
  },
  orderBy: {
    // Custom ordering based on total score
  }
});
```

### 4. Audit log pre používateľa
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    userId,
    timestamp: {
      gte: new Date('2025-01-01')
    }
  },
  orderBy: {
    timestamp: 'desc'
  },
  take: 100
});
```

## Indexes pre performance

```prisma
// V models pridať:

@@index([email])         // User - rýchle vyhľadávanie
@@index([identifier])    // VK - unique anyway
@@index([vkId])          // Všetky relácie s VK
@@index([candidateId])   // Všetky relácie s kandidátom
@@index([timestamp])     // AuditLog - chronologické dotazy
```

## Migrácie

### Vytvorenie migrácie:
```bash
npx prisma migrate dev --name init
```

### Aplikovanie migrácií:
```bash
npx prisma migrate deploy
```

### Reset databázy (dev only):
```bash
npx prisma migrate reset
```

## Seeding

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mirri.gov.sk',
      password: await bcrypt.hash('Admin123!', 10),
      name: 'Hlavný',
      surname: 'Admin',
      role: UserRole.ADMIN,
      otpEnabled: true,
    }
  });

  // Create sample VK
  const vk = await prisma.vyberoveKonanie.create({
    data: {
      identifier: 'VK/2025/0001',
      selectionType: 'širšie vnútorné výberové konanie',
      organizationalUnit: 'Odbor implementácie OKP',
      serviceField: '1.03 – Medzinárodná spolupráca',
      position: 'hlavný štátny radca',
      serviceType: 'stála štátna služba',
      date: new Date('2025-07-24'),
      createdById: admin.id,
    }
  });

  console.log({ admin, vk });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Spustenie seedu:
```bash
npx prisma db seed
```
