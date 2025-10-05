# Tech Stack - Detailný prehľad technológií

## Frontend

### Core Framework
- **Next.js 14** (App Router)
  - Server Components
  - API Routes
  - File-based routing
  - Built-in optimalizácie
  - Verzia: `^14.2.0`

- **React 18**
  - Hooks API
  - Context API pre state management
  - Suspense boundaries
  - Verzia: `^18.3.0`

- **TypeScript**
  - Strict mode enabled
  - Type safety pre celý projekt
  - Verzia: `^5.5.0`

### UI & Styling

**IDSK Dizajn systém (Možnosť A):**
```bash
npm install @id-sk/frontend
```

**Wrapper komponenty:**
- Vytvoríme vlastné React komponenty v `src/components/idsk/`
- Použijeme IDSK CSS classes
- TypeScript interfaces pre props

**Doplnkové styling:**
- **TailwindCSS** `^3.4.0` - pre custom styling mimo IDSK
- **clsx** - podmienené class names
- **tailwind-merge** - merging Tailwind classes

### Forms & Validation

- **React Hook Form** `^7.53.0`
  - Performantné form handling
  - Minimálne re-rendery
  - Built-in validácia

- **Zod** `^3.23.0`
  - Type-safe schema validation
  - Runtime validation
  - Integration s React Hook Form

Príklad:
```typescript
const testSchema = z.object({
  nazov: z.string().min(3, "Názov musí mať min. 3 znaky"),
  pocetOtazok: z.number().min(5).max(40),
  casMinut: z.number().min(5).max(120),
});
```

### Data Fetching

- **TanStack Query (React Query)** `^5.56.0`
  - Server state management
  - Automatic caching
  - Background refetching
  - Optimistic updates

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['vk', vkId],
  queryFn: () => fetchVK(vkId),
});
```

### State Management

- **React Context** - pre globálny state (user, theme)
- **Zustand** `^4.5.0` (voliteľne) - pre komplexnejší state
- **TanStack Query** - pre server state

### UI Komponenty

**IDSK Komponenty (wrappery):**
```typescript
// src/components/idsk/Button.tsx
// src/components/idsk/Input.tsx
// src/components/idsk/Card.tsx
// src/components/idsk/Header.tsx
// ... atď
```

**Custom komponenty:**
- Dashboard widgets
- Test timer
- Progress bars
- Modals
- Tables

### Date & Time

- **date-fns** `^3.6.0`
  - Date formatting
  - Timezone handling
  - Locale: sk-SK

### File Handling

- **react-dropzone** `^14.2.0` - File upload UI
- **file-saver** - Client-side file download

### PDF

- **@react-pdf/renderer** `^3.4.0` - React PDF generovanie
- **Puppeteer** `^23.4.0` (alternatíva) - HTML to PDF

## Backend

### API

- **Next.js API Routes**
  - `app/api/` directory
  - Server-side logic
  - Edge Runtime (voliteľne)

### Databáza

- **PostgreSQL 16**
  - Relačná databáza
  - JSON support (pre test answers)
  - Full-text search

- **Prisma ORM** `^5.20.0`
  - Type-safe database client
  - Migrations
  - Seeding
  - Studio (DB GUI)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      UserRole
  createdAt DateTime @default(now())
}
```

### Autentifikácia

- **NextAuth.js v5** `^5.0.0-beta`
  - Credentials provider
  - Session management
  - JWT tokens
  - Middleware protection

- **bcryptjs** `^2.4.3`
  - Password hashing
  - Salt rounds: 10

### OTP Simulácia (MVP)

```typescript
// lib/otp-simulator.ts
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(userId: string, otp: string) {
  // Uložiť do DB s expiráciou 5 min
}
```

### File Upload

- **Next.js API Route** s multipart/form-data
- **Multer** (voliteľne) - middleware pre upload
- Validácia: typ, veľkosť, virus scan (neskôr)

### Email (Simulované v MVP)

```typescript
// lib/email-simulator.ts
async function sendEmail(to: string, subject: string, body: string) {
  if (process.env.EMAIL_SIMULATE === 'true') {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true, simulated: true };
  }
  // Real email sending
}
```

### Logging & Audit

- **Winston** `^3.14.0`
  - Structured logging
  - Log levels
  - File rotation

```typescript
logger.info('User login', {
  userId: user.id,
  role: user.role,
  timestamp: new Date()
});
```

### Validácia & Security

- **Zod** - Input validácia (aj na BE)
- **express-rate-limit** - Rate limiting
- **helmet** - Security headers
- **sanitize-html** - XSS protection

## Development Tools

### Code Quality

- **ESLint** `^8.57.0` - Linting
- **Prettier** `^3.3.0` - Code formatting
- **Husky** `^9.1.0` - Git hooks
- **lint-staged** - Pre-commit checks

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Testing (Voliteľné pre MVP)

- **Vitest** - Unit tests
- **Testing Library** - Component tests
- **Playwright** - E2E tests (neskôr)

## DevOps

### Docker

- **Docker** `^24.0.0`
- **Docker Compose** `^2.23.0`

### Version Control

- **Git**
- **GitHub** - Repository + Issues

### Package Manager

- **npm** `^10.0.0` (alebo pnpm)

## Verzie Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@id-sk/frontend": "^2.11.0",
    "next-auth": "^5.0.0-beta",
    "@prisma/client": "^5.20.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@tanstack/react-query": "^5.56.0",
    "bcryptjs": "^2.4.3",
    "date-fns": "^3.6.0",
    "@react-pdf/renderer": "^3.4.0",
    "winston": "^3.14.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.16.0",
    "prisma": "^5.20.0",
    "eslint": "^8.57.0",
    "prettier": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## Prečo tieto technológie?

### Next.js 14
- ✅ Full-stack framework (FE + BE v jednom)
- ✅ Server Components = lepší performance
- ✅ Built-in optimalizácie (images, fonts)
- ✅ Jednoduchý deployment

### PostgreSQL
- ✅ Relačné dáta (users, VK, tests)
- ✅ JSON support (test answers)
- ✅ Transact-SQL pre komplexné operácie
- ✅ Mature, stable, open-source

### Prisma
- ✅ Type-safe queries
- ✅ Automatické migrácie
- ✅ Prisma Studio (DB GUI)
- ✅ Excellent DX

### IDSK + React
- ✅ Dodržanie štátneho štandardu
- ✅ React wrappery = moderný DX
- ✅ Flexibilita pri customizácii

### TypeScript
- ✅ Type safety = menej bugov
- ✅ Better IDE support
- ✅ Refactoring confidence
- ✅ Self-documenting code
