# Claude Code - Pravidlá a požiadavky

Tento súbor obsahuje dôležité pravidlá a požiadavky pre prácu s Claude Code na projekte.

## E2E Testovanie

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

**NIKDY nepoužívať emoji ikony (🔧, ✓, ⚠, ✕, 📄, atď.) v UI!**

#### Pravidlo

**Vždy používaj Heroicons** z `@heroicons/react`:

```typescript
import { IconName } from '@heroicons/react/24/outline'  // outline icons
import { IconName } from '@heroicons/react/24/solid'    // solid icons
```

#### Bežné mapovanie emoji → Heroicons

- 🔧 → `WrenchScrewdriverIcon`
- ✓, ✅ → `CheckIcon` alebo `CheckCircleIcon`
- ⚠️ → `ExclamationTriangleIcon`
- ✕, ❌ → `XMarkIcon`
- ℹ️ → `InformationCircleIcon`
- 👤 → `UserIcon`
- 📋 → `ClipboardDocumentListIcon`
- ➕ → `PlusIcon`
- 📄 → `DocumentIcon` alebo `DocumentTextIcon`
- 📤 → `DocumentArrowUpIcon`
- ⭐ → `StarIcon`
- ⭕ → `QuestionMarkCircleIcon`

#### Prečo?

- ✅ Konzistentný dizajn
- ✅ Lepšia prístupnosť (accessibility)
- ✅ Profesionálny vzhľad
- ✅ Prispôsobiteľné (veľkosť, farba)
- ❌ Emoji sa renderujú rôzne na rôznych platformách
- ❌ Emoji komplikujú testovanie
- ❌ Emoji vyzerajú neprofesionálne

#### Dokumentácia

https://heroicons.com/

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

function MyComponent() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id)
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    }
  }

  return (
    <>
      <button onClick={() => handleDeleteClick(item)}>
        Vymazať
      </button>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Vymazať položku"
        message={`Naozaj chcete vymazať položku "${itemToDelete?.name}"?`}
        confirmLabel="Vymazať"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
```

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
import { useRef } from 'react'

function MyForm() {
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ name?: string }>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const newErrors: { name?: string } = {}

    // Validácia
    if (!name.trim()) {
      newErrors.name = 'Názov je povinný'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)

      // Auto-scroll na prvý chybný input
      if (newErrors.name) {
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        nameInputRef.current?.focus()
      }

      return
    }

    // Clear errors
    setErrors({})

    // Submit logic...
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Názov *
      </label>
      <input
        ref={nameInputRef}
        data-testid="name-input"
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          // Clear error on change
          if (errors.name) {
            setErrors({ ...errors, name: undefined })
          }
        }}
        className={`
          w-full px-3 py-2 border rounded-md
          focus:outline-none focus:ring-1
          ${errors.name
            ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
          }
        `}
      />
      {errors.name && (
        <p className="mt-2 text-sm text-red-600">
          {errors.name}
        </p>
      )}
    </div>
  )
}
```

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

```typescript
function ComplexForm() {
  // State
  const [formData, setFormData] = useState({ name: '', email: '', category: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Refs pre auto-scroll
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)

  const refs = {
    name: nameRef,
    email: emailRef,
    category: categoryRef,
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Názov je povinný'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email je povinný'
    }
    if (!formData.category) {
      newErrors.category = 'Kategória je povinná'
    }

    setErrors(newErrors)

    // Scroll na prvý error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      refs[firstErrorField as keyof typeof refs]?.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      refs[firstErrorField as keyof typeof refs]?.current?.focus()
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    setSaving(true)
    toast.loading('Ukladám...')

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      toast.dismiss()

      if (!res.ok) {
        toast.error(data.error || 'Chyba pri ukladaní')
        return
      }

      toast.success('Úspešne uložené')
      router.push('/success-page')
    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      {/* Input fields with errors */}
      <FormField
        label="Názov"
        required
        error={errors.name}
        ref={nameRef}
      >
        <input
          data-testid="name-input"
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value })
            if (errors.name) setErrors({ ...errors, name: undefined })
          }}
          className={inputClassName(errors.name)}
        />
      </FormField>

      <button
        type="submit"
        disabled={saving}
        data-testid="submit-button"
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Ukladám...' : 'Uložiť'}
      </button>
    </form>
  )
}

// Helper pre className
const inputClassName = (error?: string) => `
  w-full px-3 py-2 border rounded-md
  focus:outline-none focus:ring-1
  ${error
    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
  }
`
```

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

#### Minimálne požadované testy

Pre každý formulár vytvor nasledujúce testy:

1. **Otvorenie modalu/formulára**
2. **Validácia povinných polí** - samostatný test pre každé povinné pole
3. **⚠️ Úspešné vytvorenie len s povinnými poľami** - vyplniť IBA povinné polia, nepovinné ostanú prázdne
4. **⚠️ Úspešné vytvorenie so všetkými poľami** - vyplniť všetky polia (povinné aj nepovinné)
5. **Zatvorenie modalu/formulára** (cancel)
6. **Duplikát** (ak relevantné) - pokus o vytvorenie záznamu s už existujúcim unique poľom

**Prečo sú testy 3 a 4 dôležité?**

Formuláre často zlyhajú keď nepovinné polia ostanú prázdne, pretože:
- Frontend môže posielať `null` namiesto `undefined`
- Backend validácia očakáva `optional()` ale dostane `null`
- Rôzne typy chýb medzi prázdnym stringom `""`, `null`, a `undefined`

**Príklad:**
- **Povinné polia:** name, typeId
- **Nepovinné polia:** description

**Test 3** - Len povinné:
```typescript
// Vyplní len name a typeId
// description OSTANE PRÁZDNE (nie je vyplnené)
```

**Test 4** - Všetky polia:
```typescript
// Vyplní name, typeId, aj description
```

#### Príklad E2E testov pre formulár

**Formulár s poľami:**
- **Povinné:** name, typeId
- **Nepovinné:** description

```typescript
test.describe('Create Category', () => {
  // Test 1: Validácia povinného poľa
  test('should validate required name field', async ({ page }) => {
    await page.click('button:has-text("Pridať kategóriu")')

    // Try to submit without name
    await page.click('button:has-text("Uložiť kategóriu")')

    // Should show inline error message
    await expect(page.getByTestId('category-name-error')).toBeVisible()
    await expect(page.getByTestId('category-name-error')).toHaveText('Názov kategórie je povinný')
  })

  // Test 2: Validácia ďalšieho povinného poľa
  test('should validate required type field', async ({ page }) => {
    await page.click('button:has-text("Pridať kategóriu")')

    // Fill name but not type
    await page.getByTestId('category-name-input').fill('Test Category')

    await page.click('button:has-text("Uložiť kategóriu")')

    // Should show inline error for type
    await expect(page.getByTestId('category-type-error')).toBeVisible()
    await expect(page.getByTestId('category-type-error')).toHaveText('Typ testu je povinný')
  })

  // ⚠️ Test 3: Len POVINNÉ polia (description OSTANE PRÁZDNE)
  test('should create category with required fields only', async ({ page }) => {
    const categoryName = `E2E Required Only ${Date.now()}`

    await page.click('button:has-text("Pridať kategóriu")')

    // Fill ONLY required fields
    await page.getByTestId('category-name-input').fill(categoryName)

    const selectInput = page.locator('#category-type-select-input')
    await selectInput.click({ force: true })
    await page.waitForTimeout(500)
    const firstOption = page.locator('[id^="react-select"][id$="-option-0"]').first()
    await firstOption.click({ force: true })

    // DO NOT fill description - leave it empty!

    // Submit
    await page.click('button:has-text("Uložiť kategóriu")')

    // Verify success
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
    await expect(page.locator(`tr:has-text("${categoryName}")`)).toBeVisible()
  })

  // ⚠️ Test 4: VŠETKY polia (povinné aj nepovinné)
  test('should create category with all fields', async ({ page }) => {
    const categoryName = `E2E All Fields ${Date.now()}`
    const description = 'This is a test category description'

    await page.click('button:has-text("Pridať kategóriu")')

    // Fill ALL fields (required + optional)
    await page.getByTestId('category-name-input').fill(categoryName)

    const selectInput = page.locator('#category-type-select-input')
    await selectInput.click({ force: true })
    await page.waitForTimeout(500)
    const firstOption = page.locator('[id^="react-select"][id$="-option-0"]').first()
    await firstOption.click({ force: true })

    // Fill optional field
    await page.getByTestId('category-description-input').fill(description)

    // Submit
    await page.click('button:has-text("Uložiť kategóriu")')

    // Verify success
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
    await expect(page.locator(`tr:has-text("${categoryName}")`)).toBeVisible()
  })

  // Test 5: Cancel
  test('should close modal when clicking cancel', async ({ page }) => {
    await page.click('button:has-text("Pridať kategóriu")')
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).toBeVisible()

    await page.click('button:has-text("Zrušiť")')
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
  })
})
```

#### React-select v testoch

Pre `react-select` komponenty **MUSÍŠ** použiť `inputId` prop:

```tsx
// V komponente
<Select
  inputId="category-type-select-input"  // Stabilné ID!
  value={type}
  onChange={setType}
  options={options}
  menuPortalTarget={document.body}
  styles={{
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  }}
/>

// V teste
const selectInput = page.locator('#category-type-select-input')
await selectInput.click({ force: true })
await page.waitForTimeout(500)
const firstOption = page.locator('[id^="react-select"][id$="-option-0"]').first()
await firstOption.click({ force: true })
```

**Prečo `inputId`?**
- React-select generuje náhodné ID (`react-select-3-input`, `react-select-4-input`...)
- `inputId` prop vytvorí stabilné ID pre testovanie

#### Kedy použiť `{ force: true }`

Použij `{ force: true }` pri kliknutí keď:
- Element je zakrytý overlay-om (napr. modal backdrop)
- React-select menu sa renderuje cez portal

```typescript
// Modal overlay zakrýva element
await selectInput.click({ force: true })

// Normálne tlačidlo - BEZ force
await page.getByTestId('submit-button').click()
```

#### Kontrolný zoznam pre E2E testy formulára

Po vytvorení formulára:

- [ ] Test na otvorenie modalu/formulára
- [ ] Test pre každé povinné pole (validácia s `data-testid` error)
- [ ] **Test na vytvorenie LEN s povinnými poľami** (nepovinné ostanú prázdne)
- [ ] **Test na vytvorenie so VŠETKÝMI poľami** (povinné aj nepovinné)
- [ ] Test na zrušenie (cancel button)
- [ ] Test na duplikát (ak relevantné)
- [ ] Všetky testy používajú `getByTestId()` namiesto text selectors
- [ ] React-select má `inputId` prop
- [ ] Error messages majú `data-testid="[názov]-error"`
- [ ] Backend API schema akceptuje `null` pre nepovinné polia (`.nullish()` alebo `.nullable().optional()`)

---

## Backend API Testy

### ⚠️ POVINNÉ: Vytvoriť backend testy po dokončení API route

**Po vytvorení každého API route MUSÍŠ vytvoriť backend testy.**

Backend testy sa nachádzajú v `tests/backend/` a testujú Prisma operácie a business logiku.

#### Minimálne požadované testy pre CRUD API

Pre každý API endpoint vytvor testy pre:

1. **GET (list)** - načítanie zoznamu
   - Základné načítanie dát
   - Search (vyhľadávanie)
   - Filter (filtrovanie)
   - Sort (triedenie)
   - Pagination (stránkovanie)
   - Count (počet záznamov)
   - Include relations (vzťahy medzi modelmi)

2. **POST (create)** - vytvorenie záznamu
   - Úspešné vytvorenie so všetkými poľami
   - Vytvorenie bez optional polí
   - Chyba pri duplicate name/unique constraint
   - Chyba pri neexistujúcom foreign key

3. **PATCH (update)** - úprava záznamu
   - Úprava každého poľa samostatne
   - Nastavenie optional polí na null
   - Chyba pri duplicate name
   - Automatické updatedAt timestamp

4. **DELETE** - vymazanie záznamu
   - Úspešné vymazanie záznamu bez referencií
   - Správne správanie pri vymazaní so vzťahmi (ON DELETE CASCADE/SET NULL)
   - Count súvisiacich záznamov

5. **GET (single)** - načítanie jedného záznamu
   - Úspešné načítanie podľa ID
   - Null pre neexistujúci ID
   - Include relations

6. **Relationships** - vzťahy medzi modelmi
   - Prepojenie cez foreign key
   - Query podľa vzťahu
   - Aktualizácia vzťahu

#### Štruktúra backend testu

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Test Categories API', () => {
  let testTypeId: string

  // Setup - vykonáva sa raz pred všetkými testmi
  beforeAll(async () => {
    await prisma.$connect()

    // Vytvor testovacie dáta pre foreign keys
    const testType = await prisma.testType.create({
      data: {
        name: 'Test Type ' + Date.now(),
        description: 'Test type for category tests'
      }
    })
    testTypeId = testType.id
  })

  // Cleanup - vykonáva sa raz po všetkých testoch
  afterAll(async () => {
    if (testTypeId) {
      await prisma.testType.delete({
        where: { id: testTypeId }
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('GET /api/admin/test-categories - List', () => {
    it('should fetch all test categories', async () => {
      const categories = await prisma.testCategory.findMany()

      expect(categories).toBeDefined()
      expect(Array.isArray(categories)).toBe(true)
    })

    it('should search by name', async () => {
      const categories = await prisma.testCategory.findMany({
        where: {
          name: {
            contains: 'jazyk',
            mode: 'insensitive'
          }
        }
      })

      expect(categories).toBeDefined()
      categories.forEach(category => {
        expect(category.name.toLowerCase()).toContain('jazyk')
      })
    })

    it('should filter by test type', async () => {
      const categories = await prisma.testCategory.findMany({
        where: { typeId: testTypeId }
      })

      categories.forEach(category => {
        expect(category.typeId).toBe(testTypeId)
      })
    })

    it('should sort by name ascending', async () => {
      const categories = await prisma.testCategory.findMany({
        orderBy: { name: 'asc' }
      })

      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].name <= categories[i + 1].name).toBe(true)
      }
    })

    it('should paginate correctly', async () => {
      const limit = 2
      const page1 = await prisma.testCategory.findMany({
        take: limit,
        skip: 0,
        orderBy: { name: 'asc' }
      })

      const page2 = await prisma.testCategory.findMany({
        take: limit,
        skip: limit,
        orderBy: { name: 'asc' }
      })

      expect(page1.length).toBeLessThanOrEqual(limit)
      expect(page2.length).toBeLessThanOrEqual(limit)
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id)
      }
    })

    it('should count total correctly', async () => {
      const total = await prisma.testCategory.count()

      expect(total).toBeGreaterThanOrEqual(0)
      expect(typeof total).toBe('number')
    })

    it('should include relations', async () => {
      const categories = await prisma.testCategory.findMany({
        include: {
          type: {
            select: { id: true, name: true }
          },
          _count: {
            select: { tests: true }
          }
        }
      })

      categories.forEach(category => {
        if (category.typeId) {
          expect(category.type).toBeDefined()
          expect(category.type?.id).toBeDefined()
        }
        expect(category._count).toBeDefined()
        expect(typeof category._count.tests).toBe('number')
      })
    })
  })

  describe('POST /api/admin/test-categories - Create', () => {
    let createdCategoryId: string | null = null

    // Cleanup po každom teste
    afterEach(async () => {
      if (createdCategoryId) {
        await prisma.testCategory.delete({
          where: { id: createdCategoryId }
        })
        createdCategoryId = null
      }
    })

    it('should create with all fields', async () => {
      const data = {
        name: 'Test Category ' + Date.now(),
        description: 'Test description',
        typeId: testTypeId
      }

      const category = await prisma.testCategory.create({
        data,
        include: {
          type: {
            select: { id: true, name: true }
          }
        }
      })

      createdCategoryId = category.id

      expect(category).toBeDefined()
      expect(category.name).toBe(data.name)
      expect(category.description).toBe(data.description)
      expect(category.typeId).toBe(data.typeId)
      expect(category.type).toBeDefined()
      expect(category.id).toBeDefined()
      expect(category.createdAt).toBeDefined()
      expect(category.updatedAt).toBeDefined()
    })

    it('should create without optional fields', async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Test Category No Desc ' + Date.now(),
          typeId: testTypeId
        }
      })

      createdCategoryId = category.id

      expect(category.description).toBeNull()
    })

    it('should fail with duplicate name', async () => {
      const category1 = await prisma.testCategory.create({
        data: { name: 'Duplicate ' + Date.now() }
      })
      createdCategoryId = category1.id

      await expect(
        prisma.testCategory.create({
          data: { name: category1.name }
        })
      ).rejects.toThrow()
    })

    it('should fail with non-existent foreign key', async () => {
      await expect(
        prisma.testCategory.create({
          data: {
            name: 'Invalid FK ' + Date.now(),
            typeId: 'non-existent-id'
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('PATCH /api/admin/test-categories/[id] - Update', () => {
    let categoryId: string

    beforeEach(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Update Test ' + Date.now(),
          description: 'Original description',
          typeId: testTypeId
        }
      })
      categoryId = category.id
    })

    afterEach(async () => {
      if (categoryId) {
        await prisma.testCategory.delete({
          where: { id: categoryId }
        }).catch(() => {})
      }
    })

    it('should update name', async () => {
      const newName = 'Updated Name ' + Date.now()

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { name: newName }
      })

      expect(updated.name).toBe(newName)
      expect(updated.description).toBe('Original description')
    })

    it('should clear optional field with null', async () => {
      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: null }
      })

      expect(updated.description).toBeNull()
    })

    it('should fail with duplicate name', async () => {
      const duplicateName = 'Duplicate ' + Date.now()

      const category2 = await prisma.testCategory.create({
        data: { name: duplicateName }
      })

      await expect(
        prisma.testCategory.update({
          where: { id: categoryId },
          data: { name: duplicateName }
        })
      ).rejects.toThrow()

      await prisma.testCategory.delete({ where: { id: category2.id } })
    })

    it('should update updatedAt timestamp', async () => {
      const before = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await prisma.testCategory.update({
        where: { id: categoryId },
        data: { description: 'New description' }
      })

      expect(updated.updatedAt > before!.updatedAt).toBe(true)
    })
  })

  describe('DELETE /api/admin/test-categories/[id]', () => {
    let categoryId: string

    beforeEach(async () => {
      const category = await prisma.testCategory.create({
        data: { name: 'Delete Test ' + Date.now() }
      })
      categoryId = category.id
    })

    afterEach(async () => {
      if (categoryId) {
        await prisma.testCategory.delete({
          where: { id: categoryId }
        }).catch(() => {})
      }
    })

    it('should delete successfully', async () => {
      await prisma.testCategory.delete({
        where: { id: categoryId }
      })

      const deleted = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      expect(deleted).toBeNull()
      categoryId = null as any
    })

    it('should return count of related records', async () => {
      const categoryWithCount = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: { tests: true }
          }
        }
      })

      expect(categoryWithCount?._count).toBeDefined()
      expect(typeof categoryWithCount?._count.tests).toBe('number')
    })
  })

  describe('GET /api/admin/test-categories/[id] - Single', () => {
    let categoryId: string

    beforeAll(async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Single Test ' + Date.now(),
          description: 'Description',
          typeId: testTypeId
        }
      })
      categoryId = category.id
    })

    afterAll(async () => {
      await prisma.testCategory.delete({
        where: { id: categoryId }
      }).catch(() => {})
    })

    it('should fetch by id', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId }
      })

      expect(category).toBeDefined()
      expect(category?.id).toBe(categoryId)
      expect(category?.name).toContain('Single Test')
    })

    it('should return null for non-existent id', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: 'non-existent-id' }
      })

      expect(category).toBeNull()
    })

    it('should include relations', async () => {
      const category = await prisma.testCategory.findUnique({
        where: { id: categoryId },
        include: {
          type: {
            select: { id: true, name: true }
          },
          _count: {
            select: { tests: true }
          }
        }
      })

      expect(category?.type).toBeDefined()
      expect(category?.type?.id).toBe(testTypeId)
      expect(category?._count).toBeDefined()
    })
  })

  describe('Relationships', () => {
    it('should link to related model', async () => {
      const category = await prisma.testCategory.create({
        data: {
          name: 'Relationship Test ' + Date.now(),
          typeId: testTypeId
        }
      })

      const categoryWithType = await prisma.testCategory.findUnique({
        where: { id: category.id },
        include: { type: true }
      })

      expect(categoryWithType?.type).toBeDefined()
      expect(categoryWithType?.type?.id).toBe(testTypeId)

      await prisma.testCategory.delete({ where: { id: category.id } })
    })

    it('should query by related model', async () => {
      const category1 = await prisma.testCategory.create({
        data: {
          name: 'Query Test 1 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const category2 = await prisma.testCategory.create({
        data: {
          name: 'Query Test 2 ' + Date.now(),
          typeId: testTypeId
        }
      })

      const categories = await prisma.testCategory.findMany({
        where: {
          typeId: testTypeId,
          name: { contains: 'Query Test' }
        }
      })

      expect(categories.length).toBeGreaterThanOrEqual(2)
      categories.forEach(cat => {
        expect(cat.typeId).toBe(testTypeId)
      })

      await prisma.testCategory.delete({ where: { id: category1.id } })
      await prisma.testCategory.delete({ where: { id: category2.id } })
    })
  })
})
```

#### Dôležité pravidlá pre backend testy

**1. Používaj Date.now() pre unikátne názvy:**

```typescript
// ✅ SPRÁVNE: Unikátny názov pre každý test run
name: 'Test Category ' + Date.now()

// ❌ ZLE: Hardcoded názov zlyhá pri druhom spustení (duplicate)
name: 'Test Category'
```

**2. Vždy cleanup v afterEach/afterAll:**

```typescript
afterEach(async () => {
  if (createdId) {
    await prisma.model.delete({
      where: { id: createdId }
    }).catch(() => {})  // catch() aby nezlyhalo ak už vymazané
    createdId = null
  }
})
```

**3. Test aj success aj failure cases:**

```typescript
// Success case
it('should create successfully', async () => {
  const item = await prisma.model.create({ data: { name: 'Test' } })
  expect(item).toBeDefined()
})

// Failure case
it('should fail with duplicate name', async () => {
  await expect(
    prisma.model.create({ data: { name: existingName } })
  ).rejects.toThrow()
})
```

**4. Test relations a counts:**

```typescript
it('should include related data', async () => {
  const item = await prisma.model.findUnique({
    where: { id },
    include: {
      relatedModel: true,
      _count: {
        select: { children: true }
      }
    }
  })

  expect(item?.relatedModel).toBeDefined()
  expect(typeof item?._count.children).toBe('number')
})
```

**5. Test pagination správne:**

```typescript
it('should paginate correctly', async () => {
  const limit = 2
  const page1 = await prisma.model.findMany({
    take: limit,
    skip: 0,
    orderBy: { name: 'asc' }
  })

  const page2 = await prisma.model.findMany({
    take: limit,
    skip: limit,
    orderBy: { name: 'asc' }
  })

  expect(page1.length).toBeLessThanOrEqual(limit)
  expect(page2.length).toBeLessThanOrEqual(limit)

  // Verify different records
  if (page1.length > 0 && page2.length > 0) {
    expect(page1[0].id).not.toBe(page2[0].id)
  }
})
```

#### Kontrolný zoznam pre backend testy

Po vytvorení API route:

- [ ] Vytvorený test súbor v `tests/backend/[názov]-api.test.ts`
- [ ] `beforeAll` - pripojenie k DB a vytvorenie test fixtures
- [ ] `afterAll` - vyčistenie fixtures a odpojenie od DB
- [ ] `afterEach` - cleanup vytvorených dát v každom teste
- [ ] **GET (list)** - fetch all, search, filter, sort, pagination, count, relations
- [ ] **POST (create)** - success, without optional, duplicate error, invalid FK
- [ ] **PATCH (update)** - update každého poľa, set null, duplicate error, updatedAt
- [ ] **DELETE** - success, related records behavior
- [ ] **GET (single)** - by ID, non-existent ID, relations
- [ ] **Relationships** - link, query by relation
- [ ] Všetky názvy používajú `Date.now()` pre unikátnosť
- [ ] Všetky testy robia cleanup po sebe

#### Spustenie backend testov

```bash
npm run test:backend
```

Pre watch mode:

```bash
npm run test:backend:watch
```

#### Prečo je to dôležité?

- ✅ Overenie že Prisma schéma a queries fungujú správne
- ✅ Catch database constraint violations
- ✅ Validácia business logiky pred E2E testami
- ✅ Rýchlejšie ako E2E testy (žiadny browser overhead)
- ✅ Overenie ON DELETE CASCADE/SET NULL správania
- ✅ Testovanie edge cases (null values, duplicates, missing relations)

---

## Viac informácií

Viac informácií o testovaní nájdeš v `docs/13-testovanie.md`.
