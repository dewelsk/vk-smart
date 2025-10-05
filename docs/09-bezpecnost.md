# Bezpečnosť

## Prehľad bezpečnostných opatrení

Systém digitalizácie výberových konaní musí spĺňať vysoké bezpečnostné štandardy, keďže spracováva citlivé osobné údaje a dôležité štátne dokumenty.

---

## 1. Autentifikácia & Autorizácia

### 1.1 Password Security

**Hashing:**
```typescript
import bcrypt from 'bcryptjs';

// Pri vytvorení používateľa
const hashedPassword = await bcrypt.hash(password, 10);

// Pri prihlásení
const isValid = await bcrypt.compare(password, user.password);
```

**Password Policy:**
- Minimálna dĺžka: 8 znakov
- Musí obsahovať:
  - Veľké písmeno (A-Z)
  - Malé písmeno (a-z)
  - Číslo (0-9)
  - Špeciálny znak (!@#$%^&*)

```typescript
// lib/validation/password.ts
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function validatePassword(password: string): boolean {
  return passwordRegex.test(password);
}
```

### 1.2 Session Management

**NextAuth.js Configuration:**
```typescript
// lib/auth/auth.ts
export const authOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        // Overenie credentials
        const user = await verifyCredentials(credentials);
        if (!user) return null;
        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hodín
    updateAge: 60 * 60,  // Update každú hodinu
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    encryption: true,
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};
```

### 1.3 Role-Based Access Control (RBAC)

```typescript
// lib/auth/permissions.ts
export const permissions = {
  ADMIN: [
    'vk.create',
    'vk.edit',
    'vk.delete',
    'users.create',
    'users.edit',
    'users.delete',
    'tests.approve',
    'documents.view',
    'audit.view',
  ],
  GESTOR: [
    'tests.create',
    'tests.edit',
    'tests.view',
  ],
  KOMISIA: [
    'evaluations.create',
    'evaluations.view',
    'documents.view',
  ],
  UCHADZAC: [
    'tests.take',
    'results.view',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return permissions[role]?.includes(permission) || false;
}
```

**Middleware Protection:**
```typescript
// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Check if user is authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access
  const path = request.nextUrl.pathname;
  if (path.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/gestor/:path*', '/komisia/:path*', '/uchadzac/:path*'],
};
```

---

## 2. Input Validation & Sanitization

### 2.1 Zod Schema Validation

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const createVKSchema = z.object({
  identifikator: z.string().regex(/^VK\/\d{4}\/\d+$/),
  druhKonania: z.string().min(3),
  organizacnyUtvar: z.string().min(3),
  funkcia: z.string().min(3),
  datum: z.string().datetime(),
  pocetMiest: z.number().min(1).max(100),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  surname: z.string().min(2),
  role: z.enum(['ADMIN', 'GESTOR', 'KOMISIA', 'UCHADZAC']),
});

export const submitTestSchema = z.object({
  candidateId: z.string().cuid(),
  testId: z.string().cuid(),
  odpovede: z.record(z.number().min(0).max(2)),
});
```

### 2.2 API Validation

```typescript
// app/api/admin/vk/route.ts
import { createVKSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate input
  const result = createVKSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.issues },
      { status: 400 }
    );
  }

  // Process valid data
  const vk = await createVK(result.data);
  return NextResponse.json({ vk });
}
```

### 2.3 XSS Protection

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input before displaying
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}
```

---

## 3. SQL Injection Protection

**Prisma ORM poskytuje automatickú ochranu:**

```typescript
// ✅ SAFE - Parameterized query
const user = await prisma.user.findUnique({
  where: { email: userInput.email }
});

// ✅ SAFE - Prisma client
const vks = await prisma.vyberoveKonanie.findMany({
  where: {
    status: userInput.status
  }
});

// ❌ NEVER do this - Raw SQL with user input
// await prisma.$executeRaw(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ If raw SQL needed, use parameterized
await prisma.$executeRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

---

## 4. CSRF Protection

**NextAuth.js poskytuje built-in CSRF protection:**

```typescript
// Automaticky handled NextAuth.js
// CSRF token je included v každom request
```

**Pre custom forms:**
```typescript
import { getCsrfToken } from 'next-auth/react';

export default function CustomForm() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);

  return (
    <form method="post">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      {/* ... */}
    </form>
  );
}
```

---

## 5. Rate Limiting

### 5.1 Login Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function checkRateLimit(ip: string, limit: number = 5): boolean {
  const tokenCount = (rateLimit.get(ip) as number) || 0;

  if (tokenCount >= limit) {
    return false; // Too many requests
  }

  rateLimit.set(ip, tokenCount + 1);
  return true;
}
```

**Usage v API:**
```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip, 5)) {
    return NextResponse.json(
      { error: 'Príliš veľa pokusov. Skúste neskôr.' },
      { status: 429 }
    );
  }

  // Process login
}
```

### 5.2 API Rate Limiting (Nginx - Production)

```nginx
# docker/nginx/nginx.conf
http {
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

  server {
    location /api/ {
      limit_req zone=api burst=20 nodelay;
      proxy_pass http://app:3000;
    }
  }
}
```

---

## 6. File Upload Security

### 6.1 Validation

```typescript
// lib/utils/file-upload.ts
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nepovolený typ súboru' };
  }

  // Check size
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Súbor je príliš veľký (max 10MB)' };
  }

  // Check filename (prevent path traversal)
  const filename = file.name;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Neplatný názov súboru' };
  }

  return { valid: true };
}
```

### 6.2 Safe Filename

```typescript
import crypto from 'crypto';
import path from 'path';

export function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}
```

### 6.3 Virus Scanning (Production - Optional)

```typescript
// Použiť ClamAV alebo cloud antivirus API
import NodeClam from 'clamscan';

const clamscan = new NodeClam({
  clamdscan: {
    path: '/usr/bin/clamdscan',
  },
});

export async function scanFile(filePath: string): Promise<boolean> {
  try {
    const { isInfected } = await clamscan.isInfected(filePath);
    return !isInfected;
  } catch (error) {
    console.error('Virus scan failed:', error);
    return false;
  }
}
```

---

## 7. HTTPS & Secure Headers

### 7.1 Helmet.js (Security Headers)

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

### 7.2 CORS Policy

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL!);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}
```

---

## 8. Audit Logging

```typescript
// lib/audit/logger.ts
import { prisma } from '@/lib/db/client';

export async function logAudit({
  userId,
  akcia,
  entita,
  entitaId,
  details,
  ipAddress,
}: {
  userId?: string;
  akcia: string;
  entita?: string;
  entitaId?: string;
  details?: any;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      akcia,
      entita,
      entitaId,
      details,
      ipAddress,
      timestamp: new Date(),
    },
  });
}
```

**Usage:**
```typescript
// app/api/admin/vk/route.ts
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const ip = request.headers.get('x-forwarded-for');

  // Create VK
  const vk = await createVK(data);

  // Log action
  await logAudit({
    userId: session.user.id,
    akcia: 'VK_CREATE',
    entita: 'VyberoveKonanie',
    entitaId: vk.id,
    details: { identifikator: vk.identifikator },
    ipAddress: ip,
  });

  return NextResponse.json({ vk });
}
```

---

## 9. Database Security

### 9.1 Connection Security

```env
# .env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 9.2 Least Privilege

```sql
-- Create read-only user for reporting
CREATE USER vk_readonly WITH PASSWORD 'secure_pass';
GRANT CONNECT ON DATABASE vk_system TO vk_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO vk_readonly;
```

### 9.3 Backups Encryption

```bash
# Encrypted backup
pg_dump vk_system | gpg --encrypt --recipient admin@mirri.gov.sk > backup.sql.gpg

# Restore
gpg --decrypt backup.sql.gpg | psql vk_system
```

---

## 10. Secrets Management

### 10.1 Environment Variables

```env
# .env (NEVER commit to git!)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="random-32-char-secret"
NEXTAUTH_URL="https://vk.mirri.gov.sk"
```

### 10.2 Secrets in Production

**Použiť:**
- Docker Secrets
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault

```bash
# Docker Secrets
echo "my_secret_password" | docker secret create db_password -

# Use in docker-compose.yml
secrets:
  db_password:
    external: true

services:
  postgres:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

---

## 11. Security Checklist

### Development:
- [ ] Všetky heslá hashované (bcrypt)
- [ ] Input validation (Zod)
- [ ] XSS protection (sanitization)
- [ ] CSRF protection (NextAuth)
- [ ] SQL injection protection (Prisma)
- [ ] Rate limiting implemented
- [ ] Audit logging active
- [ ] File upload validation
- [ ] Environment variables secured
- [ ] Git secrets not committed

### Production:
- [ ] HTTPS enabled (SSL certificates)
- [ ] Security headers configured
- [ ] Database SSL connection
- [ ] Firewall rules configured
- [ ] Backups encrypted
- [ ] Monitoring & alerting
- [ ] Regular security updates
- [ ] Penetration testing done
- [ ] GDPR compliance checked
- [ ] Incident response plan

---

## 12. Security Incident Response

**Ak dôjde k bezpečnostnému incidentu:**

1. **Identifikácia:** Zistiť rozsah problému
2. **Containment:** Izolovať postihnuté systémy
3. **Eradication:** Odstrániť hrozbu
4. **Recovery:** Obnoviť systém
5. **Lessons Learned:** Analyzovať a zlepšiť

**Kontakty:**
- Security Lead: security@mirri.gov.sk
- Incident Hotline: +421 XXX XXX XXX

---

## Zdroje

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
