# 18. Vyhľadávanie bez diakritiky (Diacritic-Insensitive Search)

## Problém

PostgreSQL štandardne rozlišuje diakritiku pri vyhľadávaní. To znamená, že:
- Hľadanie "vnutra" nenájde "vnútra"
- Hľadanie "rezort" nenájde "rezôrt"
- Prisma ORM filter `mode: 'insensitive'` rieši len case-sensitivity (veľkosť písmen), ale **NIE diakritiku**

### Testovanie problému

```sql
-- Test: ILIKE s diakritikou (funguje)
SELECT COUNT(*) FROM institutions WHERE name ILIKE '%vnútra%';  -- Výsledok: 1

-- Test: ILIKE bez diakritiky (NEFUNGUJE)
SELECT COUNT(*) FROM institutions WHERE name ILIKE '%vnutra%';  -- Výsledok: 0 ❌
```

## Overené riešenia

### ❌ Nefungujúce riešenia

1. **Prisma `mode: 'insensitive'`** - Rieši len case-sensitivity, NIE diakritiku
2. **ICU Collations** - Nepodporujú ILIKE operátor a majú problémy so slovenčinou
3. **Raw SQL s unaccent v každom endpointe** - Funguje, ale zahodí výhody ORM

### ✅ Odporúčané riešenie: Generated Search Columns

Používa PostgreSQL `unaccent` extension s automaticky generovanými stĺpcami.

#### Výhody:
- ✅ Čistý Prisma ORM kód (type-safe)
- ✅ Automatická aktualizácia pri INSERT/UPDATE
- ✅ Rýchle vyhľadávanie s trigram indexami
- ✅ Žiadne raw SQL queries v API kóde

## Implementácia (Proof of Concept na Institutions)

### 1. Povoliť PostgreSQL extensions

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 2. Vytvoriť immutable wrapper funkciu

```sql
CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $func$
SELECT unaccent('unaccent', $1)
$func$;
```

**Poznámka:** `IMMUTABLE` je potrebné pre vytvorenie indexov.

### 3. Pridať generated search columns

```sql
-- Pre institutions tabuľku
ALTER TABLE institutions
ADD COLUMN name_search text
  GENERATED ALWAYS AS (f_unaccent(name)) STORED;

ALTER TABLE institutions
ADD COLUMN code_search text
  GENERATED ALWAYS AS (f_unaccent(code)) STORED;

ALTER TABLE institutions
ADD COLUMN description_search text
  GENERATED ALWAYS AS (f_unaccent(COALESCE(description, ''))) STORED;
```

### 4. Vytvoriť trigram indexy

```sql
CREATE INDEX idx_institutions_name_search
  ON institutions USING gin (name_search gin_trgm_ops);

CREATE INDEX idx_institutions_code_search
  ON institutions USING gin (code_search gin_trgm_ops);

CREATE INDEX idx_institutions_description_search
  ON institutions USING gin (description_search gin_trgm_ops);
```

### 5. Pridať do Prisma schémy

```prisma
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
```

### 6. Vygenerovať Prisma Client

```bash
npx prisma generate
```

### 7. Použiť v API endpointe

```typescript
// app/api/superadmin/institutions/route.ts

// Search filter - use generated search columns
if (search) {
  const normalizedSearch = search.toLowerCase()

  where.OR = [
    { name_search: { contains: normalizedSearch, mode: 'insensitive' } },
    { code_search: { contains: normalizedSearch, mode: 'insensitive' } },
    { description_search: { contains: normalizedSearch, mode: 'insensitive' } },
  ]
}

const institutions = await prisma.institution.findMany({
  where,
  // ... ďalšie parametre
})
```

## Test funkcionality

```typescript
// Test 1: Vyhľadávanie s diakritikou
GET /api/superadmin/institutions?search=vnútra
// Výsledok: Ministerstvo vnútra SR ✅

// Test 2: Vyhľadávanie bez diakritiky
GET /api/superadmin/institutions?search=vnutra
// Výsledok: Ministerstvo vnútra SR ✅
```

## Aplikácia na ďalšie tabuľky

Pre aplikáciu na users, vyberove_konania, candidates:

### 1. Vytvorte search columns

```sql
-- Pre users tabuľku
ALTER TABLE users
ADD COLUMN name_search text
  GENERATED ALWAYS AS (f_unaccent(name)) STORED,
ADD COLUMN surname_search text
  GENERATED ALWAYS AS (f_unaccent(surname)) STORED,
ADD COLUMN email_search text
  GENERATED ALWAYS AS (f_unaccent(COALESCE(email, ''))) STORED;

-- Vytvorte indexy
CREATE INDEX idx_users_name_search
  ON users USING gin (name_search gin_trgm_ops);
CREATE INDEX idx_users_surname_search
  ON users USING gin (surname_search gin_trgm_ops);
CREATE INDEX idx_users_email_search
  ON users USING gin (email_search gin_trgm_ops);
```

### 2. Aktualizujte Prisma schému

```prisma
model User {
  // ... existujúce fieldy

  // Generated search columns
  name_search    String? @map("name_search")
  surname_search String? @map("surname_search")
  email_search   String? @map("email_search")

  // ... zvyšok modelu
}
```

### 3. Vygenerujte Prisma Client

```bash
npx prisma generate
```

### 4. Aktualizujte API endpoint

```typescript
// Search filter
if (search) {
  const normalizedSearch = search.toLowerCase()

  where.OR = [
    { name_search: { contains: normalizedSearch, mode: 'insensitive' } },
    { surname_search: { contains: normalizedSearch, mode: 'insensitive' } },
    { email_search: { contains: normalizedSearch, mode: 'insensitive' } },
  ]
}
```

## Súčasný stav

### ✅ Implementované (Proof of Concept)
- **Institutions** (`/app/api/superadmin/institutions/route.ts`)
  - Generated search columns
  - Trigram indexy
  - Čistý Prisma ORM kód

### ⏸️ Zatiaľ neimplementované (používajú `mode: 'insensitive'`)
- **Users** (`/app/api/admin/users/route.ts`)
- **VK** (`/app/api/admin/vk/route.ts`)
- **Applicants** (`/app/api/admin/applicants/route.ts`)

## Poznámky

1. **Automatická aktualizácia**: Search columns sa aktualizujú automaticky pri každom INSERT/UPDATE
2. **Performance**: Trigram indexy zabezpečujú rýchle vyhľadávanie aj pri veľkých datasetoch
3. **Type Safety**: Zachovaná plná type safety z Prisma ORM
4. **Maintenance**: Žiadne raw SQL queries v aplikačnom kóde

## Referencie

- [PostgreSQL unaccent extension](https://www.postgresql.org/docs/current/unaccent.html)
- [PostgreSQL pg_trgm extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Prisma case-sensitivity docs](https://www.prisma.io/docs/orm/prisma-client/queries/case-sensitivity)
