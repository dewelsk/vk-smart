# OTP / 2FA Simulácia

## Prehľad

Pre MVP implementujeme **simulovaný** OTP (One-Time Password) systém. V development móde sa OTP kód zobrazuje v konzole namiesto odoslania cez SMS/Email.

**V produkcii** sa bude používať skutočný OTP provider (napr. Twilio SMS, SendGrid Email, alebo eIDAS).

---

## Architektúra OTP Simulácie

```
┌─────────────┐
│   Admin     │
│  prihlási   │
│    sa       │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Backend        │
│  generuje OTP   │
│  (6 číslic)     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│  DEV Mode:              │
│  console.log(otpCode)   │
│                         │
│  PROD Mode:             │
│  send via SMS/Email     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────┐
│   Admin     │
│  zadá OTP   │
│    kód      │
└─────────────┘
```

---

## Implementácia

### 1. OTP Generator

```typescript
// lib/otp/generator.ts
import crypto from 'crypto';

export interface OTPConfig {
  length?: number;  // Default: 6
  expiryMinutes?: number;  // Default: 5
}

export function generateOTP(config: OTPConfig = {}): string {
  const length = config.length || 6;
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);

  // Generate random number in range [min, max]
  const otp = crypto.randomInt(min, max + 1);

  return otp.toString().padStart(length, '0');
}

export function generateRecoveryCode(): string {
  // Generate 8-character alphanumeric code
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}
```

### 2. OTP Storage (Database)

```typescript
// Uloženie do DB
import { prisma } from '@/lib/db/client';

export async function storeOTP({
  userId,
  otpCode,
  expiryMinutes = 5,
}: {
  userId: string;
  otpCode: string;
  expiryMinutes?: number;
}) {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Update user with OTP
  await prisma.user.update({
    where: { id: userId },
    data: {
      otpSecret: otpCode,  // V produkcii by sme hashovali
      otpExpiresAt: expiresAt,
      otpAttempts: 0,
    },
  });

  return { expiresAt };
}
```

### 3. OTP Simulator

```typescript
// lib/otp/simulator.ts
import { logAudit } from '@/lib/audit/logger';

export async function sendOTP({
  userId,
  otpCode,
  method = 'EMAIL',
}: {
  userId: string;
  otpCode: string;
  method?: 'EMAIL' | 'SMS';
}) {
  const simulate = process.env.OTP_SIMULATE === 'true';

  if (simulate) {
    // DEVELOPMENT MODE - Show in console
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 OTP CODE (DEV MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`User ID: ${userId}`);
    console.log(`Method:  ${method}`);
    console.log(`Code:    ${otpCode}`);
    console.log(`Expires: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Log audit
    await logAudit({
      userId,
      akcia: 'OTP_GENERATED',
      details: { method, simulated: true },
    });

    return {
      success: true,
      simulated: true,
      code: otpCode,  // Only in dev mode!
    };
  }

  // PRODUCTION MODE - Send via real provider
  if (method === 'EMAIL') {
    await sendEmailOTP(userId, otpCode);
  } else if (method === 'SMS') {
    await sendSMSOTP(userId, otpCode);
  }

  await logAudit({
    userId,
    akcia: 'OTP_SENT',
    details: { method },
  });

  return {
    success: true,
    simulated: false,
  };
}

// Production implementations
async function sendEmailOTP(userId: string, otpCode: string) {
  // TODO: Integrate with SendGrid / AWS SES
  throw new Error('Email OTP not implemented yet');
}

async function sendSMSOTP(userId: string, otpCode: string) {
  // TODO: Integrate with Twilio / Vonage
  throw new Error('SMS OTP not implemented yet');
}
```

### 4. OTP Verification

```typescript
// lib/otp/verifier.ts
import { prisma } from '@/lib/db/client';
import { logAudit } from '@/lib/audit/logger';

const MAX_ATTEMPTS = 3;

export async function verifyOTP({
  userId,
  otpCode,
}: {
  userId: string;
  otpCode: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      otpSecret: true,
      otpExpiresAt: true,
      otpAttempts: true,
    },
  });

  if (!user || !user.otpSecret) {
    return { success: false, error: 'OTP nebol vygenerovaný' };
  }

  // Check expiry
  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    await clearOTP(userId);
    return { success: false, error: 'OTP vypršal. Vyžiadajte nový.' };
  }

  // Check attempts
  if (user.otpAttempts >= MAX_ATTEMPTS) {
    await clearOTP(userId);
    return { success: false, error: 'Príliš veľa neúspešných pokusov' };
  }

  // Verify code
  if (user.otpSecret !== otpCode) {
    // Increment attempts
    await prisma.user.update({
      where: { id: userId },
      data: { otpAttempts: { increment: 1 } },
    });

    await logAudit({
      userId,
      akcia: 'OTP_VERIFY_FAILED',
      details: { attempts: user.otpAttempts + 1 },
    });

    return {
      success: false,
      error: `Nesprávny kód. Zostáva ${MAX_ATTEMPTS - user.otpAttempts - 1} pokusov.`,
    };
  }

  // Success - clear OTP
  await clearOTP(userId);

  await logAudit({
    userId,
    akcia: 'OTP_VERIFY_SUCCESS',
  });

  return { success: true };
}

async function clearOTP(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      otpSecret: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    },
  });
}
```

### 5. Recovery Code

```typescript
// lib/otp/recovery.ts
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { generateRecoveryCode } from './generator';

export async function generateAndStoreRecoveryCode(userId: string): Promise<string> {
  const recoveryCode = generateRecoveryCode();
  const hashedCode = await bcrypt.hash(recoveryCode, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { recoveryCode: hashedCode },
  });

  // Return plaintext ONLY ONCE - user must save it
  return recoveryCode;
}

export async function verifyRecoveryCode({
  userId,
  code,
}: {
  userId: string;
  code: string;
}): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { recoveryCode: true },
  });

  if (!user || !user.recoveryCode) {
    return false;
  }

  return bcrypt.compare(code, user.recoveryCode);
}
```

---

## API Endpointy

### POST `/api/auth/2fa/generate`

**Request:**
```json
{
  "userId": "user_123"
}
```

**Response (DEV):**
```json
{
  "success": true,
  "simulated": true,
  "code": "123456",
  "expiresAt": "2025-01-01T12:05:00Z",
  "message": "OTP kód bol zobrazený v konzole"
}
```

**Response (PROD):**
```json
{
  "success": true,
  "simulated": false,
  "expiresAt": "2025-01-01T12:05:00Z",
  "message": "OTP kód bol odoslaný na váš email"
}
```

**Implementation:**
```typescript
// app/api/auth/2fa/generate/route.ts
import { generateOTP } from '@/lib/otp/generator';
import { storeOTP } from '@/lib/otp/storage';
import { sendOTP } from '@/lib/otp/simulator';

export async function POST(request: Request) {
  const { userId } = await request.json();

  // Generate OTP
  const otpCode = generateOTP();

  // Store in DB
  const { expiresAt } = await storeOTP({ userId, otpCode });

  // Send (or simulate)
  const result = await sendOTP({ userId, otpCode });

  return NextResponse.json({
    success: true,
    ...result,
    expiresAt,
  });
}
```

### POST `/api/auth/2fa/verify`

**Request:**
```json
{
  "userId": "user_123",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP overený"
}
```

**Implementation:**
```typescript
// app/api/auth/2fa/verify/route.ts
import { verifyOTP } from '@/lib/otp/verifier';

export async function POST(request: Request) {
  const { userId, otpCode } = await request.json();

  const result = await verifyOTP({ userId, otpCode });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  // Generate session token (NextAuth)
  // ...

  return NextResponse.json({ success: true });
}
```

---

## UI Flow

### 1. Login Page

```tsx
// app/(public)/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button, Input } from '@/components/idsk';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsOTP, setNeedsOTP] = useState(false);

  async function handleLogin() {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error === 'NEEDS_2FA') {
      setNeedsOTP(true);
      // Redirect to 2FA page
      window.location.href = '/login/2fa';
    }
  }

  return (
    <form>
      <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Heslo" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={handleLogin}>Prihlásiť sa</Button>
    </form>
  );
}
```

### 2. 2FA Page

```tsx
// app/(public)/login/2fa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Banner } from '@/components/idsk';

export default function TwoFactorPage() {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    // Check if dev mode
    setDevMode(process.env.NODE_ENV === 'development');
  }, []);

  async function handleVerify() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current_user_id',  // Get from session
          otpCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Nastala chyba pri overovaní');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Dvojfaktorové overenie</h1>

      {devMode && (
        <Banner type="info">
          🔐 DEV MODE: OTP kód nájdete v konzole servera
        </Banner>
      )}

      <Input
        label="Zadajte 6-miestny kód"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        maxLength={6}
        error={error}
      />

      <Button onClick={handleVerify} disabled={loading || otpCode.length !== 6}>
        Overiť
      </Button>
    </div>
  );
}
```

---

## Testovanie

### Unit Test - OTP Generator

```typescript
// __tests__/lib/otp/generator.test.ts
import { generateOTP, generateRecoveryCode } from '@/lib/otp/generator';

describe('OTP Generator', () => {
  it('should generate 6-digit OTP by default', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should generate custom length OTP', () => {
    const otp = generateOTP({ length: 8 });
    expect(otp).toHaveLength(8);
    expect(/^\d{8}$/.test(otp)).toBe(true);
  });

  it('should generate recovery code', () => {
    const code = generateRecoveryCode();
    expect(code).toHaveLength(8);
    expect(/^[A-F0-9]{8}$/.test(code)).toBe(true);
  });
});
```

### Integration Test - OTP Flow

```typescript
// __tests__/integration/otp-flow.test.ts
describe('OTP Flow', () => {
  it('should complete full OTP verification', async () => {
    // 1. Generate OTP
    const generateResponse = await fetch('/api/auth/2fa/generate', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test_user' }),
    });
    const { code, expiresAt } = await generateResponse.json();

    expect(code).toBeDefined();
    expect(expiresAt).toBeDefined();

    // 2. Verify OTP
    const verifyResponse = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test_user', otpCode: code }),
    });
    const verifyData = await verifyResponse.json();

    expect(verifyData.success).toBe(true);
  });

  it('should reject invalid OTP', async () => {
    const response = await fetch('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ userId: 'test_user', otpCode: '000000' }),
    });
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
```

---

## Produkčná implementácia (budúcnosť)

### SMS Provider - Twilio

```typescript
// lib/otp/providers/twilio.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMSOTP(phoneNumber: string, otpCode: string) {
  await client.messages.create({
    body: `Váš OTP kód: ${otpCode}. Platný 5 minút.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
}
```

### Email Provider - SendGrid

```typescript
// lib/otp/providers/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmailOTP(email: string, otpCode: string) {
  await sgMail.send({
    to: email,
    from: 'vk-system@mirri.gov.sk',
    subject: 'Váš OTP kód',
    text: `Váš OTP kód: ${otpCode}. Platný 5 minút.`,
    html: `<p>Váš OTP kód: <strong>${otpCode}</strong></p><p>Platný 5 minút.</p>`,
  });
}
```

---

## Environment Variables

```env
# .env
OTP_SIMULATE=true              # Dev: true, Prod: false
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3

# Production only
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

SENDGRID_API_KEY=
```

---

## Zhrnutie

✅ **Dev Mode:** OTP sa zobrazuje v konzole
✅ **Prod Mode:** OTP sa odosiela cez SMS/Email
✅ **Security:** Max. 3 pokusy, 5 min expirácia
✅ **Recovery:** Recovery kód pre núdzové prípady
✅ **Audit:** Všetky OTP akcie zalogované
