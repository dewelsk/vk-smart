# TASK: Hierarchia povolených typov otázok

## Prehľad

Implementácia 3-úrovňovej hierarchie pre povolené typy otázok:

```
Rezort (Institution)
  ↓ allowedQuestionTypes: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", ...]
Test
  ↓ allowedQuestionTypes: ["SINGLE_CHOICE"] (subset rezortu)
Otázka (Question)
  ↓ type: "SINGLE_CHOICE" (musí byť povolený v teste)
```

## Typy otázok

- **SINGLE_CHOICE** → "Jednovýberová"
- **MULTIPLE_CHOICE** → "Viacvýberová"
- **TRUE_FALSE** → "Pravda/Nepravda"
- **OPEN_ENDED** → "Otvorená"

## Permissions

- **SUPERADMIN**: Môže upravovať všetky rezorty
- **ADMIN**: Môže upravovať len svoje rezorty
- **Default pre nový rezort**: `["SINGLE_CHOICE"]`

## Logika

1. **Rezort level**: Nastaví povolené typy pre celý rezort
2. **Test level**: Môže ďalej obmedziť typy (podmnožina rezortu)
3. **Otázka level**: Musí používať typ povolený v teste
4. **Pri zakázaní typu**: Test zostane, ale zobrazí sa upozornenie (⚠️)

## Progress Tracker

- [ ] **Fáza 1: Rezorty - Povolené typy** (0/16)
- [ ] **Fáza 2: Testy - Detail a Tab Prehľad** (0/12)
- [ ] **Fáza 3: Testy - Tab Otázky** (0/15)
- [ ] **Fáza 4: Zoznam testov - Zobrazenie typov** (0/6)

---

## FÁZA 1: Rezorty - Povolené typy otázok ⏳

### Backend

- [ ] **1.1 Prisma Schema**
  - Pridať `allowedQuestionTypes Json? @default("[\"SINGLE_CHOICE\"]")` do Institution
  - Spustiť `npx prisma migrate dev`

- [ ] **1.2 API Routes**
  - GET `/api/admin/institutions/[id]` - Načítať detail rezortu
  - PUT `/api/admin/institutions/[id]` - Aktualizovať rezort (vrátane allowedQuestionTypes)

- [ ] **1.3 Backend Testy** (`tests/api/admin/institutions.test.ts`)
  - GET vracia allowedQuestionTypes správne
  - PUT aktualizuje typy otázok
  - Permissions: SUPERADMIN môže upraviť ľubovoľný rezort
  - Permissions: ADMIN môže upraviť len svoj rezort
  - Permissions: ADMIN nemôže upraviť cudzí rezort (403)
  - Default hodnota pre nový rezort je `["SINGLE_CHOICE"]`

### Frontend

- [ ] **1.4 React Hooks** (`hooks/useInstitution.ts`)
  - `useInstitution(id)` - Načítať detail rezortu
  - `useUpdateInstitution()` - Aktualizovať rezort

- [ ] **1.5 Detail Stránka** (`app/(admin-protected)/institutions/[id]/page.tsx`)
  - Zobrazenie základných informácií rezortu
  - Formulár na úpravu (názov, kód, popis, aktívny)
  - Multi-select pre povolené typy otázok s checkboxami
  - Inline validácia podľa CLAUDE.md
  - Red borders pri chybe (border-red-500)
  - data-testid na všetkých elementoch
  - Toast notifikácie (loading → dismiss → success/error)
  - Permissions: SUPERADMIN vidí všetky rezorty, ADMIN len svoje

- [ ] **1.6 Zoznam Rezortov** (`app/(admin-protected)/institutions/page.tsx`)
  - Pridať stĺpec "Povolené typy"
  - Zobrazenie badge-ov pre typy alebo "[X typov ⓘ]" s tooltipom
  - Link na detail stránku

### E2E Testy

- [ ] **1.7 E2E Test Suite** (`tests/e2e/admin/institutions.spec.ts`)
  - SUPERADMIN môže upraviť typy otázok ľubovoľného rezortu
  - ADMIN môže upraviť typy otázok svojho rezortu
  - ADMIN nemôže upraviť typy otázok cudzieho rezortu (nedostupná stránka)
  - Validácia: Aspoň jeden typ musí byť vybraný
  - Vizuálna kontrola: Zobrazenie typu otázok v zozname rezortov

### Testing & Deployment

- [ ] **1.8 Spustiť všetky testy**
  - Backend testy: `npm run test:backend`
  - E2E testy: `npm run test:e2e`
  - Overiť, že všetky testy prechádzajú

- [ ] **1.9 Commit**
  - `feat: Pridanie nastavenia povolených typov otázok pre rezorty`
  - Oznámiť používateľovi na kontrolu

---

## FÁZA 2: Testy - Detail stránka a Tab Prehľad

### Backend

- [ ] **2.1 API Routes**
  - GET `/api/admin/tests/[id]` - Načítať detail testu (vrátane allowedQuestionTypes)
  - PUT `/api/admin/tests/[id]` - Aktualizovať test (základné info + allowedQuestionTypes)

- [ ] **2.2 Backend Testy**
  - GET vracia allowedQuestionTypes
  - PUT aktualizuje allowedQuestionTypes (musí byť subset rezortu)
  - Validácia: Test nemôže mať typ, ktorý nie je povolený v rezorte
  - Permissions: SUPERADMIN/ADMIN môžu upravovať testy

### Frontend

- [ ] **2.3 React Hooks** (`hooks/useTests.ts`)
  - `useTest(id)` - Načítať detail testu
  - `useUpdateTest()` - Aktualizovať test

- [ ] **2.4 Detail Stránka** (`app/(admin-protected)/tests/[id]/page.tsx`)
  - Layout s 5 tabmi: Prehľad, Otázky, Štatistiky, VK, História
  - **Tab Prehľad**: Základné info, allowedQuestionTypes (multi-select s checkboxami)
  - Inline validácia podľa CLAUDE.md
  - data-testid na všetkých elementoch
  - Toast notifikácie

### E2E Testy

- [ ] **2.5 E2E Test Suite** (`tests/e2e/admin/tests-detail.spec.ts`)
  - Zobrazenie detail stránky s tabmi
  - Tab Prehľad: Editácia základných informácií
  - Validácia: Test nemôže mať typ, ktorý nie je povolený v rezorte testu

### Testing

- [ ] **2.6 Spustiť všetky testy**
  - Backend + E2E testy
  - Commit: `feat: Detail stránka testov s Tab Prehľad`

---

## FÁZA 3: Testy - Tab Otázky (4 typy otázok)

### Backend

- [ ] **3.1 API Routes**
  - POST `/api/admin/tests/[id]/questions` - Pridať otázku
  - PUT `/api/admin/tests/[id]/questions/[questionId]` - Upraviť otázku
  - DELETE `/api/admin/tests/[id]/questions/[questionId]` - Zmazať otázku

- [ ] **3.2 Validácia**
  - Otázka musí mať typ povolený v teste
  - Špecifická validácia pre každý typ:
    - SINGLE_CHOICE: Aspoň 2 možnosti, presne 1 správna
    - MULTIPLE_CHOICE: Aspoň 2 možnosti, aspoň 1 správna
    - TRUE_FALSE: correctAnswer boolean
    - OPEN_ENDED: Nepovinné sampleAnswer a keywords

- [ ] **3.3 Backend Testy**
  - Vytvorenie otázky pre každý typ
  - Validácia: Otázka nemôže mať typ, ktorý nie je povolený v teste
  - CRUD operácie pre otázky

### Frontend

- [ ] **3.4 Tab Otázky** (`app/(admin-protected)/tests/[id]/page.tsx`)
  - Zoznam otázok s drag & drop pre zmenu poradia
  - Formulár na pridanie/úpravu otázky
  - 4 špecializované formuláre podľa typu:
    - SINGLE_CHOICE: Radio buttons, možnosti, správna odpoveď
    - MULTIPLE_CHOICE: Checkboxes, možnosti, správne odpovede, scoring type
    - TRUE_FALSE: Radio buttons (Pravda/Nepravda)
    - OPEN_ENDED: Textarea, keywords
  - Inline validácia podľa CLAUDE.md
  - data-testid na všetkých elementoch
  - ConfirmModal pre zmazanie otázky
  - Toast notifikácie

- [ ] **3.5 Komponenty**
  - `QuestionForm.tsx` - Hlavný formulár s typom otázky
  - `SingleChoiceForm.tsx` - Jednovýberová otázka
  - `MultipleChoiceForm.tsx` - Viacvýberová otázka
  - `TrueFalseForm.tsx` - Pravda/Nepravda
  - `OpenEndedForm.tsx` - Otvorená otázka
  - `QuestionList.tsx` - Zoznam otázok s drag & drop

### E2E Testy

- [ ] **3.6 E2E Test Suite** (`tests/e2e/admin/tests-questions.spec.ts`)
  - Pridanie otázky typu SINGLE_CHOICE
  - Pridanie otázky typu MULTIPLE_CHOICE
  - Pridanie otázky typu TRUE_FALSE
  - Pridanie otázky typu OPEN_ENDED
  - Editácia otázky
  - Zmazanie otázky (ConfirmModal)
  - Zmena poradia otázok (drag & drop)
  - Validácia: Otázka nemôže mať typ, ktorý nie je povolený v teste

### Testing

- [ ] **3.7 Spustiť všetky testy**
  - Backend + E2E testy
  - Commit: `feat: Tab Otázky s podporou 4 typov otázok`

---

## FÁZA 4: Zoznam testov - Zobrazenie typov

### Frontend

- [ ] **4.1 Zoznam Testov** (`app/(admin-protected)/tests/page.tsx`)
  - Pridať stĺpec "Typy otázok"
  - Logika zobrazenia:
    - Ak test používa 1 typ: Zobraziť názov typu ("Jednovýberová")
    - Ak test používa viac typov: Zobraziť "[X typy ⓘ]" s tooltipom
  - Tooltip: Zoznam všetkých použitých typov

- [ ] **4.2 Utility funkcie**
  - `getQuestionTypeName(type)` - Preklad enum → názov
  - `getUsedQuestionTypes(test)` - Extrakcia použitých typov z otázok

### E2E Testy

- [ ] **4.3 E2E Test Suite** (`tests/e2e/admin/tests-list.spec.ts`)
  - Zobrazenie typu otázok v zozname
  - Tooltip pre viacero typov
  - Jednoduchý názov pre jeden typ

### Testing

- [ ] **4.4 Spustiť všetky testy**
  - E2E testy
  - Commit: `feat: Zobrazenie typov otázok v zozname testov`

---

## Finálne overenie

- [ ] Všetky fázy dokončené
- [ ] Všetky backend testy prechádzajú
- [ ] Všetky E2E testy prechádzajú
- [ ] Dokumentácia aktualizovaná
- [ ] Code review
- [ ] Merge do main

---

## Technické poznámky

### Prisma Schema

```prisma
model Institution {
  // Existing fields...
  allowedQuestionTypes Json? @default("[\"SINGLE_CHOICE\"]")
}

model Test {
  // Existing fields...
  allowedQuestionTypes Json? // Subset of institution's types
}
```

### Question JSON Structure

```typescript
type Question = {
  id: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED'
  order: number
  text: string
  points: number
  explanation?: string

  // SINGLE_CHOICE / MULTIPLE_CHOICE
  options?: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  scoringType?: 'all_or_nothing' | 'proportional' // MULTIPLE_CHOICE only

  // TRUE_FALSE
  correctAnswer?: boolean

  // OPEN_ENDED
  sampleAnswer?: string
  keywords?: string[]
}
```

### API Endpoints

```
GET    /api/admin/institutions/[id]           - Detail rezortu
PUT    /api/admin/institutions/[id]           - Upraviť rezort
GET    /api/admin/tests/[id]                  - Detail testu
PUT    /api/admin/tests/[id]                  - Upraviť test
POST   /api/admin/tests/[id]/questions        - Pridať otázku
PUT    /api/admin/tests/[id]/questions/[qId]  - Upraviť otázku
DELETE /api/admin/tests/[id]/questions/[qId]  - Zmazať otázku
```

### CLAUDE.md Checklist

Pre každý formulár:
- [ ] Inline errors pod každým input fieldom
- [ ] Červené bordery pri chybe (border-red-500, rovnaká hrúbka)
- [ ] data-testid pre všetky elementy
- [ ] Clear error pri zmene hodnoty
- [ ] Auto-scroll na prvý error
- [ ] Toast pattern: loading → dismiss → success/error
- [ ] ConfirmModal namiesto window.confirm()
- [ ] Heroicons namiesto emoji

Pre každý E2E test:
- [ ] Používať getByTestId(), nie locator('text=...')
- [ ] Pravidlo 90/10: 90% data-testid, 10% text
- [ ] Test s required fields only
- [ ] Test so všetkými fieldmi
