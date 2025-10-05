# Login - Prihlásenie

## Účel obrazovky
Prihlasovacia obrazovka pre všetky role (Admin, Gestor, Komisia, Uchádzač). Používa IDSK dizajn systém.

Pre **Admina** je po prihlásení potrebná 2FA verifikácia.

---

## ASCII Wireframe

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              ┌─────────────────────┐                    │
│              │   [Slovak Emblem]   │                    │
│              │                     │                    │
│              │  Výberové konania   │                    │
│              └─────────────────────┘                    │
│                                                          │
│         ┌───────────────────────────────────┐           │
│         │                                   │           │
│         │   Prihlásenie do systému          │           │
│         │   ══════════════════════          │           │
│         │                                   │           │
│         │   Email                           │           │
│         │   ┌─────────────────────────────┐ │           │
│         │   │ admin@mirri.gov.sk          │ │           │
│         │   └─────────────────────────────┘ │           │
│         │                                   │           │
│         │   Heslo                           │           │
│         │   ┌─────────────────────────────┐ │           │
│         │   │ ●●●●●●●●●●●                │ │           │
│         │   └─────────────────────────────┘ │           │
│         │                                   │           │
│         │   [✓] Zapamätať si ma             │           │
│         │                                   │           │
│         │   ┌─────────────────────────────┐ │           │
│         │   │   Prihlásiť sa              │ │           │
│         │   └─────────────────────────────┘ │           │
│         │                                   │           │
│         │   Zabudli ste heslo?              │           │
│         │                                   │           │
│         └───────────────────────────────────┘           │
│                                                          │
│                                                          │
│   ─────────────────────────────────────────────────    │
│   © 2025 Ministerstvo investícií, regionálneho          │
│   rozvoja a informatizácie SR                           │
└─────────────────────────────────────────────────────────┘
```

---

## Elementy na stránke

### 1. Header s logom
**Komponenty:**
- **Erb SR**: Logo / Ikona
- **Názov aplikácie**: "Výberové konania"

**Dizajn:**
- Centrované
- IDSK header štýly
- Background: biela
- Padding: 2rem

**IDSK komponenty:**
```tsx
<Header>
  <img src="/logo-sr.svg" alt="Slovenská republika" />
  <h1 className="govuk-heading-l">Výberové konania</h1>
</Header>
```

---

### 2. Prihlasovacie pole (Card)

**Wrapper:**
- IDSK Card component
- Max width: 480px
- Centrované na stránke
- Box shadow
- Padding: 2rem

#### 2.1 Nadpis
**Text:** "Prihlásenie do systému"
**Štýl:** `govuk-heading-m`

---

#### 2.2 Input pole "Email"

**Label:** "Email"
**Type:** `email`
**Placeholder:** ""
**Required:** Áno
**IDSK component:** `<Input>`

**Validácie:**
- ✅ Povinné pole (required)
- ✅ Validný email formát
- ✅ Max 255 znakov

**Error messages:**
- Prázdne pole: "Email je povinný"
- Neplatný formát: "Neplatný email formát"

**Správanie:**
- OnBlur validácia
- Zobrazenie červeného borderu pri chybe
- Error message pod inputom

**Príklad validácie (Zod):**
```typescript
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email je povinný')
    .email('Neplatný email formát')
    .max(255),
  password: z.string()
    .min(1, 'Heslo je povinné'),
});
```

---

#### 2.3 Input pole "Heslo"

**Label:** "Heslo"
**Type:** `password`
**Required:** Áno
**IDSK component:** `<Input>`

**Validácie:**
- ✅ Povinné pole (required)
- ✅ Min 8 znakov (pri vytváraní účtu, tu len check či nie je prázdne)

**Error messages:**
- Prázdne pole: "Heslo je povinné"

**Správanie:**
- Password mask (●●●●●●)
- Možnosť ukázať heslo (eye icon) - voliteľné

---

#### 2.4 Checkbox "Zapamätať si ma"

**Label:** "Zapamätať si ma"
**Type:** `checkbox`
**Optional:** Áno
**IDSK component:** `<Checkbox>`

**Správanie:**
- Ak je zaškrtnuté → NextAuth session `maxAge` = 30 dní
- Ak nie je zaškrtnuté → session `maxAge` = 8 hodín

**Implementácia:**
```typescript
session: {
  maxAge: rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60,
}
```

---

#### 2.5 Tlačidlo "Prihlásiť sa"

**Text:** "Prihlásiť sa"
**Type:** `submit`
**IDSK component:** `<Button variant="primary">`
**Full width:** Áno

**Stavy:**
- **Default:** Zelený, text biely
- **Hover:** Tmavšia zelená
- **Loading:** Disabled + spinner icon
- **Disabled:** Šedý, ak formulár nie je validný

**Správanie:**
- OnClick → Validácia formulára
- Ak OK → API call `POST /api/auth/login`
- Loading state počas API call
- Redirect podľa role alebo 2FA

---

#### 2.6 Link "Zabudli ste heslo?"

**Text:** "Zabudli ste heslo?"
**Type:** Text link
**IDSK:** `govuk-link`

**Správanie:**
- Klik → Redirect na `/reset-password` (zatiaľ nerealizované v MVP)
- Hover: Underline

**Poznámka:** V MVP môže byť tento link neaktívny alebo viesť na info stránku s kontaktom na admin.

---

## Navigácia

### Odkiaľ sa dostať na túto obrazovku:
- Priamy vstup: `/login`
- Automatický redirect z akejkoľvek chránenej stránky (ak nie je prihlásený)
- Po kliknutí "Odhlásiť sa" z aplikácie

### Kam viesť z tejto obrazovky:

**Po úspešnom prihlásení (bez 2FA):**
- **Gestor** → `/gestor/dashboard`
- **Komisia** → `/komisia/dashboard`
- **Uchádzač** → `/uchadzac/dashboard`

**Po úspešnom prihlásení (s 2FA - Admin):**
- **Admin** → `/login/2fa` (2FA verifikačná stránka)

---

## API Volania

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "admin@mirri.gov.sk",
  "password": "Admin123!",
  "rememberMe": true
}
```

**Response (úspešné - bez 2FA):**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "gestor@mirri.gov.sk",
    "name": "Ján",
    "surname": "Novák",
    "role": "GESTOR"
  },
  "redirect": "/gestor/dashboard"
}
```

**Response (úspešné - s 2FA pre Admina):**
```json
{
  "success": true,
  "requires2FA": true,
  "userId": "user_admin_123",
  "redirect": "/login/2fa"
}
```

**Response (chyba):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Nesprávny email alebo heslo"
  }
}
```

---

## Stavy (Loading, Error, Success)

### Loading State

Pri kliknutí na "Prihlásiť sa":
```
┌─────────────────────────────┐
│   Prihlásenie do systému    │
│   ══════════════════════    │
│                             │
│   Email                     │
│   ┌───────────────────────┐ │
│   │ admin@mirri.gov.sk    │ │
│   └───────────────────────┘ │
│                             │
│   Heslo                     │
│   ┌───────────────────────┐ │
│   │ ●●●●●●●●●●●          │ │
│   └───────────────────────┘ │
│                             │
│   ┌───────────────────────┐ │
│   │ [🔄] Prihlasovanie... │ │  ← Disabled + Spinner
│   └───────────────────────┘ │
└─────────────────────────────┘
```

**Implementácia:**
```typescript
<Button disabled={loading} onClick={handleLogin}>
  {loading ? (
    <>
      <Spinner /> Prihlasovanie...
    </>
  ) : (
    'Prihlásiť sa'
  )}
</Button>
```

---

### Error State

**Typy chýb:**

#### 1. Validačná chyba (client-side)
- Prázdne pole
- Neplatný email

**Zobrazenie:**
- Červený border okolo inputu
- Error message pod inputom (červený text)
- Ikona výkričníka

```
Email
┌─────────────────────────────┐
│                             │  ← Červený border
└─────────────────────────────┘
⚠️ Email je povinný
```

#### 2. Nesprávne prihlasovacie údaje

**Zobrazenie:**
- Banner na vrchu formulára (IDSK error banner)
- Text: "Nesprávny email alebo heslo"

```
┌───────────────────────────────────────┐
│ ⚠️ Nesprávny email alebo heslo        │
└───────────────────────────────────────┘

  Prihlásenie do systému
  ...
```

**Implementácia:**
```tsx
{error && (
  <Banner type="error">
    {error.message}
  </Banner>
)}
```

#### 3. Rate limit (príliš veľa pokusov)

**Zobrazenie:**
- Error banner
- Text: "Príliš veľa pokusov. Skúste o 5 minút."
- Disabled login button

```
┌───────────────────────────────────────┐
│ ⚠️ Príliš veľa pokusov.               │
│    Skúste o 5 minút.                  │
└───────────────────────────────────────┘
```

**API Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Príliš veľa pokusov. Skúste neskôr.",
    "retryAfter": 300
  }
}
```

#### 4. Server error

**Zobrazenie:**
- Error banner
- Text: "Nastala chyba pri prihlasovaní. Skúste neskôr."
- Tlačidlo "Skúsiť znova"

---

### Success State

**Po úspešnom prihlásení (bez 2FA):**
1. Success banner (zelený) - "Prihlásenie úspešné"
2. Redirect na dashboard (podľa role)
3. Loading spinner počas redirectu

**Po úspešnom prihlásení (s 2FA - Admin):**
1. Info banner (modrý) - "Zadajte 2FA kód"
2. Redirect na `/login/2fa`

---

## Validácie

### Client-side (React Hook Form + Zod)

```typescript
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email je povinný')
    .email('Neplatný email formát')
    .max(255),
  password: z.string()
    .min(1, 'Heslo je povinné'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;
```

**Kedy validovať:**
- OnBlur pre každé pole
- OnSubmit pred API callom

---

### Server-side (API endpoint)

```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // 1. Validácia vstupu (Zod)
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  // 2. Rate limiting check
  const ip = request.headers.get('x-forwarded-for');
  if (!checkRateLimit(ip, 5)) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts' },
      { status: 429 }
    );
  }

  // 3. Overenie credentials
  const user = await verifyCredentials(body.email, body.password);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // 4. Check 2FA pre Admina
  if (user.role === 'ADMIN') {
    return NextResponse.json({
      success: true,
      requires2FA: true,
      userId: user.id,
    });
  }

  // 5. Vytvorenie session
  const session = await createSession(user, body.rememberMe);

  return NextResponse.json({
    success: true,
    user,
    redirect: getRoleRedirect(user.role),
  });
}
```

---

## Edge Cases

### 1. Používateľ už je prihlásený
- Check pri načítaní stránky
- Ak má session → redirect na dashboard
- NextAuth middleware handling

### 2. Email case-sensitivity
- Normalizovať email na lowercase
- `email.toLowerCase()` pred uložením

### 3. Whitespace v email/heslo
- `.trim()` pri validácii
- Server aj client

### 4. Účet deaktivovaný
**Response:**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Váš účet bol deaktivovaný. Kontaktujte administrátora."
  }
}
```

### 5. Stará session (token expirovaný)
- NextAuth automaticky handluje
- Refresh token flow

### 6. Browser back button po odhlásení
- Middleware check pre protected routes
- Redirect na login ak nie je session

---

## Bezpečnosť

### 1. Rate Limiting
- Max. 5 pokusov za minútu z jednej IP
- Po 5 pokusoch → 5 minút ban

### 2. Password Hashing
- Bcrypt s 10 rounds
- Never store plaintext passwords

### 3. CSRF Protection
- NextAuth.js built-in CSRF token
- Automaticky included v requestoch

### 4. XSS Protection
- Sanitize všetky inputy
- Content Security Policy headers

### 5. HTTPS Only (production)
- Secure cookies
- HSTS header

---

## Implementácia (React)

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Input, Button, Banner } from '@/components/idsk';
import { loginSchema, type LoginForm } from '@/lib/validation/schemas';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError('Nesprávny email alebo heslo');
        return;
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError('Nastala chyba pri prihlasovaní');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="govuk-width-container">
      <main className="govuk-main-wrapper">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds govuk-!-margin-top-8">
            {error && <Banner type="error">{error}</Banner>}

            <Card title="Prihlásenie do systému">
              <form onSubmit={handleSubmit(onSubmit)}>
                <Input
                  label="Email"
                  type="email"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Heslo"
                  type="password"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Checkbox
                  label="Zapamätať si ma"
                  {...register('rememberMe')}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Prihlasovanie...' : 'Prihlásiť sa'}
                </Button>

                <p className="govuk-body-s govuk-!-margin-top-4">
                  <a href="/reset-password" className="govuk-link">
                    Zabudli ste heslo?
                  </a>
                </p>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## Accessibility

- **Keyboard navigation:** Tab order správny
- **Screen readers:**
  - Aria labels pre inputy
  - Error messages announced
- **Focus management:** Focus na prvý input pri načítaní
- **Color contrast:** WCAG AA compliant
- **Error identification:** Viditeľné červené bordery + text

---

## Responsive Design

**Desktop (> 768px):**
- Login card max-width 480px, centrovaný
- Full inputy

**Mobile (< 768px):**
- Full width card
- Stack layout
- Väčší touch targets (min 44x44px)
