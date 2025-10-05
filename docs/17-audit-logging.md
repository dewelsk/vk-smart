# Audit Logging - Komplexný systém logovania

## Účel

Robustný systém pre logovanie **všetkých** akcií používateľov v systéme pre účely:
- **Bezpečnostný audit** - sledovanie podozrivých aktivít
- **Compliance** - splnenie legislatívnych požiadaviek (GDPR, zákon o štátnej službe)
- **Forensics** - rekonštrukcia celého flow práce používateľa
- **Troubleshooting** - debugging problémov

**Kľúčové princípy:**
- Logovať **VŠETKO** (read aj write operácie)
- **Immutable** - logy sa nikdy nemažú, iba archivujú
- **Nezávislé** - oddelené od business logiky
- **Čitateľné** - ľahko pochopiteľné pre človeka aj stroj
- **Performance** - asynchrónne logogovanie, neblokuje hlavné operácie

---

## Databázový model

Už existuje v `docs/04-databazovy-model.md`:

```prisma
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

**Rozšírenia:**
- `sessionId` - identifikátor session (pre tracking celej relácie)
- `userAgent` - browser/device info
- `requestId` - tracking request chain (pre debug)
- `severity` - CRITICAL / WARNING / INFO (pre filtrovanie)

```prisma
model AuditLog {
  id            String   @id @default(cuid())

  // User info
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Action info
  action        String                        // "LOGIN", "CREATE_VK", ...
  entity        String?                       // "VK", "User", "Candidate", ...
  entityId      String?                       // ID entity

  // Details
  details       Json?                         // dodatočné detaily (čo sa zmenilo)
  previousValue Json?                         // stará hodnota (pre UPDATE akcie)
  newValue      Json?                         // nová hodnota (pre UPDATE akcie)

  // Context
  ipAddress     String?                       // IP adresa
  userAgent     String?                       // browser/device
  sessionId     String?                       // session ID
  requestId     String?                       // request tracking

  // Metadata
  severity      LogSeverity @default(INFO)    // CRITICAL / WARNING / INFO
  timestamp     DateTime    @default(now())

  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([sessionId])
  @@index([timestamp])
  @@index([severity])
  @@map("audit_logs")
}

enum LogSeverity {
  CRITICAL      // Kritické akcie (DELETE, LOGIN_FAILED, ...)
  WARNING       // Podozrivé akcie (MULTIPLE_FAILED_LOGINS, ...)
  INFO          // Normálne akcie (READ, UPDATE, ...)
}
```

---

## Kategórie logovaných akcií

### 1. Autentifikácia a Autorizácia

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `LOGIN_SUCCESS` | User | INFO | `{ username, method: "PASSWORD" \| "OTP" }` |
| `LOGIN_FAILED` | User | WARNING | `{ username, reason: "INVALID_PASSWORD" \| "USER_NOT_FOUND" \| "ACCOUNT_DISABLED" }` |
| `LOGOUT` | User | INFO | `{ sessionDuration: "2h 15m" }` |
| `PASSWORD_SET` | User | INFO | `{ tokenUsed: true }` |
| `PASSWORD_RESET_REQUESTED` | User | WARNING | `{ email }` |
| `PASSWORD_CHANGED` | User | WARNING | `{ changedBy: userId }` |
| `OTP_ENABLED` | User | WARNING | `{}` |
| `OTP_DISABLED` | User | WARNING | `{}` |
| `RECOVERY_CODE_USED` | User | CRITICAL | `{}` |
| `SESSION_EXPIRED` | User | INFO | `{}` |
| `ACCESS_DENIED` | - | WARNING | `{ resource, requiredRole, actualRole }` |

### 2. Správa používateľov

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `USER_CREATED` | User | INFO | `{ createdBy: userId, role, institutionIds }` |
| `USER_UPDATED` | User | INFO | `{ updatedBy: userId, changedFields: ["email", "name"] }` |
| `USER_DELETED` | User | CRITICAL | `{ deletedBy: userId, reason }` |
| `USER_ACTIVATED` | User | INFO | `{ activatedBy: userId }` |
| `USER_DEACTIVATED` | User | WARNING | `{ deactivatedBy: userId, reason }` |
| `USER_ROLE_CHANGED` | User | CRITICAL | `{ changedBy: userId, oldRole, newRole }` |
| `USER_INSTITUTION_ADDED` | User | INFO | `{ institutionId, addedBy: userId }` |
| `USER_INSTITUTION_REMOVED` | User | INFO | `{ institutionId, removedBy: userId }` |

### 3. Správa rezortov (Superadmin)

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `INSTITUTION_CREATED` | Institution | INFO | `{ name, code, createdBy: userId }` |
| `INSTITUTION_UPDATED` | Institution | INFO | `{ updatedBy: userId, changedFields }` |
| `INSTITUTION_ACTIVATED` | Institution | INFO | `{ activatedBy: userId }` |
| `INSTITUTION_DEACTIVATED` | Institution | WARNING | `{ deactivatedBy: userId, reason }` |

### 4. Výberové konania

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `VK_CREATED` | VyberoveKonanie | INFO | `{ identifier, institutionId, createdBy: userId }` |
| `VK_UPDATED` | VyberoveKonanie | INFO | `{ updatedBy: userId, changedFields }` |
| `VK_VIEWED` | VyberoveKonanie | INFO | `{ viewedBy: userId }` |
| `VK_STATUS_CHANGED` | VyberoveKonanie | WARNING | `{ changedBy: userId, oldStatus, newStatus }` |
| `VK_CANCELLED` | VyberoveKonanie | CRITICAL | `{ cancelledBy: userId, reason }` |
| `VK_DELETED` | VyberoveKonanie | CRITICAL | `{ deletedBy: userId, reason }` |
| `VK_GESTOR_ASSIGNED` | VyberoveKonanie | INFO | `{ gestorId, assignedBy: userId }` |
| `VK_GESTOR_REMOVED` | VyberoveKonanie | INFO | `{ gestorId, removedBy: userId }` |

### 5. Uchádzači

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `CANDIDATE_CREATED` | Candidate | INFO | `{ vkId, createdBy: userId, cisIdentifier }` |
| `CANDIDATE_BULK_IMPORTED` | - | INFO | `{ vkId, importedBy: userId, count, fileName }` |
| `CANDIDATE_UPDATED` | Candidate | INFO | `{ updatedBy: userId, changedFields }` |
| `CANDIDATE_VIEWED` | Candidate | INFO | `{ viewedBy: userId }` |
| `CANDIDATE_DELETED` | Candidate | WARNING | `{ deletedBy: userId, reason }` |
| `CANDIDATE_PASSWORD_RESET` | Candidate | WARNING | `{ resetBy: userId }` |
| `CANDIDATE_ACTIVATED` | Candidate | INFO | `{ activatedBy: userId }` |
| `CANDIDATE_DEACTIVATED` | Candidate | WARNING | `{ deactivatedBy: userId, reason }` |

### 6. Testy

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `TEST_CREATED` | Test | INFO | `{ name, type, createdBy: userId }` |
| `TEST_UPDATED` | Test | INFO | `{ updatedBy: userId, changedFields }` |
| `TEST_APPROVED` | Test | WARNING | `{ approvedBy: userId }` |
| `TEST_ASSIGNED_TO_VK` | VKTest | INFO | `{ vkId, testId, assignedBy: userId, level }` |
| `TEST_REMOVED_FROM_VK` | VKTest | WARNING | `{ vkId, testId, removedBy: userId }` |
| `TEST_STARTED` | TestResult | INFO | `{ candidateId, testId }` |
| `TEST_SUBMITTED` | TestResult | INFO | `{ candidateId, testId, score, duration }` |
| `TEST_RESULT_VIEWED` | TestResult | INFO | `{ viewedBy: userId, candidateId, testId }` |

### 7. Komisia

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `COMMISSION_CREATED` | Commission | INFO | `{ vkId, createdBy: userId }` |
| `COMMISSION_MEMBER_ADDED` | CommissionMember | INFO | `{ commissionId, userId, addedBy: userId, isChairman }` |
| `COMMISSION_MEMBER_REMOVED` | CommissionMember | WARNING | `{ commissionId, userId, removedBy: userId }` |
| `COMMISSION_CHAIRMAN_SET` | CommissionMember | INFO | `{ commissionId, userId, setBy: userId }` |

### 8. Hodnotenie

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `EVALUATION_CREATED` | Evaluation | INFO | `{ candidateId, memberId }` |
| `EVALUATION_UPDATED` | Evaluation | INFO | `{ candidateId, memberId, changedFields }` |
| `EVALUATION_FINALIZED` | Evaluation | WARNING | `{ candidateId, memberId, totalScore }` |
| `EVALUATION_VIEWED` | Evaluation | INFO | `{ viewedBy: userId, candidateId }` |

### 9. Dokumenty

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `DOCUMENT_UPLOADED` | Document | INFO | `{ candidateId, type, fileName, size }` |
| `DOCUMENT_DOWNLOADED` | Document | INFO | `{ downloadedBy: userId, documentId, fileName }` |
| `DOCUMENT_DELETED` | Document | WARNING | `{ deletedBy: userId, documentId, fileName }` |
| `GENERATED_DOCUMENT_CREATED` | GeneratedDocument | INFO | `{ vkId, type, generatedBy: userId }` |
| `GENERATED_DOCUMENT_DOWNLOADED` | GeneratedDocument | INFO | `{ downloadedBy: userId, documentId, type }` |

### 10. Systémové akcie

| Akcia | Entity | Severity | Details |
|-------|--------|----------|---------|
| `SYSTEM_STARTED` | - | INFO | `{ version, environment }` |
| `SYSTEM_SHUTDOWN` | - | WARNING | `{ reason }` |
| `DATABASE_MIGRATION` | - | CRITICAL | `{ version, migratedBy: userId }` |
| `BACKUP_CREATED` | - | INFO | `{ size, duration }` |
| `BACKUP_RESTORED` | - | CRITICAL | `{ restoredBy: userId, backupDate }` |

---

## Implementácia

### Backend - Logger Service

```typescript
// services/auditLogger.ts

interface AuditLogData {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: any;
  previousValue?: any;
  newValue?: any;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
}

class AuditLogger {

  async log(data: AuditLogData, req?: Request): Promise<void> {
    // Extrahuj context z request
    const context = this.extractContext(req);

    // Async zápis (non-blocking)
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        previousValue: data.previousValue,
        newValue: data.newValue,
        severity: data.severity || 'INFO',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        requestId: context.requestId,
        timestamp: new Date()
      }
    });
  }

  private extractContext(req?: Request) {
    return {
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || 'unknown',
      userAgent: req?.headers['user-agent'] || 'unknown',
      sessionId: req?.session?.id || null,
      requestId: req?.id || null
    };
  }
}

export const auditLogger = new AuditLogger();
```

### Použitie v API endpointoch

```typescript
// api/users/create.ts

export async function createUser(req: Request, res: Response) {
  const { firstName, lastName, email, role, institutionIds } = req.body;

  // Vytvor používateľa
  const user = await prisma.user.create({
    data: { firstName, lastName, email, role }
  });

  // LOG: User created
  await auditLogger.log({
    userId: req.user.id,              // kto vytvoril
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    details: {
      createdBy: req.user.id,
      role: role,
      institutionIds: institutionIds
    },
    severity: 'INFO'
  }, req);

  res.json(user);
}
```

### Middleware pre automatické logovanie

```typescript
// middleware/auditMiddleware.ts

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {

  // Log všetky READ operácie
  if (req.method === 'GET' && req.user) {

    // Extrahuj entity z URL
    const entity = extractEntityFromUrl(req.path);  // "VK", "User", ...
    const entityId = req.params.id;

    auditLogger.log({
      userId: req.user.id,
      action: `${entity}_VIEWED`,
      entity: entity,
      entityId: entityId,
      severity: 'INFO'
    }, req);
  }

  next();
}
```

---

## Query a Reporting

### 1. Celý flow používateľa (od prihlásenia po odhlásenie)

```typescript
async function getUserSessionFlow(userId: string, sessionId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId: userId,
      sessionId: sessionId
    },
    orderBy: {
      timestamp: 'asc'
    },
    include: {
      user: {
        select: { name: true, surname: true, email: true }
      }
    }
  });

  return logs;
}
```

**Output:**
```json
[
  {
    "timestamp": "2025-03-15T09:00:00Z",
    "action": "LOGIN_SUCCESS",
    "details": { "method": "PASSWORD" },
    "ipAddress": "192.168.1.100"
  },
  {
    "timestamp": "2025-03-15T09:01:23Z",
    "action": "VK_VIEWED",
    "entity": "VyberoveKonanie",
    "entityId": "vk_789"
  },
  {
    "timestamp": "2025-03-15T09:05:47Z",
    "action": "CANDIDATE_CREATED",
    "entity": "Candidate",
    "entityId": "cand_123",
    "details": { "vkId": "vk_789", "cisIdentifier": "UC001" }
  },
  {
    "timestamp": "2025-03-15T11:30:00Z",
    "action": "LOGOUT",
    "details": { "sessionDuration": "2h 30m" }
  }
]
```

---

### 2. História zmien entity (napr. VK)

```typescript
async function getEntityHistory(entity: string, entityId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      entity: entity,
      entityId: entityId
    },
    orderBy: {
      timestamp: 'desc'
    },
    include: {
      user: {
        select: { name: true, surname: true }
      }
    }
  });

  return logs;
}
```

**Output:**
```json
[
  {
    "timestamp": "2025-03-20T14:30:00Z",
    "action": "VK_STATUS_CHANGED",
    "user": { "name": "Jozef", "surname": "Novák" },
    "previousValue": { "status": "PRIPRAVA" },
    "newValue": { "status": "TESTOVANIE" }
  },
  {
    "timestamp": "2025-03-18T10:00:00Z",
    "action": "VK_GESTOR_ASSIGNED",
    "user": { "name": "Admin", "surname": "Adminovic" },
    "details": { "gestorId": "user_456" }
  },
  {
    "timestamp": "2025-03-15T09:00:00Z",
    "action": "VK_CREATED",
    "user": { "name": "Admin", "surname": "Adminovic" },
    "details": { "identifier": "VK/2025/0001", "institutionId": "inst_123" }
  }
]
```

---

### 3. Bezpečnostný audit (podozrivé aktivity)

```typescript
async function getSecurityAudit(from: Date, to: Date) {
  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: {
        gte: from,
        lte: to
      },
      OR: [
        { severity: 'CRITICAL' },
        { action: { contains: 'FAILED' } },
        { action: { contains: 'DELETE' } },
        { action: { contains: 'ACCESS_DENIED' } }
      ]
    },
    orderBy: {
      timestamp: 'desc'
    },
    include: {
      user: true
    }
  });

  return logs;
}
```

---

### 4. Activity report (top akcie za obdobie)

```typescript
async function getActivityReport(from: Date, to: Date) {
  const logs = await prisma.$queryRaw`
    SELECT
      action,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as unique_users
    FROM audit_logs
    WHERE timestamp >= ${from} AND timestamp <= ${to}
    GROUP BY action
    ORDER BY count DESC
    LIMIT 20
  `;

  return logs;
}
```

---

## UI - Audit Log Viewer

### Admin obrazovka: Audit Log

```
┌─────────────────────────────────────────────────────────────┐
│ Audit Log                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Hľadať...]  [🔍]                                           │
│                                                              │
│ Používateľ: [Všetci] ▼   Akcia: [Všetky] ▼                 │
│ Od: [DD.MM.RRRR]  Do: [DD.MM.RRRR]  Severity: [Všetky] ▼   │
│                                                              │
├────────┬──────────┬─────────┬─────────┬────────────┬────────┤
│ Čas   │ Použív.  │ Akcia   │ Entity  │ Details    │ IP     │
├────────┼──────────┼─────────┼─────────┼────────────┼────────┤
│ 14:30  │ J.Novák  │ VK_VIEW │ VK-001  │ {...}      │ 192... │
│ 14:25  │ M.Kováč  │ LOGIN   │ -       │ SUCCESS    │ 10.... │
│ 14:20  │ J.Novák  │ CAND_CR │ UC001   │ vk=VK-001  │ 192... │
└────────┴──────────┴─────────┴─────────┴────────────┴────────┘
```

---

## Performance optimizácie

### 1. Asynchrónne logovanie
```typescript
// Queue-based logging (Redis, Bull, BullMQ)
const auditQueue = new Queue('audit-logs');

async function log(data: AuditLogData) {
  await auditQueue.add('log', data);  // Non-blocking
}

// Worker process audit logs
auditQueue.process('log', async (job) => {
  await prisma.auditLog.create({ data: job.data });
});
```

### 2. Batch insert
```typescript
// Zbieraj logy v pamäti a flush každých 5 sekúnd
const logBuffer: AuditLogData[] = [];

setInterval(async () => {
  if (logBuffer.length > 0) {
    await prisma.auditLog.createMany({
      data: logBuffer
    });
    logBuffer.length = 0;
  }
}, 5000);
```

### 3. Partitioning (pre veľké objemy)
```sql
-- Partition by month
CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
```

---

## Retention policy

### Archivácia starých logov

```typescript
// Archivuj logy staršie ako 2 roky do S3/archive DB
async function archiveOldLogs() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  // Export do CSV/JSON
  const oldLogs = await prisma.auditLog.findMany({
    where: {
      timestamp: { lt: twoYearsAgo }
    }
  });

  // Upload to S3
  await s3.upload('audit-logs-archive.json', JSON.stringify(oldLogs));

  // Delete from main DB
  await prisma.auditLog.deleteMany({
    where: {
      timestamp: { lt: twoYearsAgo }
    }
  });
}
```

**Policy:**
- **0-6 mesiacov**: Hot storage (PostgreSQL) - plný prístup
- **6-24 mesiacov**: Warm storage (PostgreSQL) - read-only
- **2+ rokov**: Cold storage (S3/Archive) - na požiadanie

---

## GDPR compliance

### Anonymizácia po vymazaní používateľa

```typescript
async function anonymizeUserLogs(userId: string) {
  await prisma.auditLog.updateMany({
    where: { userId: userId },
    data: {
      userId: null,  // Odstráň väzbu na používateľa
      details: {
        // Anonymizuj PII data v details
        userId: '[ANONYMIZED]',
        email: '[ANONYMIZED]',
        name: '[ANONYMIZED]'
      }
    }
  });
}
```

---

## OTÁZKY (na diskusiu):

1. **Retention period?**
   - Koľko rokov uchovávať audit logy?
   - 2 roky, 5 rokov, 10 rokov?

2. **Logovať GET requesty?**
   - Logovať všetky VIEW akcie?
   - Alebo len kritické (napr. VIEW_CANDIDATE_PERSONAL_DATA)?

3. **Real-time alerting?**
   - Email/SMS alert pri CRITICAL akciách?
   - Napr. multiple failed logins, mass delete, ...

4. **Export formát?**
   - JSON, CSV, PDF?
   - Pre bezpečnostné autority?

5. **Separate database pre audit logs?**
   - Oddelená DB pre performance?
   - Alebo v rovnakej DB ako business data?
