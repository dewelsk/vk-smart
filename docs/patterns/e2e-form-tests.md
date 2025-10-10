# E2E Testy pre Formuláre

## Minimálne požadované testy

**Po vytvorení každého formulára MUSÍŠ vytvoriť E2E testy.**

Pre každý formulár vytvor nasledujúce testy:

1. **Otvorenie modalu/formulára**
2. **Validácia povinných polí** - samostatný test pre každé povinné pole
3. **⚠️ Úspešné vytvorenie len s povinnými poľami** - vyplniť IBA povinné polia, nepovinné ostanú prázdne
4. **⚠️ Úspešné vytvorenie so všetkými poľami** - vyplniť všetky polia (povinné aj nepovinné)
5. **Zatvorenie modalu/formulára** (cancel)
6. **Duplikát** (ak relevantné) - pokus o vytvorenie záznamu s už existujúcim unique poľom

## Prečo sú testy 3 a 4 dôležité?

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

## Príklad E2E testov pre formulár

```typescript
import { test, expect } from '@playwright/test'
import { loginAsSuperadmin } from '../../helpers/auth'
import { prisma } from '@/lib/prisma'

test.describe('Create Category Modal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperadmin(page)
    await page.goto('http://localhost:5600/test-categories')
    await page.waitForLoadState('networkidle')
  })

  // Test 1: Validácia povinného poľa
  test('should validate required name field', async ({ page }) => {
    await page.getByTestId('add-category-button').click()

    // Try to submit without name
    await page.getByTestId('submit-button').click()

    // Should show inline error message
    await expect(page.getByTestId('category-name-error')).toBeVisible()
    await expect(page.getByTestId('category-name-error')).toHaveText('Názov kategórie je povinný')
  })

  // Test 2: Validácia ďalšieho povinného poľa
  test('should validate required type field', async ({ page }) => {
    await page.getByTestId('add-category-button').click()

    // Fill name but not type
    await page.getByTestId('category-name-input').fill('Test Category')

    await page.getByTestId('submit-button').click()

    // Should show inline error for type
    await expect(page.getByTestId('category-type-error')).toBeVisible()
    await expect(page.getByTestId('category-type-error')).toHaveText('Typ testu je povinný')
  })

  // ⚠️ Test 3: Len POVINNÉ polia (description OSTANE PRÁZDNE)
  test('should create category with required fields only', async ({ page }) => {
    const categoryName = `E2E Required Only ${Date.now()}`

    await page.getByTestId('add-category-button').click()

    // Fill ONLY required fields
    await page.getByTestId('category-name-input').fill(categoryName)

    const selectInput = page.locator('#category-type-select-input')
    await selectInput.click({ force: true })
    await page.waitForTimeout(500)
    const firstOption = page.locator('[id^="react-select"][id$="-option-0"]').first()
    await firstOption.click({ force: true })

    // DO NOT fill description - leave it empty!

    // Submit
    await page.getByTestId('submit-button').click()

    // Verify success
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
    await expect(page.locator(`tr:has-text("${categoryName}")`)).toBeVisible()
  })

  // ⚠️ Test 4: VŠETKY polia (povinné aj nepovinné)
  test('should create category with all fields', async ({ page }) => {
    const categoryName = `E2E All Fields ${Date.now()}`
    const description = 'This is a test category description'

    await page.getByTestId('add-category-button').click()

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
    await page.getByTestId('submit-button').click()

    // Verify success
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
    await expect(page.locator(`tr:has-text("${categoryName}")`)).toBeVisible()
  })

  // Test 5: Cancel
  test('should close modal when clicking cancel', async ({ page }) => {
    await page.getByTestId('add-category-button').click()
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).toBeVisible()

    await page.getByTestId('cancel-button').click()
    await expect(page.locator('h3:has-text("Pridať kategóriu")')).not.toBeVisible()
  })

  // Test 6: Duplicate
  test('should show error for duplicate name', async ({ page }) => {
    const duplicateName = 'Duplicate Test Category'

    // Create first category
    await page.getByTestId('add-category-button').click()
    await page.getByTestId('category-name-input').fill(duplicateName)
    const selectInput = page.locator('#category-type-select-input')
    await selectInput.click({ force: true })
    await page.waitForTimeout(500)
    const firstOption = page.locator('[id^="react-select"][id$="-option-0"]').first()
    await firstOption.click({ force: true })
    await page.getByTestId('submit-button').click()

    // Try to create duplicate
    await page.getByTestId('add-category-button').click()
    await page.getByTestId('category-name-input').fill(duplicateName)
    await selectInput.click({ force: true })
    await page.waitForTimeout(500)
    await firstOption.click({ force: true })
    await page.getByTestId('submit-button').click()

    // Should show error
    await expect(page.locator('text=Kategória s týmto názvom už existuje')).toBeVisible()
  })
})
```

## React-select v testoch

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

## Kedy použiť `{ force: true }`

Použij `{ force: true }` pri kliknutí keď:
- Element je zakrytý overlay-om (napr. modal backdrop)
- React-select menu sa renderuje cez portal

```typescript
// Modal overlay zakrýva element
await selectInput.click({ force: true })

// Normálne tlačidlo - BEZ force
await page.getByTestId('submit-button').click()
```

## Kontrolný zoznam

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

## Príklady v projekte

Kompletné príklady E2E testov:
- [tests/e2e/admin/test-categories.spec.ts](../../tests/e2e/admin/test-categories.spec.ts)
- [tests/e2e/admin/test-import.spec.ts](../../tests/e2e/admin/test-import.spec.ts)
- [tests/e2e/admin/institutions-detail.spec.ts](../../tests/e2e/admin/institutions-detail.spec.ts)
