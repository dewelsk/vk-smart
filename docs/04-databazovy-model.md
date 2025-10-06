# Databázový model - Prisma Schema

## Poznámka k aktuálnemu stavu

**Hybridný systém testov:**
- ✅ **Nový systém** - `TestType` a `TestCategory` modely pre editovateľnú organizáciu testov
- 🔄 **Starý systém** - Enum `TestTyp` stále existuje v schéme (legacy)
- Test model obsahuje `categoryId` (nový) aj `type` (starý)

---

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

enum UserRole {
  SUPERADMIN  // Správca celého systému, spravuje rezorty a adminov
  ADMIN       // Správca rezortu, vytvára VK
  GESTOR      // Spravuje konkrétne VK
  KOMISIA     // Hodnotí uchádzačov
  UCHADZAC    // Dočasný účet pre VK
}

// ==================== MULTI-TENANCY: REZORTY ====================

model Institution {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  description String?

  active      Boolean  @default(true)

  // Generated search columns for diacritic-insensitive search
  name_search        String? @map("name_search")
  code_search        String? @map("code_search")
  description_search String? @map("description_search")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserInstitution[]
  vks         VyberoveKonanie[]

  @@map("institutions")
}

model UserInstitution {
  id            String   @id @default(cuid())

  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  assignedAt    DateTime @default(now())
  assignedBy    String?

  @@unique([userId, institutionId])
  @@map("user_institutions")
}

model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String?  @unique
  password      String?
  name          String
  surname       String
  role          UserRole
  note          String?

  otpSecret     String?
  otpEnabled    Boolean  @default(false)
  recoveryCode  String?

  passwordSetToken       String?   @unique
  passwordSetTokenExpiry DateTime?

  deleted       Boolean  @default(false)
  deletedAt     DateTime?
  deletedEmail  String?

  active        Boolean  @default(true)
  temporaryAccount Boolean @default(false)
  archivedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  institutions  UserInstitution[]
  createdVKs    VyberoveKonanie[]  @relation("CreatedBy")
  gestorVKs     VyberoveKonanie[]  @relation("GestorVK")
  candidates    Candidate[]
  commissionMemberships CommissionMember[]
  evaluations   Evaluation[]
  auditLogs     AuditLog[]
  testResults   TestResult[]

  @@map("users")
}

// ==================== VÝBEROVÉ KONANIA ====================

model VyberoveKonanie {
  id                String   @id @default(cuid())
  identifier        String   @unique

  institutionId     String
  institution       Institution @relation(fields: [institutionId], references: [id])

  selectionType     String
  organizationalUnit String
  serviceField      String
  position          String
  serviceType       String
  date              DateTime

  numberOfPositions Int      @default(1)

  status            VKStatus @default(PRIPRAVA)

  gestorId          String?
  gestor            User?    @relation("GestorVK", fields: [gestorId], references: [id])

  createdById       String
  createdBy         User     @relation("CreatedBy", fields: [createdById], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  candidates        Candidate[]
  assignedTests     VKTest[]
  commission        Commission?
  evaluationConfig  EvaluationConfig?
  documents         GeneratedDocument[]

  @@map("vyberove_konania")
}

enum VKStatus {
  PRIPRAVA
  CAKA_NA_TESTY
  TESTOVANIE
  HODNOTENIE
  DOKONCENE
  ZRUSENE
}

// ==================== TESTY ====================

model Test {
  id            String     @id @default(cuid())
  name          String
  type          TestTyp                        // Legacy enum (bude odstránený)
  description   String?

  questions     Json

  recommendedQuestionCount  Int?
  recommendedDuration       Int?
  recommendedScore          Float?
  difficulty    Int?       @default(5)         // 1-10

  approved      Boolean    @default(false)
  approvedAt    DateTime?

  authorId      String?

  // NOVÁ organizácia testov
  categoryId    String?
  category      TestCategory? @relation(fields: [categoryId], references: [id])

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  vkAssignments VKTest[]
  results       TestResult[]

  @@map("tests")
}

// NOVÝ model pre typy testov (editovateľné)
model TestType {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?

  categories  TestCategory[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("test_types")
}

// NOVÝ model pre kategórie testov (editovateľné)
model TestCategory {
  id          String   @id @default(cuid())
  name        String   @unique

  typeId      String?
  type        TestType? @relation(fields: [typeId], references: [id], onDelete: SetNull)

  description String?

  tests       Test[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("test_categories")
}

// LEGACY enum (bude odstránený)
enum TestTyp {
  ODBORNY
  VSEOBECNY
  STATNY_JAZYK
  CUDZI_JAZYK
  IT_ZRUCNOSTI
  SCHOPNOSTI_VLASTNOSTI
}

model VKTest {
  id            String   @id @default(cuid())

  vkId          String
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  testId        String
  test          Test     @relation(fields: [testId], references: [id])

  level         Int

  questionCount Int
  durationMinutes Int
  scorePerQuestion Float
  minScore      Float

  createdAt     DateTime @default(now())

  @@unique([vkId, testId])
  @@unique([vkId, level])
  @@map("vk_tests")
}

// ==================== KANDIDÁTI ====================

model Candidate {
  id                String   @id @default(cuid())

  vkId              String
  vk                VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  userId            String
  user              User     @relation(fields: [userId], references: [id])

  cisIdentifier     String

  email             String?

  isArchived        Boolean  @default(false)

  deleted           Boolean  @default(false)
  deletedAt         DateTime?
  deletedEmail      String?

  registeredAt      DateTime @default(now())

  testResults       TestResult[]
  documents         Document[]
  evaluations       Evaluation[]

  @@unique([vkId, cisIdentifier])
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

  answers       Json
  score         Float
  maxScore      Float
  successRate   Float
  passed        Boolean

  startedAt     DateTime
  completedAt   DateTime?
  durationSeconds Int?

  createdAt     DateTime @default(now())

  @@unique([candidateId, testId])
  @@map("test_results")
}

// ==================== KOMISIA ====================

model Commission {
  id            String   @id @default(cuid())

  vkId          String   @unique
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  chairmanId    String?

  createdAt     DateTime @default(now())

  members       CommissionMember[]

  @@map("commissions")
}

model CommissionMember {
  id            String   @id @default(cuid())

  commissionId  String
  commission    Commission @relation(fields: [commissionId], references: [id], onDelete: Cascade)

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  isChairman    Boolean  @default(false)

  createdAt     DateTime @default(now())

  evaluations   Evaluation[]

  @@unique([commissionId, userId])
  @@map("commission_members")
}

// ==================== HODNOTENIE ====================

model EvaluationConfig {
  id            String   @id @default(cuid())

  vkId          String   @unique
  vk            VyberoveKonanie @relation(fields: [vkId], references: [id], onDelete: Cascade)

  evaluatedTraits String[]

  questionBattery Json

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

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

  evaluation    Json

  totalScore    Float
  maxScore      Float
  successRate   Float

  finalized     Boolean  @default(false)
  finalizedAt   DateTime?

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

  type          DocTyp
  name          String
  path          String

  uploadedAt    DateTime @default(now())

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

  type          GenDocTyp
  path          String

  generatedAt   DateTime @default(now())

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

  action        String
  entity        String?
  entityId      String?

  details       Json?
  previousValue Json?
  newValue      Json?

  ipAddress     String?
  userAgent     String?
  sessionId     String?
  requestId     String?

  severity      LogSeverity @default(INFO)

  timestamp     DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([sessionId])
  @@index([timestamp])
  @@index([severity])
  @@map("audit_logs")
}

enum LogSeverity {
  CRITICAL
  WARNING
  INFO
}
```

## ER Diagram

```
User
 ├─1:N─► VyberoveKonanie (createdBy)
 ├─1:N─► VyberoveKonanie (gestor)
 ├─1:1─► Candidate
 ├─1:N─► CommissionMember
 ├─1:N─► Evaluation
 ├─1:N─► TestResult
 └─1:N─► AuditLog

Institution
 ├─M:N─► User (UserInstitution)
 └─1:N─► VyberoveKonanie

VyberoveKonanie
 ├─1:N─► Candidate
 ├─1:N─► VKTest (M:N s Test)
 ├─1:1─► Commission
 ├─1:1─► EvaluationConfig
 └─1:N─► GeneratedDocument

TestType (NOVÝ)
 └─1:N─► TestCategory

TestCategory (NOVÝ)
 └─1:N─► Test

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
    },
    institution: {
      select: { name: true, code: true }
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
        test: {
          include: {
            category: {
              include: {
                type: true
              }
            }
          }
        }
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

### 3. Získať testy podľa kategórie
```typescript
const tests = await prisma.test.findMany({
  where: {
    categoryId: categoryId
  },
  include: {
    category: {
      include: {
        type: true
      }
    },
    _count: {
      select: {
        vkAssignments: true
      }
    }
  }
});
```

### 4. Získať typy testov s kategóriami a počtom testov
```typescript
const testTypes = await prisma.testType.findMany({
  include: {
    categories: {
      include: {
        _count: {
          select: {
            tests: true
          }
        }
      }
    },
    _count: {
      select: {
        categories: true
      }
    }
  }
});
```

### 5. Audit log pre používateľa
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

## Migrácie

### Vytvorenie migrácie:
```bash
npx prisma migrate dev --name migration_name
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
  // Create institution
  const institution = await prisma.institution.create({
    data: {
      name: 'Ministerstvo vnútra SR',
      code: 'MVSR',
      description: 'Ministerstvo vnútra Slovenskej republiky'
    }
  });

  // Create superadmin user
  const superadmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@retry.sk',
      password: await bcrypt.hash('Hackaton25', 10),
      name: 'Super',
      surname: 'Admin',
      role: UserRole.SUPERADMIN,
      otpEnabled: false,
    }
  });

  // Create admin user and link to institution
  const admin = await prisma.user.create({
    data: {
      username: 'admin.mv',
      email: 'admin.mv@retry.sk',
      password: await bcrypt.hash('Test1234', 10),
      name: 'Admin',
      surname: 'MV',
      role: UserRole.ADMIN,
      otpEnabled: false,
      institutions: {
        create: {
          institutionId: institution.id
        }
      }
    }
  });

  // Create test types
  const statnyJazyk = await prisma.testType.create({
    data: {
      name: 'Štátny jazyk',
      description: 'Testy z slovenského jazyka'
    }
  });

  const cudziJazyk = await prisma.testType.create({
    data: {
      name: 'Cudzí jazyk',
      description: 'Testy z cudzích jazykov'
    }
  });

  // Create test categories
  await prisma.testCategory.createMany({
    data: [
      { name: 'A1', typeId: statnyJazyk.id },
      { name: 'A2', typeId: statnyJazyk.id },
      { name: 'B1', typeId: statnyJazyk.id },
      { name: 'B2', typeId: statnyJazyk.id },
      { name: 'Anglický jazyk - A2', typeId: cudziJazyk.id },
      { name: 'Anglický jazyk - B2', typeId: cudziJazyk.id },
    ]
  });

  console.log({ institution, superadmin, admin, statnyJazyk, cudziJazyk });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Spustenie seedu:
```bash
npx prisma db seed
```

## Nová organizácia testov (TestType & TestCategory)

### Koncept

**TestType** (Typ testu) - Editovateľný číselník hlavných typov testov:
- Štátny jazyk
- Cudzí jazyk
- IT zručnosti
- Odborný test
- Všeobecný test
- Schopnosti a vlastnosti

**TestCategory** (Kategória testu) - Editovateľný číselník podkategórií v rámci typu:
- Patrí k TestType (voliteľne - ON DELETE SET NULL)
- Každý test má categoryId
- Umožňuje jemnú organizáciu testov

**Príklad hierarchie:**
```
TestType: Štátny jazyk
  ├─ TestCategory: A1
  ├─ TestCategory: A2
  ├─ TestCategory: B1
  └─ TestCategory: B2

TestType: Cudzí jazyk
  ├─ TestCategory: Anglický jazyk - A2
  ├─ TestCategory: Anglický jazyk - B2
  └─ TestCategory: Nemecký jazyk - B1
```

### Výhody novej organizácie

✅ **Flexibilita** - Typy a kategórie môžu byť vytvorené a upravené počas prevádzky
✅ **Rozšíriteľnosť** - Jednoduché pridanie nových typov/kategórií
✅ **Hierarchická organizácia** - Typ → Kategória → Test
✅ **Audit trail** - Zmeny typov/kategórií sú sledovateľné

### API Endpointy pre typy a kategórie

- `GET /api/admin/test-types` - Zoznam typov testov
- `POST /api/admin/test-types` - Vytvorenie typu testu
- `PATCH /api/admin/test-types/:id` - Úprava typu testu
- `DELETE /api/admin/test-types/:id` - Zmazanie typu testu

- `GET /api/admin/test-categories` - Zoznam kategórií testov
- `POST /api/admin/test-categories` - Vytvorenie kategórie testu
- `PATCH /api/admin/test-categories/:id` - Úprava kategórie testu
- `DELETE /api/admin/test-categories/:id` - Zmazanie kategórie testu

---

**Posledná aktualizácia:** Október 2025
**Verzia:** 2.0.0 (s editovateľnými typmi a kategóriami testov)
