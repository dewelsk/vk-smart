# Ikony a Vizuálne Prvky

## ⚠️ KRITICKÁ POŽIADAVKA: Používanie Heroicons namiesto emoji

**NIKDY nepoužívať emoji ikony (🔧, ✓, ⚠, ✕, 📄, atď.) v UI!**

### ⚠️ DÔLEŽITÉ: Emoji v návrhových dokumentoch

**Emoji v súboroch `obrazovky/*.md` sú LEN ILUSTRAČNÉ!**

Keď vidíš v návrhovom dokumente emoji symboly (napr. 📋 Základné informácie, ⚙️ Odporúčané nastavenia), **NIKDY ich nepoužívaj v skutočnej implementácii**.

- ✅ V implementácii vždy použiť **Heroicons** komponenty
- ❌ Emoji v návrhoch slúžia len na vizuálnu štruktúru dokumentu
- ❌ Používateľ MUSÍ **explicitne požiadať** o emoji, inak ich NEPOUŽÍVAJ

## Pravidlo

**Vždy používaj Heroicons** z `@heroicons/react`:

```typescript
import { IconName } from '@heroicons/react/24/outline'  // outline icons
import { IconName } from '@heroicons/react/24/solid'    // solid icons
```

## Bežné mapovanie emoji → Heroicons

| Emoji | Heroicons Komponent |
|-------|-------------------|
| 🔧 | `WrenchScrewdriverIcon` |
| ✓, ✅ | `CheckIcon` alebo `CheckCircleIcon` |
| ⚠️ | `ExclamationTriangleIcon` |
| ✕, ❌ | `XMarkIcon` |
| ℹ️ | `InformationCircleIcon` |
| 👤 | `UserIcon` |
| 📋 | `ClipboardDocumentListIcon` |
| ➕ | `PlusIcon` |
| 📄 | `DocumentIcon` alebo `DocumentTextIcon` |
| 📤 | `DocumentArrowUpIcon` |
| ⭐ | `StarIcon` |
| ⭕ | `QuestionMarkCircleIcon` |
| 🗑️ | `TrashIcon` |
| ✏️ | `PencilIcon` |
| 🔍 | `MagnifyingGlassIcon` |
| 🔒 | `LockClosedIcon` |
| 🔓 | `LockOpenIcon` |
| 📊 | `ChartBarIcon` |
| ⚙️ | `Cog6ToothIcon` |
| 🏠 | `HomeIcon` |
| 📁 | `FolderIcon` |
| 🔗 | `LinkIcon` |
| 🚀 | `RocketLaunchIcon` |
| 💾 | `ArrowDownTrayIcon` |
| 📥 | `ArrowDownTrayIcon` |
| 📧 | `EnvelopeIcon` |
| 🔔 | `BellIcon` |
| ⏰ | `ClockIcon` |

## Príklady použitia

### ✅ SPRÁVNE

```tsx
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// Tlačidlo s ikonou
<button className="inline-flex items-center gap-2">
  <PlusIcon className="h-4 w-4" />
  Pridať
</button>

// Ikona v zozname
<div className="flex items-center gap-2">
  <CheckCircleIcon className="h-5 w-5 text-green-600" />
  <span>Dokončené</span>
</div>

// Warning badge
<div className="flex items-center gap-2 text-yellow-600">
  <ExclamationTriangleIcon className="h-5 w-5" />
  <span>Upozornenie</span>
</div>
```

### ❌ ZLE

```tsx
// ZLE: Používanie emoji v UI
<button>
  ➕ Pridať
</button>

<div>
  ✅ Dokončené
</div>

<div>
  ⚠️ Upozornenie
</div>
```

## Prečo je to dôležité?

- ✅ **Konzistentný dizajn** - všetky ikony vyzerajú jednotne
- ✅ **Lepšia prístupnosť (accessibility)** - Heroicons majú správne ARIA atribúty
- ✅ **Profesionálny vzhľad** - ikony sú navrhnuté pre web aplikácie
- ✅ **Prispôsobiteľné** - veľkosť, farba, stroke width
- ❌ **Emoji sa renderujú rôzne** na rôznych platformách (Windows vs Mac vs Linux)
- ❌ **Emoji komplikujú testovanie** - nie sú stabilné v textových selektoroch
- ❌ **Emoji vyzerajú neprofesionálne** v business aplikáciách

## Dokumentácia

Kompletný zoznam ikon: https://heroicons.com/

## Veľkosti ikon

- **Malé (buttons):** `h-4 w-4`
- **Stredné (UI prvky):** `h-5 w-5`
- **Veľké (hlavičky):** `h-6 w-6`
- **Extra veľké (ilustrácie):** `h-8 w-8` alebo viac

```tsx
// Tlačidlá
<PlusIcon className="h-4 w-4" />

// Zoznamy, karty
<CheckCircleIcon className="h-5 w-5" />

// Nadpisy, sekcie
<DocumentIcon className="h-6 w-6" />
```
