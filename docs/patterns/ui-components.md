# UI Komponenty - Dizajn Patterns

## Tlačidlá (Buttons)

### Základné pravidlá

**Všetky tlačidlá v aplikácii musia mať jednotný vizuálny štýl.**

1. **Veľkosť a font:**
   - Vždy `text-sm font-medium`
   - Vždy `px-4 py-2` padding
   - Vždy `rounded-md`

2. **Typy tlačidiel:**
   - **Primary (akčné):** modrá farba
   - **Secondary (zrušiť):** sivá farba s borderom
   - **Destructive (vymazať):** červená farba

3. **Ikony:**
   - Sú VOLITEĽNÉ (nie povinné)
   - Ak sú použité, veľkosť `h-4 w-4`
   - S `inline-flex items-center gap-2`

### Presné štýly tlačidiel

#### Primary button (akčné tlačidlo - uložiť, potvrdiť, pridať)

```tsx
<button
  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Uložiť
</button>

// S ikonou (voliteľné):
<button
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <PlusIcon className="h-4 w-4" />
  Pridať
</button>
```

#### Secondary button (zrušiť, späť)

```tsx
<button
  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
>
  Zrušiť
</button>

// S ikonou (voliteľné):
<button
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
>
  <ArrowLeftIcon className="h-4 w-4" />
  Späť
</button>
```

#### Destructive button (vymazať, odstrániť)

```tsx
<button
  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Vymazať
</button>

// S ikonou (voliteľné):
<button
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <TrashIcon className="h-4 w-4" />
  Vymazať
</button>
```

### ❌ ZLE - Nekonzistentné tlačidlá

```tsx
// ZLE: Semi-transparent pozadie, väčší font, iná veľkosť ikony
<button className="px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100">
  <DocumentDuplicateIcon className="h-5 w-5" />
  Vytvoriť kópiu
</button>

// ZLE: Iný padding, žiadny text-sm
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
  Uložiť
</button>

// ZLE: Iný border radius
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
  Uložiť
</button>
```

### ✅ SPRÁVNE - Konzistentné tlačidlá

```tsx
// Správne: Jednotný štýl
<button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
  Uložiť
</button>

<button className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
  Zrušiť
</button>

<button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
  <TrashIcon className="h-4 w-4" />
  Vymazať
</button>
```

### Prečo je to KRITICKY dôležité?

- ✅ **Profesionálny vzhľad** - aplikácia vyzerá jednotne
- ✅ **Používateľská skúsenosť** - používateľ vie čo očakávať
- ✅ **Jednoduchšie udržiavanie** - zmena jedného štýlu = zmena všade
- ❌ **Rôzne štýly na každej stránke** = chaos a neprofesionálny dojem
- ❌ **Semi-transparent pozadia** (`bg-blue-50`) vyzerajú ako "disabled" tlačidlá
- ❌ **Väčšie/menšie fonty** narúšajú vizuálnu hierarchiu

### Kontrolný zoznam pri vytváraní tlačidiel

- [ ] Použil som `text-sm font-medium`
- [ ] Použil som `px-4 py-2` padding
- [ ] Použil som `rounded-md` (NIE `rounded-lg`)
- [ ] Primary tlačidlo má `bg-blue-600 text-white hover:bg-blue-700`
- [ ] Secondary tlačidlo má `border border-gray-300 text-gray-700 bg-white hover:bg-gray-50`
- [ ] Destructive tlačidlo má `bg-red-600 text-white hover:bg-red-700`
- [ ] Ikony (ak sú použité) majú `h-4 w-4` (NIE `h-5 w-5`)
- [ ] Použil som `transition-colors` pre plynulé hover efekty
- [ ] Disabled state má `disabled:opacity-50 disabled:cursor-not-allowed`

## Príklady v projekte

Pozri existujúce komponenty pre správnu implementáciu:
- Page headers: `components/PageHeader.tsx`
- Modal dialogs: `components/ConfirmModal.tsx`
- Form buttons: vyhľadaj v `app/(admin-protected)/` pre príklady
