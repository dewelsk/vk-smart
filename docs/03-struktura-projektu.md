# Štruktúra projektu

## Kompletná adresárová štruktúra

```
hackathon-vk/
├── .github/
│   └── workflows/                    # GitHub Actions (neskôr)
│       └── ci.yml
├── docker/
│   ├── Dockerfile                    # Next.js app image
│   ├── Dockerfile.dev                # Development image
│   ├── docker-compose.yml            # Compose config
│   ├── docker-compose.prod.yml       # Production override
│   └── nginx/
│       └── nginx.conf                # Nginx config (produkcia)
├── prisma/
│   ├── schema.prisma                 # Prisma schema
│   ├── seed.ts                       # Database seeding
│   └── migrations/                   # DB migrácie
│       └── 20250101_init/
│           └── migration.sql
├── public/
│   ├── uploads/                      # User-uploaded súbory (volume)
│   │   ├── cv/
│   │   ├── tests/
│   │   └── generated-docs/
│   ├── idsk/                         # IDSK assets
│   │   ├── css/
│   │   ├── fonts/
│   │   └── images/
│   └── favicon.ico
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── 2fa/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              # Dashboard layout group
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── admin/                    # Admin routes
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── vk/
│   │   │   │   ├── page.tsx          # Zoznam VK
│   │   │   │   ├── novy/
│   │   │   │   │   └── page.tsx      # Vytvorenie VK
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Detail VK
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── monitoring/
│   │   │   │           └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # Správa používateľov
│   │   │   │   ├── novy/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── import/
│   │   │   │       └── page.tsx      # CSV import
│   │   │   └── tests/
│   │   │       ├── page.tsx          # Knižnica testov
│   │   │       ├── novy/
│   │   │       │   └── page.tsx
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   ├── gestor/                   # Vecný gestor routes
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── tests/
│   │   │       ├── page.tsx          # Moje testy
│   │   │       ├── novy/
│   │   │       │   └── page.tsx      # Vytvorenie testu
│   │   │       └── [id]/
│   │   │           ├── page.tsx
│   │   │           └── edit/
│   │   │               └── page.tsx
│   │   ├── komisia/                  # Komisia routes
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── vk/
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # Zoznam uchádzačov
│   │   │           ├── uchadzac/
│   │   │           │   └── [candidateId]/
│   │   │           │       ├── page.tsx  # Dokumenty
│   │   │           │       └── hodnotenie/
│   │   │           │           └── page.tsx
│   │   │           └── vysledky/
│   │   │               └── page.tsx
│   │   ├── uchadzac/                 # Uchádzač routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Vitaj / info
│   │   │   └── test/
│   │   │       ├── [testId]/
│   │   │       │   ├── page.tsx      # Spustenie testu
│   │   │       │   └── vysledok/
│   │   │       │       └── page.tsx
│   │   │       └── dokoncene/
│   │   │           └── page.tsx
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/
│   │   │   │   │   └── route.ts      # NextAuth config
│   │   │   │   ├── 2fa/
│   │   │   │   │   ├── generate/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── verify/
│   │   │   │   │       └── route.ts
│   │   │   │   └── reset-password/
│   │   │   │       └── route.ts
│   │   │   ├── admin/
│   │   │   │   ├── vk/
│   │   │   │   │   ├── route.ts      # GET, POST (list, create)
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts  # GET, PUT, DELETE
│   │   │   │   ├── users/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── bulk/
│   │   │   │   │   │   └── route.ts  # CSV import
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── test-types/
│   │   │   │   │   ├── route.ts       # GET, POST (list, create)
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # PUT, DELETE
│   │   │   │   ├── test-categories/
│   │   │   │   │   ├── route.ts       # GET, POST
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # PUT, DELETE
│   │   │   │   └── tests/
│   │   │   │       ├── route.ts
│   │   │   │       ├── assign/
│   │   │   │       │   └── route.ts
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts
│   │   │   ├── tests/
│   │   │   │   ├── [testId]/
│   │   │   │   │   ├── start/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── submit/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── results/
│   │   │   │   │       └── route.ts
│   │   │   │   └── candidate/
│   │   │   │       └── [candidateId]/
│   │   │   │           └── route.ts
│   │   │   ├── evaluations/
│   │   │   │   ├── [vkId]/
│   │   │   │   │   ├── route.ts      # GET candidates
│   │   │   │   │   └── submit/
│   │   │   │   │       └── route.ts
│   │   │   │   └── candidate/
│   │   │   │       └── [candidateId]/
│   │   │   │           └── route.ts
│   │   │   ├── documents/
│   │   │   │   ├── upload/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── [candidateId]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── generate-pdf/
│   │   │   │       └── [type]/
│   │   │   │           └── [vkId]/
│   │   │   │               └── route.ts
│   │   │   ├── audit/
│   │   │   │   └── route.ts          # Audit logs
│   │   │   └── health/
│   │   │       └── route.ts          # Health check
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── idsk/                     # IDSK wrapper komponenty
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Radio.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Banner.tsx
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── TwoFactorForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── admin/
│   │   │   ├── VKForm.tsx
│   │   │   ├── VKList.tsx
│   │   │   ├── VKCard.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── UserList.tsx
│   │   │   ├── BulkUserImport.tsx
│   │   │   ├── TestForm.tsx
│   │   │   ├── TestList.tsx
│   │   │   ├── QuestionEditor.tsx
│   │   │   ├── TestAssigner.tsx
│   │   │   └── DashboardStats.tsx
│   │   ├── gestor/
│   │   │   ├── TestEditor.tsx
│   │   │   └── MyTests.tsx
│   │   ├── komisia/
│   │   │   ├── CandidateList.tsx
│   │   │   ├── CandidateDocuments.tsx
│   │   │   ├── EvaluationForm.tsx
│   │   │   └── ResultsTable.tsx
│   │   ├── uchadzac/
│   │   │   ├── TestInterface.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── TestTimer.tsx
│   │   │   ├── TestProgress.tsx
│   │   │   └── TestResult.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── FormError.tsx
│   │   │   └── FormSection.tsx
│   │   ├── ui/
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth.ts               # NextAuth config
│   │   │   ├── session.ts            # Session helpers
│   │   │   └── permissions.ts        # RBAC
│   │   ├── db/
│   │   │   ├── client.ts             # Prisma client
│   │   │   └── helpers.ts            # DB utilities
│   │   ├── api/
│   │   │   ├── client.ts             # API client
│   │   │   └── errors.ts             # Error handling
│   │   ├── validation/
│   │   │   ├── schemas.ts            # Zod schemas
│   │   │   └── validators.ts         # Custom validators
│   │   ├── utils/
│   │   │   ├── dates.ts              # Date utilities
│   │   │   ├── strings.ts            # String helpers
│   │   │   ├── files.ts              # File helpers
│   │   │   └── format.ts             # Formatting
│   │   ├── pdf/
│   │   │   ├── generator.ts          # PDF generation
│   │   │   ├── templates/
│   │   │   │   ├── sumarny-harok.tsx
│   │   │   │   ├── zaverecne-hodnotenie.tsx
│   │   │   │   └── zapisnica.tsx
│   │   │   └── styles.ts
│   │   ├── email/
│   │   │   ├── simulator.ts          # Email simulation
│   │   │   └── templates/
│   │   │       ├── welcome.ts
│   │   │       ├── credentials.ts
│   │   │       └── results.ts
│   │   ├── otp/
│   │   │   ├── simulator.ts          # OTP simulation
│   │   │   └── validator.ts
│   │   ├── logger/
│   │   │   └── winston.ts            # Winston config
│   │   └── constants.ts              # App constants
│   ├── types/
│   │   ├── index.ts                  # Všeobecné typy
│   │   ├── user.ts
│   │   ├── vk.ts
│   │   ├── test.ts
│   │   ├── evaluation.ts
│   │   └── api.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useVK.ts
│   │   ├── useTest.ts
│   │   ├── useTimer.ts
│   │   └── useFileUpload.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── VKContext.tsx
│   │   └── ThemeContext.tsx
│   └── styles/
│       ├── idsk.css                  # IDSK imports
│       └── custom.css                # Custom styles
├── docs/                             # Dokumentácia
│   ├── 01-technicka-architektura.md
│   ├── 02-tech-stack.md
│   ├── 03-struktura-projektu.md
│   ├── ... (všetky dokumenty)
│   └── README.md
├── scripts/
│   ├── seed.sh                       # Database seeding
│   ├── backup.sh                     # Backup script
│   └── deploy.sh                     # Deployment
├── tests/                            # Testy (neskôr)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local                        # Local env vars (gitignored)
├── .env.example                      # Env template
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── docker-compose.yml
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Kľúčové adresáre vysvetlené

### `/src/app` - Next.js App Router
- **Route Groups**: `(auth)`, `(dashboard)` - zdieľané layouty bez URL segmentu
- **Dynamic Routes**: `[id]`, `[candidateId]` - parametrizované cesty
- **API Routes**: `api/` - backend endpointy

### `/src/components` - React komponenty
- **idsk/**: Wrappery pre IDSK komponenty
- **role-based/**: Komponenty špecifické pre roly
- **ui/**: Generické UI komponenty
- **forms/**: Form komponenty

### `/src/lib` - Utilities a helpers
- **auth/**: Autentifikácia a autorizácia
- **db/**: Databázové utility
- **pdf/**: PDF generovanie
- **otp/**: OTP simulácia

### `/prisma` - Databáza
- **schema.prisma**: DB schéma
- **migrations/**: Migračné scripty
- **seed.ts**: Test dáta

### `/public/uploads` - Súbory
- Mapované ako Docker volume
- Organizované podľa VK a kandidátov

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
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  }
}
```

Použitie:
```typescript
import { Button } from '@/components/idsk';
import { formatDate } from '@/lib/utils/dates';
import type { User } from '@/types/user';
```

## Git Workflow

```
main                    # Production
  ├── develop           # Development
  │   ├── feature/auth  # Feature branches
  │   ├── feature/tests
  │   └── feature/pdf
  └── hotfix/           # Emergency fixes
```
