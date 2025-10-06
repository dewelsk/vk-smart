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

---

## Viac informácií

Viac informácií o testovaní nájdeš v `docs/13-testovanie.md`.
