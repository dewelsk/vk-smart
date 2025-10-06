# Dokumentácia - Systém digitalizácie výberových konaní

Kompletná dokumentácia pre systém digitalizácie výberových konaní.

---

## 📚 Obsah dokumentácie

### [01 - Technická architektúra](./01-technicka-architektura.md)
Prehľad architektúry systému, Docker setup, volumes, networking, bezpečnostné vrstvy.

**Kľúčové témy:**
- Docker Compose štruktúra (porty 5600-5602)
- Volume mapping a úložisko súborov
- Environment variables
- Backup stratégia

---

### [02 - Tech Stack](./02-tech-stack.md)
Detailný prehľad všetkých použitých technológií a knižníc.

**Kľúčové technológie:**
- Next.js 14 (App Router)
- React 18
- PostgreSQL 16
- Prisma ORM
- IDSK dizajn systém
- NextAuth.js v5

---

### [03 - Štruktúra projektu](./03-struktura-projektu.md)
Kompletná adresárová štruktúra a organizácia kódu.

**Hlavné adresáre:**
- `/src/app` - Next.js routes
- `/src/components` - React komponenty
- `/src/lib` - Utilities a helpers
- `/prisma` - Databázová schéma
- `/public/uploads` - Súbory používateľov

---

### [04 - Databázový model](./04-databazovy-model.md)
Prisma schéma, ER diagram, príklady dotazov.

**Kľúčové modely:**
- User (4 role)
- VyberoveKonanie
- Test & VKTest
- Candidate
- TestResult
- Evaluation
- AuditLog

---

### [05 - Docker Setup](./05-docker-setup.md)
Detailné návody na prácu s Dockerom.

**Témy:**
- docker-compose.yml
- Dockerfile (dev & prod)
- Spustenie a zastavenie
- Užitočné príkazy
- Troubleshooting

---

### [06 - IDSK Integrácia](./06-idsk-integracia.md)
Integrácia IDSK dizajn systému.

**Použitie IDSK:**
- ✅ Verejná časť (landing, login)
- ✅ Uchádzač sekcia
- ❌ Admin sekcia (Tailwind CSS)

**React wrappery:**
- Button, Input, Select, Card
- Header, Breadcrumbs, Banner

---

### [07 - API Endpoints](./07-api-endpoints.md)
Kompletná dokumentácia všetkých API endpointov.

**Skupiny API:**
- Autentifikácia (`/api/auth/*`)
- Admin - VK (`/api/admin/vk/*`)
- Admin - Používatelia (`/api/admin/users/*`)
- Testy (`/api/tests/*`)
- Hodnotenie (`/api/evaluations/*`)
- Dokumenty (`/api/documents/*`)
- Audit (`/api/audit`)

---

### [08 - MVP Roadmap](./08-mvp-roadmap.md)
Implementačný plán rozdelený do 5 fáz.

**Fázy:**
1. **Týždeň 1:** Foundation & Auth
2. **Týždeň 2:** Admin - VK Management & Testy
3. **Týždeň 3:** Testovací modul & Hodnotenie
4. **Týždeň 4:** Dokumentácia & 2FA
5. **Týždeň 5:** Testovanie & Fixes

---

### [09 - Bezpečnosť](./09-bezpecnost.md)
Komplexné bezpečnostné opatrenia.

**Témy:**
- Autentifikácia (bcrypt, NextAuth)
- Input validation (Zod)
- XSS, CSRF, SQL Injection protection
- Rate limiting
- File upload security
- HTTPS & Security headers
- Audit logging

---

### [10 - OTP Simulácia](./10-otp-simulacia.md)
Implementácia 2FA s OTP simuláciou.

**Funkcie:**
- Generovanie 6-miestneho OTP
- Dev mode: Zobrazenie v konzole
- Prod mode: SMS/Email
- Recovery kódy
- Max. 3 pokusy, 5 min expirácia

---

### [11 - ASCII Wireframes](./11-ascii-wireframes.md)
Návod na vytváranie ASCII wireframov pomocou Python scriptu.

**Kľúčové témy:**
- Prečo používať Python script
- Template a návod na použitie
- Best practices (šírka, padding)
- Overenie správnosti
- Troubleshooting
- Šablóna pre nové wireframy

---

### [12 - Testovacie dáta](./12-testovacie-data.md)
Definícia testovacích účtov a dát pre všetky role.

**Obsahuje:**
- 2 Admin účty (s 2FA + recovery kódy)
- 2 Gestor účty
- 6 Komisia účty (pre 2 VK)
- 7 Uchádzač účty (rôzne fázy)
- 3 Výberové konania (rôzne statusy)
- 3 Testy s otázkami
- Výsledky testov a hodnotenia
- Prisma seed script
- JSON export pre E2E testy

**⚠️ Poznámka:** Heslá sú plain text len pre demo!

---

### [13 - Testovanie](./13-testovanie.md)
Komplexné testovanie pomocou Playwright MCP.

**Pokryté oblasti:**
- Login flow pre všetky role
- Admin operácie (VK, používatelia, testy)
- Gestor operácie (tvorba testov)
- Uchádzač operácie (absolvovanie testov)
- Komisia operácie (hodnotenie)
- Visual regression testing
- Performance testing
- Accessibility testing
- CI/CD integrácia (GitHub Actions)

---

## 🚀 Quick Start

### 1. Prvé spustenie

```bash
# Klonovanie projektu
git clone <repo>
cd hackathon-vk

# Vytvorenie .env
cp .env.example .env
# Upraviť hodnoty v .env

# Spustenie Dockeru
docker-compose up --build

# V inom terminály - Prisma migrácie
docker-compose exec app npx prisma migrate dev

# Seed databázy
docker-compose exec app npx prisma db seed
```

### 2. Prístup k aplikácii

- **App:** http://localhost:5600
- **Adminer:** http://localhost:5602
- **PostgreSQL:** localhost:5601

### 3. Testovací účet

```
Email: admin@mirri.gov.sk
Heslo: Admin123!
Role: ADMIN
```

---

## 📖 Hlavné koncepty

### Používateľské role

| Rola | Popis | Oprávnenia |
|------|-------|------------|
| **Admin** | Tajomník VK | Správa VK, používateľov, schvaľovanie testov |
| **Gestor** | Vecný gestor | Tvorba testov |
| **Komisia** | Členovia komisie | Hodnotenie uchádzačov |
| **Uchádzač** | Kandidát | Absolvovanie testov |

### Workflow

```
1. Admin vytvorí VK (hlavička)
2. Admin vytvorí účty (Gestor, Komisia, Uchádzači)
3. Gestor vytvorí testy → Admin schváli
4. Admin priradí testy k VK
5. Uchádzači absolvujú testy
6. Komisia hodnotí uchádzačov
7. Systém vygeneruje dokumentáciu (PDF)
```

### Testová organizácia

**Typy testov** (editovateľné číselníky):
- Štátny jazyk
- Cudzí jazyk
- IT zručnosti
- Odborný test
- Všeobecný test
- Schopnosti a vlastnosti

**Kategórie testov** (editovateľné, patria k typu):
- Typ → Kategórie (napr. "Štátny jazyk" → "A1", "A2", "B1", "B2")
- Každý test patrí do jednej kategórie
- Flexibilná hierarchická organizácia

---

## 🛠️ Vývoj

### Štruktúra projektu

```
src/
├── app/              # Next.js routes
│   ├── (auth)/      # IDSK layout
│   ├── (admin)/     # Tailwind layout
│   ├── (gestor)/    # Tailwind layout
│   ├── (komisia)/   # IDSK/Tailwind
│   ├── (uchadzac)/  # IDSK layout
│   └── api/         # API routes
├── components/      # React komponenty
│   ├── idsk/        # IDSK wrappery
│   └── ui/          # Custom komponenty
└── lib/             # Utilities
```

### Pridanie nového API endpointu

```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your logic
  return NextResponse.json({ data: 'example' });
}
```

### Pridanie novej stránky

```typescript
// app/(admin)/nova-stranka/page.tsx
export default function NovaStranka() {
  return (
    <div>
      <h1>Nová stránka</h1>
    </div>
  );
}
```

---

## 🧪 Testovanie

### Unit testy
```bash
npm run test
```

### E2E testy (neskôr)
```bash
npm run test:e2e
```

### Linting
```bash
npm run lint
```

---

## 📦 Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🔧 Troubleshooting

### Port už používaný
```bash
lsof -i :5600
kill -9 <PID>
```

### Databázové problémy
```bash
docker-compose down -v
docker-compose up --build
docker-compose exec app npx prisma migrate reset
```

### Hot reload nefunguje
```bash
docker-compose restart app
```

---

## 📞 Kontakt

- **Email:** vk-system@mirri.gov.sk
- **Issues:** GitHub Issues
- **Dokumentácia:** [IDSK.gov.sk](https://idsk.gov.sk)

---

## 📄 Licencia

Tento projekt je súčasťou digitalizácie štátnej správy SR.

---

## 🎯 Roadmap

### MVP (Fázy 1-5)
- [x] Dokumentácia
- [ ] Setup projektu
- [ ] Autentifikácia
- [ ] Admin modul
- [ ] Testovací modul
- [ ] Hodnotiaci modul
- [ ] PDF generovanie

### Post-MVP
- [ ] Všetky typy testov
- [ ] SharePoint integrácia
- [ ] Real SMS/Email OTP
- [ ] Advanced reporting
- [ ] Multi-tenancy

---

## 🤝 Ako prispieť

1. Fork projektu
2. Vytvor feature branch (`git checkout -b feature/nova-funkcionalita`)
3. Commit zmeny (`git commit -m 'Pridanie novej funkcionality'`)
4. Push branch (`git push origin feature/nova-funkcionalita`)
5. Otvor Pull Request

---

## 📚 Dodatočné zdroje

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [IDSK Dizajn manuál](https://idsk.gov.sk)
- [OWASP Security](https://owasp.org)

---

**Posledná aktualizácia:** Október 2025
**Verzia:** 1.0.0 MVP
