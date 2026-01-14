# Štruktúra projektu

## Kompletná adresárová štruktúra

```
vk-retry/
├── app/                              # Next.js App Router (root level)
│   ├── (admin-protected)/            # Admin layout group (protected)
│   │   ├── applicants/               # Správa uchádzačov
│   │   │   ├── page.tsx              # Zoznam uchádzačov
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Vytvorenie uchádzača
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detail uchádzača
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Admin dashboard
│   │   ├── users/                    # Správa používateľov
│   │   │   ├── page.tsx              # Zoznam používateľov
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Vytvorenie používateľa
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detail používateľa
│   │   ├── tests/                    # Knižnica testov
│   │   │   ├── page.tsx              # Zoznam testov
│   │   │   ├── import/
│   │   │   │   └── page.tsx          # Import testov z Word
│   │   │   ├── practice/
│   │   │   │   └── page.tsx          # Precvičovanie testov
│   │   │   ├── types/
│   │   │   │   └── page.tsx          # Typy testov
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detail testu
│   │   ├── vk/                       # Výberové konania
│   │   │   ├── page.tsx              # Zoznam VK
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Vytvorenie VK
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detail VK
│   │   │       └── monitoring/
│   │   │           └── page.tsx      # Monitoring VK
│   │   └── archive/                  # Archív (TODO)
│   │       └── page.tsx
│   ├── applicant/                    # Uchádzač routes (TODO - in development)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── test/
│   │       └── [sessionId]/
│   │           ├── page.tsx          # Test interface
│   │           └── result/
│   │               └── page.tsx      # Výsledok testu
│   ├── api/                          # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # Auth.js (NextAuth v5) config
│   │   ├── admin/                    # Admin API endpoints
│   │   │   ├── applicants/
│   │   │   │   ├── route.ts          # GET, POST (list, create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET, PATCH, DELETE
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts          # Dashboard stats
│   │   │   ├── users/
│   │   │   │   ├── route.ts          # GET, POST (list, create)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │   │       └── roles/
│   │   │   │           ├── route.ts  # GET, POST
│   │   │   │           └── [roleId]/
│   │   │   │               └── route.ts  # DELETE
│   │   │   ├── test-types/
│   │   │   │   ├── route.ts          # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PATCH, DELETE
│   │   │   ├── tests/
│   │   │   │   ├── route.ts          # GET, POST
│   │   │   │   ├── categories/
│   │   │   │   │   └── route.ts      # GET categories
│   │   │   │   ├── import/
│   │   │   │   │   └── save/
│   │   │   │   │       └── route.ts  # Word import
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │   │       └── clone/
│   │   │   │           └── route.ts  # POST clone
│   │   │   └── vk/
│   │   │       ├── route.ts          # GET, POST
│   │   │       └── [id]/
│   │   │           ├── route.ts      # GET, PATCH, DELETE
│   │   │           ├── candidates/
│   │   │           │   ├── route.ts  # GET, POST
│   │   │           │   ├── available/
│   │   │           │   │   └── route.ts  # GET available
│   │   │           │   └── [candidateId]/
│   │   │           │       └── route.ts  # DELETE
│   │   │           ├── commission/
│   │   │           │   ├── route.ts  # GET commission
│   │   │           │   └── members/
│   │   │           │       ├── route.ts  # GET, POST
│   │   │           │       └── [memberId]/
│   │   │           │           └── route.ts  # DELETE
│   │   │           ├── gestor/
│   │   │           │   └── route.ts  # PATCH gestor
│   │   │           ├── tests/
│   │   │           │   └── route.ts  # GET, POST (VK tests)
│   │   │           ├── monitoring/
│   │   │           │   └── route.ts  # GET monitoring data
│   │   │           └── validation/
│   │   │               └── route.ts  # GET validation status
│   │   ├── applicant/                # Applicant API endpoints
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts          # GET dashboard
│   │   │   └── test/
│   │   │       └── [sessionId]/
│   │   │           ├── route.ts      # GET session
│   │   │           ├── save/
│   │   │           │   └── route.ts  # POST save answers
│   │   │           ├── submit/
│   │   │           │   └── route.ts  # POST submit
│   │   │           └── result/
│   │   │               └── route.ts  # GET result
│   │   └── practice/                 # Practice test API
│   │       ├── tests/
│   │       │   └── route.ts          # GET available tests
│   │       ├── start/
│   │       │   └── route.ts          # POST start session
│   │       ├── history/
│   │       │   └── route.ts          # GET history
│   │       └── [sessionId]/
│   │           └── submit/
│   │               └── route.ts      # POST submit
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles (Tailwind)
├── components/                       # React komponenty
│   ├── admin/                        # Admin komponenty
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ApplicantCard.tsx
│   ├── vk/                           # VK komponenty
│   │   ├── TestsTab.tsx
│   │   ├── CandidatesTab.tsx
│   │   ├── CommissionTab.tsx
│   │   └── ValidationStatusCard.tsx
│   ├── providers/
│   │   └── QueryProvider.tsx         # TanStack Query provider
│   ├── settings/
│   │   └── SecuritySettingsForm.tsx
│   ├── ConfirmModal.tsx              # Reusable confirm dialog
│   ├── ErrorBoundary.tsx             # Error handling
│   └── DateTimePicker.tsx            # Date/time picker
├── lib/                              # Utilities a helpers
│   ├── auth.ts                       # Auth.js config
│   ├── prisma.ts                     # Prisma client
│   ├── vk-validation.ts              # VK validation logic
│   ├── pdf/                          # PDF generation (TODO)
│   │   └── generator.ts
│   └── question-battery/             # Question battery (TODO)
│       └── index.ts
├── types/                            # TypeScript types
│   └── next-auth.d.ts                # NextAuth types extension
├── hooks/                            # Custom React hooks
│   ├── useApplicants.ts
│   ├── useUsers.ts
│   ├── useTests.ts
│   ├── useTestTypes.ts
│   ├── usePracticeTests.ts
│   ├── useVKs.ts
│   └── useQuestionCategories.ts
├── prisma/
│   ├── schema.prisma                 # Prisma schema
│   ├── seed.ts                       # Database seeding
│   └── migrations/                   # DB migrácie
│       ├── 20251010120000_remove_institutions/
│       ├── 20251010140000_rename_date_to_start_datetime/
│       ├── 20251010190000_add_question_battery/
│       └── ... (ďalšie migrácie)
├── scripts/                          # Utility scripty
│   ├── deploy.sh                     # Production deployment
│   ├── db-tunnel.sh                  # SSH tunnel do DB
│   └── README.md
├── tests/                            # Testy
│   ├── backend/                      # Backend API unit tests (Vitest)
│   │   ├── applicants-api.test.ts
│   │   ├── tests-api.test.ts
│   │   ├── practice-api.test.ts
│   │   └── evaluation-config-api.test.ts
│   ├── e2e/                          # E2E tests (Playwright)
│   │   ├── admin/                    # Admin E2E tests
│   │   │   ├── dashboard.spec.ts
│   │   │   ├── applicants-create.spec.ts
│   │   │   ├── applicants-detail.spec.ts
│   │   │   ├── users-list.spec.ts
│   │   │   ├── test-detail.spec.ts
│   │   │   ├── test-import.spec.ts
│   │   │   ├── vk-list.spec.ts
│   │   │   ├── vk-create-and-detail.spec.ts
│   │   │   └── practice.spec.ts
│   │   ├── smoke/                    # Production smoke tests
│   │   │   └── production.spec.ts
│   │   └── helpers/
│   │       └── auth.ts               # Test helpers
│   └── setup.ts                      # Test setup
├── docs/                             # Dokumentácia
│   ├── 01-technicka-architektura.md
│   ├── 02-tech-stack.md
│   ├── 03-struktura-projektu.md
│   ├── 13-testovanie.md
│   ├── 23-deployment.md
│   ├── patterns/                     # Pattern guides
│   │   ├── form-validation.md
│   │   ├── icons.md
│   │   ├── ui-components.md
│   │   ├── e2e-form-tests.md
│   │   └── backend-testing.md
│   └── daily/                        # Daily notes
├── public/
│   └── favicon.ico
├── .env.local                        # Local env vars (gitignored)
├── .env.example                      # Env template (TODO)
├── .eslintrc.json                    # ESLint config
├── .gitignore
├── auth.ts                           # Auth.js config (root level)
├── middleware.ts                     # Next.js middleware (auth check)
├── next.config.js                    # Next.js config
├── package.json
├── playwright.config.ts              # Playwright E2E config
├── postcss.config.js                 # PostCSS config
├── tailwind.config.ts                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── vitest.config.ts                  # Vitest backend tests config
├── CLAUDE.md                         # Claude Code instructions
└── README.md
```

## Kľúčové adresáre vysvetlené

### `/app` - Next.js App Router (Next.js 14 App Router)
- **Route Groups**: `(admin-protected)` - zdieľané layouty s auth protection, bez URL segmentu
- **Dynamic Routes**: `[id]`, `[sessionId]` - parametrizované cesty
- **API Routes**: `api/` - REST API endpointy (Next.js API routes)
- **Layout.tsx**: Root layout s TanStack Query provider, Toaster
- **Middleware**: Ochrana routes pomocou `middleware.ts` (Auth.js session check)

### `/components` - React komponenty
- **admin/**: Admin-specific komponenty (Header, Sidebar)
- **vk/**: VK-specific komponenty (tabs, cards)
- **providers/**: Context providers (QueryProvider pre TanStack Query)
- **settings/**: Settings forms (SecuritySettingsForm)
- Reusable komponenty: ConfirmModal, DateTimePicker, ErrorBoundary

### `/lib` - Utilities a helpers
- **auth.ts**: Auth.js (NextAuth v5) configuration
- **prisma.ts**: Prisma client singleton
- **vk-validation.ts**: VK validation logic
- **pdf/**: PDF generation (TODO - Puppeteer plánovaný)
- **question-battery/**: Question battery logic (TODO)

### `/hooks` - Custom React hooks
- **TanStack Query hooks**: useApplicants, useUsers, useTests, useVKs
- Data fetching, mutations, cache management

### `/types` - TypeScript definitions
- **next-auth.d.ts**: Extends NextAuth types pre custom user properties

### `/prisma` - Databáza
- **schema.prisma**: DB schéma (User, VyberoveKonanie, Test, TestSession, atď.)
- **migrations/**: Prisma migračné scripty (timestamped)
- **seed.ts**: Test dáta pre development

### `/tests` - Testovanie
- **backend/**: Vitest unit tests pre API routes
- **e2e/**: Playwright E2E tests (admin flows, smoke tests)
- **helpers/**: Test utilities (auth helpers)

### `/scripts` - Deployment a utility scripty
- **deploy.sh**: Production deployment na DigitalOcean server
- **db-tunnel.sh**: SSH tunnel pre lokálny development
- Seed scripty, migračné scripty

## Naming Conventions

### Súbory
- **Komponenty**: PascalCase (napr. `UserForm.tsx`)
- **Utilities**: camelCase (napr. `formatDate.ts`)
- **API routes**: snake_case alebo kebab-case podľa REST
- **CSS**: kebab-case (napr. `custom-styles.css`)

### Premenné a funkcie
```typescript
// Komponenty
export function TestEditor() {}

// Hooks
export function useAuth() {}

// Utilities
export function formatDate() {}

// Konštanty
export const MAX_FILE_SIZE = 10485760;
export const UserRole = {
  ADMIN: 'ADMIN',
  GESTOR: 'GESTOR',
  // ...
} as const;

// Types
export type User = {};
export interface VKHeader {}
```

## Import Aliases

V `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Použitie (root-level imports):
```typescript
import { Header } from '@/components/admin/Header'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { User } from '@prisma/client'
import { useApplicants } from '@/hooks/useApplicants'
```

## Database Connection

### Local Development
- **SSH Tunnel** do production PostgreSQL databázy
- **Port 5601** (local) → **Port 5433** (remote Docker container)
- **Script**: `./scripts/db-tunnel.sh`

```bash
# Start SSH tunnel
ssh -i ~/.ssh/monitra_do -L 5601:localhost:5433 -N root@165.22.95.150

# Check if tunnel is running
lsof -i :5601
```

### Production
- **PostgreSQL** v Docker kontajneri na porte 5433
- **Direct connection** z Next.js app (localhost:5433)

## Deployment

### Development workflow
```bash
# Start local dev server
npm run dev

# Run backend tests
npm run test:backend

# Run E2E tests
npm run test:e2e

# Database migrations
npx prisma migrate dev
npx prisma generate
```

### Production deployment
```bash
# Deploy to production (vk.retry.sk)
./scripts/deploy.sh

# Deploy with auto-confirm
./scripts/deploy.sh --yes
```

**Deployment process:**
1. Local production build (`npm run build`)
2. Rsync `.next/` directory to server
3. Install dependencies on server (`npm ci --production`)
4. Run migrations (`npx prisma migrate deploy`)
5. Reload PM2 (`pm2 reload vk-retry`)
6. Health check
7. Smoke tests

## Git Workflow

```
main                    # Production branch (direct commits)
```

**Note:** Momentálne pracujeme priamo na `main` branchi. Feature branches a pull requests nie sú ešte implementované.
