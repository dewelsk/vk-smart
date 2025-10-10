# Claude Code - Pravidlá a požiadavky

Tento súbor obsahuje dôležité pravidlá a požiadavky pre prácu s Claude Code na projekte.

## ⚠️ KRITICKÁ POŽIADAVKA: SSH Tunnel pre databázu

**Pred spustením akejkoľvek práce s databázou musí bežať SSH tunnel!**

### Kontrola či beží tunnel

```bash
lsof -i :5601
```

Ak nevidíš žiadny výstup, tunnel NEBEŽÍ.

### Spustenie SSH tunnel

```bash
./scripts/db-tunnel.sh
```

Alebo manuálne:

```bash
ssh -i ~/.ssh/monitra_do -L 5601:localhost:5433 -N root@165.22.95.150
```

### Dôležité

- **Port 5601** - lokálny port pre pripojenie (tento port používa .env DATABASE_URL)
- **Port 5433** - remote port PostgreSQL Docker kontajnera
- **Server:** 165.22.95.150
- Tunnel musí bežať po celý čas práce s databázou
- Ak Prisma/psql hlási "Can't reach database", najprv skontroluj či beží tunnel

---

## ⚠️ KRITICKÁ POŽIADAVKA: Prisma Generate po zmenách schémy

**Po každej zmene Prisma schémy MUSÍŠ regenerovať Prisma client a reštartovať server!**

### Kedy regenerovať Prisma client?

Po akejkoľvek zmene v `prisma/schema.prisma`:
- Pridanie/odobranie modelov
- Pridanie/odobranie polí
- Zmena relácií medzi modelmi
- Zmena enum hodnôt
- Migrácie databázy

### Postup po zmene schémy

```bash
# 1. Regeneruj Prisma client
npx prisma generate

# 2. Reštartuj dev server
# Ctrl+C alebo kill process, potom:
npm run dev
```

### Príznaky že Prisma client nie je aktuálny

- `PrismaClientValidationError: Invalid prisma.*.findFirst() invocation`
- Chyby typu "Unknown field" alebo "Unknown relation"
- Auth zlyháva s validation errormi
- E2E testy zlyhávajú na login
- Server logy obsahujú `prisma:error`

### ❌ BEZ regenerácie

```
prisma:error Invalid `prisma.user.findFirst()` invocation
Authorization error: PrismaClientValidationError
```

### ✅ PO regenerácii

```
✔ Generated Prisma Client (v5.22.0)
Server funguje normálne, testy prechádzajú
```

**DÔLEŽITÉ:** Vždy po zmene schema.prisma spusti `npx prisma generate` pred testovaním!

---

## ⚠️ POVINNÉ: Testovanie po dokončení úlohy

**Po dokončení každej úlohy MUSÍŠ spustiť základné testy aby si overil, že si nič nerozbit.**

### Minimálne požadované testy

Po každej zmene v kóde (feature, bugfix, refactoring) spusti:

**Dashboard test** (zahŕňa prihlásenie + základnú funkcionalitu):
```bash
npm run test:e2e -- tests/e2e/admin/dashboard.spec.ts
```

Tento test overuje:
- ✅ Prihlásenie (login)
- ✅ Zobrazenie dashboardu
- ✅ Navigáciu medzi stránkami
- ✅ Základné komponenty (karty, tlačidlá)

### Prečo je to dôležité?

- ✅ Overíš že základná funkcionalita funguje
- ✅ Odhalíš regression bugs pred commitom
- ✅ Rýchla spätná väzba (testy trvajú ~30 sekúnd)
- ❌ Bez testovania môžeš rozbiť kritickú funkcionalitu (napr. autentifikáciu)

### Kedy preskočiť testy?

**NIKDY.** Aj keď si zmenil len jeden riadok, spusti základné testy.

Výnimka: Zmeny v dokumentácii (*.md súbory) alebo konfiguračných súboroch ktoré neovplyvňujú runtime kód.

---

## E2E Testovanie

### ⚠️ KRITICKÁ POŽIADAVKA: VŽDY sa najprv pozri na existujúce testy!

**Pri písaní nových E2E testov NIKDY nevymýšľaj nové patterny!**

**Postup:**
1. **Najprv sa pozri** na existujúce testy v `tests/e2e/admin/`
2. **Skopíruj pattern** pre prihlásenie, setup, cleanup
3. **Použi rovnaké helper funkcie** ako existujúce testy
4. **Dodržuj rovnakú štruktúru** (beforeAll, afterAll, beforeEach)

**Príklady na inšpiráciu:**
- `tests/e2e/admin/test-detail.spec.ts` - kompletný pattern s DB setup/cleanup
- `tests/e2e/admin/tests-list.spec.ts` - pattern pre list/filter/search testy
- `tests/helpers/auth.ts` - helper funkcie pre prihlásenie

**❌ NESPRÁVNE:**
```typescript
// NESPRÁVNE: Vlastný login pattern
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5600/admin/login')
  await page.getByTestId('username-input').fill('admin')
  // ...
})
```

**✅ SPRÁVNE:**
```typescript
// SPRÁVNE: Použiť existujúci helper
import { loginAsAdmin } from '../../helpers/auth'

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})
```

**Prečo je to dôležité?**
- ✅ Konzistentné testy naprieč celým projektom
- ✅ Menej chýb (overené patterny)
- ✅ Jednoduchšie maintenance
- ✅ Rýchlejšie písanie testov (copy-paste)
- ❌ Vlastné patterny vedú k chybám a nekonzistencii

---

### ⚠️ KRITICKÁ POŽIADAVKA: Používanie data-testid namiesto textov

E2E testy **NESMÚ** byť závislé od textového obsahu elementov.

#### Pravidlo 90/10

**90% testov** musí byť postavených na:
- ✅ `data-testid` atribútoch
- ✅ Špecifických CSS triedach
- ✅ Unikátnych ID elementov

**10% testov** môže používať text-based selectors, ale len v špecifických prípadoch:
- Overenie že určitý text je zobrazený používateľovi
- Validácia error správ
- Dynamický obsah, ktorý sa nedá inak overiť

#### ❌ ZLE - Text-based selectors

```typescript
// ZLE: Test zlyhá pri zmene textu
await expect(page.locator('h1:has-text("Uchádzači")')).toBeVisible()
await page.click('button:has-text("Pridať uchádzača")')
await page.locator('text=Základné informácie').click()
```

#### ✅ SPRÁVNE - data-testid selectors

```typescript
// SPRÁVNE: Test je nezávislý od textu
await expect(page.getByTestId('page-title')).toBeVisible()
await page.getByTestId('add-applicant-button').click()
await page.getByTestId('overview-tab').click()
```

#### Implementácia v kóde

**Každý komponent musí obsahovať data-testid atribúty:**

```tsx
export default function ApplicantsPage() {
  return (
    <div data-testid="applicants-page">
      <h1 data-testid="page-title">Uchádzači</h1>

      <input
        data-testid="search-input"
        placeholder="Hľadať..."
      />

      <Link
        href="/applicants/new"
        data-testid="add-applicant-button"
      >
        Pridať uchádzača
      </Link>

      <div data-testid="applicants-table">
        <DataTable columns={columns} data={applicants} />
      </div>
    </div>
  )
}
```

#### Pomenovanie data-testid

**Konvencia:**
- `kebab-case` (malé písmená s pomlčkami)
- Opisné názvy (nie generické ako `button-1`)
- Konzistentné prefixový pre podobné elementy

**Príklady:**

```tsx
// Stránky
data-testid="applicants-page"
data-testid="vk-detail-page"

// Navigácia a tlačidlá
data-testid="add-applicant-button"
data-testid="back-button"
data-testid="save-button"

// Tabuľky a obsahy
data-testid="applicants-table"
data-testid="search-input"
data-testid="status-filter"

// Dynamické elementy (s ID)
data-testid={`applicant-name-${user.id}`}
data-testid={`status-badge-${user.id}`}
```

#### Kontrolný zoznam pre vývojárov

Pri implementácii novej obrazovky:

- [ ] Každá stránka má `data-testid="[názov]-page"`
- [ ] Každý hlavný nadpis má `data-testid="page-title"`
- [ ] Každý formulárový input má `data-testid="[názov]-input"`
- [ ] Každé tlačidlo má `data-testid="[akcia]-button"`
- [ ] Každá tabuľka má `data-testid="[názov]-table"`
- [ ] Každý tab má `data-testid="[názov]-tab"`
- [ ] Každý dynamický element má `data-testid` s ID entityy
- [ ] Test používa `getByTestId()` namiesto `locator('text=...')`

### Prečo je to dôležité?

- 📝 Texty sa môžu meniť (preklad, úpravy formulácií)
- 🌐 Aplikácia môže podporovať viac jazykov
- 🔄 Texty sa môžu dynamicky meniť podľa stavu
- 💥 Zmena textu by rozbila všetky testy
- ✅ Test IDs sú stabilné a nezávislé od obsahu

### ⚠️ KRITICKÁ POŽIADAVKA: Analýza E2E testov - NIKDY sa nevzdávaj pri prvom zlyhnutí!

**E2E testy sú práve na to, aby odhalili problémy. Nikdy nehovor "test zlyhal kvôli XYZ" bez dôkladnej analýzy!**

#### Postup pri zlyhalom E2E teste:

1. **VŽDY si POZRI SCREENSHOT** z testu
   - Screenshot je v `test-results/[test-name]/test-failed-1.png`
   - Ukaž mi ho pomocou Read tool
   - Analyzuj ČO PRESNE vidí používateľ na obrazovke

2. **ANALYZUJ PRESNÝ ERROR** z Playwright output
   - Prečítaj celú error message (nie len prvý riadok!)
   - Zisti KTORÝ element sa nenašiel
   - Zisti AKÚ hodnotu test očakával vs. čo dostal

3. **SKONTROLUJ SERVER LOGY**
   - Použi `BashOutput` tool na prečítanie dev server logov
   - Hľadaj HTTP requests na danú URL
   - Hľadaj errory v renderovaní stránky
   - Hľadaj API errory

4. **ZISTI ROOT CAUSE**
   - Nie je to "problém s databázou" kým to nedokážeš
   - Nie je to "timeout" kým neanalyzuješ prečo timeout nastal
   - Nie je to "missing element" kým nezistíš prečo element chýba

5. **OPRAV PROBLÉM A TESTUJ ZNOVA**
   - Až keď problém opravíš, spusti test znova
   - Ak test stále zlyháva, OPAKUJ kroky 1-4

#### ❌ ZLE - Predčasná diagnóza

```
Test zlyhal kvôli timeout.
```

```
Element sa nenašiel, pravdepodobne problém s databázou.
```

```
E2E testy zlyhali, kód je správny, je to infraštruktúrny problém.
```

#### ✅ SPRÁVNE - Dôkladná analýza

```
1. Pozrel som sa na screenshot - zobrazuje sa "Nastala chyba" error page
2. V server logoch vidím Prisma error "idle timeout"
3. Ale počkaj - test na /institutions [id] vôbec nebol requestnutý podľa logov
4. Pozrel som beforeAll() - zlyhalo získanie testInstitutionId
5. Prečo zlyhalo? Lebo /institutions page vrátil prázdnu tabuľku
6. Prečo prázdna tabuľka? Skontroloval som DB - je tam 6 inštitúcií
7. Skontroloval som frontend filter - defaultne filtruje len aktívne
8. Skontroloval som DB znova - všetky inštitúcie SÚ aktívne
9. Takže problém NIE je v dátach ani filtroch
10. Musím pristúpiť na /institutions page priamo a pozrieť sa čo sa deje...
```

#### Nástroje na diagnostiku

```bash
# 1. Spusti test s detailným outputom
npm run test:e2e -- tests/e2e/admin/test.spec.ts --reporter=list

# 2. Pozri sa na screenshot
Read test-results/[test-name]/test-failed-1.png

# 3. Skontroluj server logy
BashOutput bash_id

# 4. Testuj priamo v browseri/curl
curl http://localhost:5600/path

# 5. Skontroluj databázu
psql "postgresql://..." -c "SELECT * FROM table LIMIT 5;"
```

#### Prečo je to KRITICKY dôležité?

- ✅ E2E testy odhaľujú **SKUTOČNÉ** problémy v kóde
- ✅ Screenshot ukazuje **ČO VIDÍ POUŽÍVATEĽ** - najlepší zdroj pravdy
- ✅ Predčasná diagnóza vedie k **FALOŠNÝM ZÁVEROM**
- ✅ Dôkladná analýza odhalí **ROOT CAUSE** problému
- ❌ "Test zlyhal kvôli DB" môže byť **ÚPLNE INÁ** príčina
- ❌ Bez analýzy screenshotu **NEVIEŠ ČO SA STALO**
- ❌ Bez server logov **NEVIEŠ AKO SERVER ZAREAGOVAL**

**NIKDY sa nevzdávaj pri prvom zlyhnutí! E2E test je tvoj najlepší priateľ - ukazuje ti ČO NAOZAJ NEFUNGUJE.**

---

## Ikony a Emoji

### ⚠️ KRITICKÁ POŽIADAVKA: Používanie Heroicons namiesto emoji

**NIKDY nepoužívať emoji ikony v UI! Vždy používaj Heroicons z `@heroicons/react`.**

📖 **Kompletný návod:** [docs/patterns/icons.md](docs/patterns/icons.md)

**Základné pravidlá:**
- Emoji v návrhoch (`obrazovky/*.md`) sú LEN ilustračné
- V kóde VŽDY použiť Heroicons: `import { IconName } from '@heroicons/react/24/outline'`
- Dokumentácia: https://heroicons.com/

---

## Modálne okná a potvrdenia

### ⚠️ KRITICKÁ POŽIADAVKA: NIKDY nepoužívať JavaScript alert/confirm/prompt

**Zásadne NEPOUŽÍVAŤ natívne JavaScript dialógy:**
- ❌ `alert()`
- ❌ `confirm()`
- ❌ `prompt()`
- ❌ `window.alert()`
- ❌ `window.confirm()`
- ❌ `window.prompt()`

#### ❌ ZLE - JavaScript confirm

```typescript
// ZLE: Natívny JavaScript dialog
const handleDelete = () => {
  if (confirm('Naozaj chcete vymazať?')) {
    deleteItem()
  }
}

// ZLE: window.confirm
if (window.confirm('Naozaj chcete pokračovať?')) {
  proceed()
}
```

#### ✅ SPRÁVNE - ConfirmModal komponent

```typescript
import { ConfirmModal } from '@/components/ConfirmModal'

const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

// Pri kliknutí na delete button
const handleDeleteClick = () => setShowDeleteConfirm(true)

// JSX
<ConfirmModal
  isOpen={showDeleteConfirm}
  title="Vymazať položku"
  message="Naozaj chcete vymazať?"
  variant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

📖 **Plná implementácia:**
- Komponent: [components/ConfirmModal.tsx](../components/ConfirmModal.tsx)
- Príklad použitia: [app/(admin-protected)/tests/[id]/page.tsx:222-239](../app/(admin-protected)/tests/[id]/page.tsx) (delete handler s ConfirmModal)

#### Prečo?

- ✅ Konzistentný dizajn v celej aplikácii
- ✅ Lepšia používateľská skúsenosť (UX)
- ✅ Profesionálny vzhľad
- ✅ Prispôsobiteľný dizajn (farby, ikony, texty)
- ✅ Podporuje accessibility
- ✅ Jednoduchšie testovanie v E2E testoch
- ❌ Natívne dialógy blokujú thread a vyzerajú staromódne
- ❌ Natívne dialógy sa nedajú prispôsobiť dizajnu aplikácie

---

## Formuláre a validácia

### ⚠️ KRITICKÁ POŽIADAVKA: Konzistentná validácia a UX formulárov

**Všetky formuláre v aplikácii musia dodržiavať jednotný pattern.**

#### Požiadavky na každý formulár

1. **Inline validačné chyby** pod každým input fieldom
2. **Auto-scroll na prvý chybný input** pri validačnej chybe
3. **Konzistentné toast správy** pri úspešnom/neúspešnom odoslaní
4. **Vizuálne označenie chybných inputov** (červený border)
5. **Znovupoužiteľné komponenty** namiesto copy-paste kódu

#### ❌ ZLE - Bez inline validácie

```typescript
// ZLE: Len toast notifikácia, užívateľ nevidí kde je chyba
const handleSubmit = () => {
  if (!name.trim()) {
    toast.error('Názov je povinný')
    return
  }
  // ...
}

// ZLE: Input bez vizuálneho označenia chyby
<input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="border border-gray-300 rounded-md"
/>
```

#### ✅ SPRÁVNE - S inline validáciou a error stavom

```typescript
const [name, setName] = useState('')
const [errors, setErrors] = useState<{ name?: string }>({})
const nameInputRef = useRef<HTMLInputElement>(null)

// V JSX
<input
  ref={nameInputRef}
  data-testid="name-input"
  value={name}
  onChange={(e) => {
    setName(e.target.value)
    if (errors.name) setErrors({ ...errors, name: undefined })
  }}
  className={errors.name ? 'border-red-500' : 'border-gray-300'}
/>
{errors.name && (
  <p className="mt-2 text-sm text-red-600" data-testid="name-error">
    {errors.name}
  </p>
)}
```

📖 **Plné príklady:** [docs/patterns/form-validation.md](../docs/patterns/form-validation.md)

#### Toast notifikácie - Konzistentné používanie

**Používame `react-hot-toast` s konzistentným API:**

```typescript
import { toast } from 'react-hot-toast'

// Loading state (nezabudnúť dismiss!)
toast.loading('Ukladám...')

// Po úspešnom dokončení
toast.dismiss() // Zruš loading
toast.success('Úspešne uložené')

// Pri chybe
toast.dismiss() // Zruš loading
toast.error('Chyba pri ukladaní')

// Warning
toast.warning('Niektoré polia neboli vyplnené')
```

**DÔLEŽITÉ:**
- Vždy volaj `toast.dismiss()` pred zobrazením úspešnej/chybovej správy
- Toast správy majú byť krátke a výstižné
- Nepoužívaj `alert()`, `confirm()` - len toast a modály

#### Pattern pre komplexné formuláre

Pozri [docs/patterns/form-validation.md](../docs/patterns/form-validation.md) pre kompletný príklad s:
- Validáciou viacerých polí
- Auto-scroll na prvý error
- Toast notifikáciami
- Submit handling
- React-select integráciou

#### Kontrolný zoznam pre formuláre

Pri vytváraní nového formulára:

- [ ] Každý input má `ref` pre auto-scroll
- [ ] Každý input má `data-testid="[názov]-input"`
- [ ] **Každá error správa má `data-testid="[názov]-error"`**
- [ ] Errors state definovaný: `useState<Record<string, string>>({})`
- [ ] Validačná funkcia vracia `boolean`
- [ ] Pri chybe sa scroll na prvý nevalidný input
- [ ] Červený border pri chybe: `border-red-500 focus:ring-red-200` (rovnaká hrúbka ako normálny border)
- [ ] Error správa pod inputom: `<p className="mt-2 text-sm text-red-600" data-testid="[názov]-error">`
- [ ] Clear error pri zmene hodnoty inputu: `onChange` volá `setErrors(...)`
- [ ] `toast.loading()` pri odoslaní
- [ ] `toast.dismiss()` pred `toast.success()` alebo `toast.error()`
- [ ] Submit button má `disabled={saving}` state
- [ ] Form má `onSubmit={(e) => { e.preventDefault(); handleSubmit() }}`
- [ ] **Po dokončení formulára VYTVORIŤ E2E testy (pozri nižšie)**

#### Prečo je to dôležité?

- ✅ Konzistentná UX naprieč celou aplikáciou
- ✅ Používateľ vždy vie, kde je chyba
- ✅ Automatický scroll šetrí čas používateľa
- ✅ Profesionálny vzhľad
- ✅ Jednoduchšie testovanie (predvídateľné správanie)
- ✅ Menej frustrujúce pre používateľa
- ❌ Rôzne patterny na každej stránke vytvárajú chaos

---

## E2E Testy pre formuláre

### ⚠️ POVINNÉ: Vytvoriť E2E testy po dokončení formulára

**Po vytvorení každého formulára MUSÍŠ vytvoriť E2E testy.**

📖 **Kompletný návod:** [docs/patterns/e2e-form-tests.md](docs/patterns/e2e-form-tests.md)

**Minimálne požadované testy:**
1. Otvorenie modalu/formulára
2. Validácia každého povinného poľa
3. **Úspešné vytvorenie LEN s povinnými poľami** (nepovinné prázdne!)
4. **Úspešné vytvorenie so VŠETKÝMI poľami**
5. Zatvorenie modalu (cancel)
6. Duplikát (ak relevantné)

**React-select:** Vždy používaj `inputId` prop pre stabilné ID v testoch.

**Príklady:** [tests/e2e/admin/test-categories.spec.ts](tests/e2e/admin/test-categories.spec.ts), [test-import.spec.ts](tests/e2e/admin/test-import.spec.ts)

---

## Backend API Testy

### ⚠️ POVINNÉ: Vytvoriť backend testy po dokončení API route

**Po vytvorení každého API route MUSÍŠ vytvoriť backend testy.**

📖 **Kompletný návod:** [docs/patterns/backend-testing.md](docs/patterns/backend-testing.md)

**Minimálne požadované testy pre CRUD API:**
1. **GET (list)** - search, filter, sort, pagination, count, relations
2. **POST (create)** - all fields, without optional, duplicate error, invalid FK
3. **PATCH (update)** - each field, set null, duplicate error, updatedAt
4. **DELETE** - success, related records behavior
5. **GET (single)** - by ID, non-existent ID, relations
6. **Relationships** - link, query by relation

**Dôležité pravidlá:**
- Používaj `Date.now()` pre unikátne názvy
- Vždy cleanup v `afterEach`/`afterAll`
- Test aj success aj failure cases

**Spustenie:** `npm run test:backend`

**Príklady:** [tests/backend/test-categories-api.test.ts](tests/backend/test-categories-api.test.ts), [tests-api.test.ts](tests/backend/tests-api.test.ts)

---

## Dizajn a UI komponenty

### ⚠️ KRITICKÁ POŽIADAVKA: Konzistentný dizajn tlačidiel

**Všetky tlačidlá v aplikácii musia mať jednotný vizuálny štýl.**

📖 **Kompletný návod:** [docs/patterns/ui-components.md](docs/patterns/ui-components.md)

**Základné pravidlá:**
- Vždy `text-sm font-medium px-4 py-2 rounded-md`
- **Primary:** `bg-blue-600 text-white hover:bg-blue-700`
- **Secondary:** `border border-gray-300 text-gray-700 bg-white hover:bg-gray-50`
- **Destructive:** `bg-red-600 text-white hover:bg-red-700`
- Ikony (voliteľné): `h-4 w-4` s `inline-flex items-center gap-2`

**Príklady:** Pozri existujúce komponenty v `components/PageHeader.tsx`, `components/ConfirmModal.tsx`

---

## Slovenské skloňovanie

### ⚠️ KRITICKÁ POŽIADAVKA: Správne skloňovanie slovenských slov

**Slovenské slová sa skloňujú podľa počtu. NIKDY nepoužívaj fixný text pre všetky čísla!**

#### Pravidlá skloňovania pre "otázka"

V slovenčine máme tri formy:
- **1 = otázka** (jednotné číslo - singulár)
- **2-4 = otázky** (nižší plurál - paukál)
- **5+ = otázok** (genitív plurálu)

**Príklady:**
- 1 otázka
- 2 otázky
- 3 otázky
- 4 otázky
- 5 otázok
- 10 otázok
- 100 otázok

#### Implementácia v kóde

**Helper funkcia:**

```typescript
function getQuestionWord(count: number) {
  if (count === 1) return 'otázka'
  if (count >= 2 && count <= 4) return 'otázky'
  return 'otázok'
}
```

#### ❌ ZLE - Fixný text

```tsx
// ZLE: Vždy "otázok" bez ohľadu na počet
<p>{questionCount} otázok</p>

// ZLE: Zobrazí "2 otázok" namiesto "2 otázky"
toast.success(`Rozpoznaných ${count} otázok`)
```

#### ✅ SPRÁVNE - Dynamické skloňovanie

```tsx
// SPRÁVNE: Správna forma podľa počtu
<p>{questionCount} {getQuestionWord(questionCount)}</p>

// SPRÁVNE: "1 otázka", "2 otázky", "5 otázok"
toast.success(`Rozpoznaných ${count} ${getQuestionWord(count)}`)
```

#### Kde aplikovať

Toto pravidlo platí **všade kde zobrazuješ počet otázok**:
- ✅ Tabuľky a zoznamy
- ✅ Toast notifikácie
- ✅ Modálne okná
- ✅ Karty a dashboardy
- ✅ Formuláre a inputy

#### Príklady súborov kde je to implementované

- `/app/(admin-protected)/tests/page.tsx` - DataTable cell s počtom otázok
- `/app/(admin-protected)/tests/practice/page.tsx` - Zobrazenie počtu otázok v karte testu
- `/app/(admin-protected)/tests/practice/[sessionId]/page.tsx` - Hlavička testu + modál
- `/app/(admin-protected)/tests/import/page.tsx` - Toast správy + zobrazenie počtu

#### Prečo je to dôležité?

- ✅ **Profesionálny dojem** - aplikácia v správnej slovenčine
- ✅ **Používateľská skúsenosť** - prirodzený jazyk
- ✅ **Kvalita** - detaily robia rozdiel
- ❌ "2 otázok" je **gramaticky nesprávne** a neprofesionálne
- ❌ Zlé skloňovanie pôsobí amatérsky

#### Ďalšie slová na skloňovanie

Rovnaké pravidlo platí pre ďalšie slová s podobným skloňovaním:
- **test:** 1 test, 2-4 testy, 5+ testov
- **pokus:** 1 pokus, 2-4 pokusy, 5+ pokusov
- **bod:** 1 bod, 2-4 body, 5+ bodov
- **minúta:** 1 minúta, 2-4 minúty, 5+ minút

**Vytvoriť helper funkciu pre každý typ slova:**

```typescript
function getTestWord(count: number) {
  if (count === 1) return 'test'
  if (count >= 2 && count <= 4) return 'testy'
  return 'testov'
}

function getAttemptWord(count: number) {
  if (count === 1) return 'pokus'
  if (count >= 2 && count <= 4) return 'pokusy'
  return 'pokusov'
}

function getPointWord(count: number) {
  if (count === 1) return 'bod'
  if (count >= 2 && count <= 4) return 'body'
  return 'bodov'
}

function getMinuteWord(count: number) {
  if (count === 1) return 'minúta'
  if (count >= 2 && count <= 4) return 'minúty'
  return 'minút'
}
```

---

## Viac informácií

Viac informácií o testovaní nájdeš v `docs/13-testovanie.md`.
