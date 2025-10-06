# Systém notifikácií (Toast Messages)

## Prehľad

Aplikácia používa vlastný toast notification systém implementovaný v `components/Toast.tsx`. Tento systém poskytuje vizuálne spätné väzby používateľom pre rôzne akcie a udalosti.

## Architektúra

### Komponenty

#### `ToastProvider`
- Context provider, ktorý musí wrappovať aplikáciu alebo sekciu, kde sa majú zobrazovať notifikácie
- Spravuje stav všetkých aktívnych toast notifikácií
- Automaticky odstráni toast po uplynutí času (default: 5 sekúnd)
- Umožňuje manuálne zatvorenie notifikácie

#### `ToastItem`
- Individuálna toast notifikácia s ikonkou, správou a tlačidlom na zatvorenie
- Má rôzne farebné schémy podľa typu (success, error, warning, info)
- Animovaný vstup (slide-in-right)

### Hook: `useToast()`

Hook poskytuje nasledujúce metódy:

```typescript
const { showSuccess, showError, showWarning, showInfo, showToast } = useToast()
```

## Typy notifikácií

### 1. Success (Úspech)
- **Farba:** Zelená
- **Ikona:** CheckCircleIcon
- **Použitie:** Potvrdenie úspešnej akcie
- **Príklad:** "Úspešne pridaných 5 uchádzačov"

```typescript
showSuccess('Údaje boli úspešne uložené')
```

### 2. Error (Chyba)
- **Farba:** Červená
- **Ikona:** XCircleIcon
- **Použitie:** Zobrazenie chybovej správy
- **Príklad:** "Chyba pri pridávaní uchádzačov"

```typescript
showError('Vyberte aspoň jedného uchádzača')
```

### 3. Warning (Varovanie)
- **Farba:** Žltá
- **Ikona:** ExclamationTriangleIcon
- **Použitie:** Upozornenie používateľa na potenciálny problém
- **Príklad:** "Táto operácia je nevratná"

```typescript
showWarning('Niektoré polia neboli vyplnené')
```

### 4. Info (Informácia)
- **Farba:** Modrá
- **Ikona:** InformationCircleIcon
- **Použitie:** Všeobecné informatívne správy
- **Príklad:** "Načítavam dáta..."

```typescript
showInfo('Systém bude dočasne nedostupný o 22:00')
```

## Implementácia

### 1. Pridanie ToastProvider do aplikácie

V root layoute alebo komponente:

```typescript
import { ToastProvider } from '@/components/Toast'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
```

### 2. Použitie v komponente

```typescript
'use client'

import { useToast } from '@/components/Toast'

export function MyComponent() {
  const { showSuccess, showError } = useToast()

  async function handleSubmit() {
    try {
      const res = await fetch('/api/endpoint', { method: 'POST' })

      if (res.ok) {
        showSuccess('Operácia bola úspešná!')
      } else {
        showError('Nastala chyba pri spracovaní')
      }
    } catch (error) {
      showError('Nepodarilo sa pripojiť k serveru')
    }
  }

  return (
    <button onClick={handleSubmit}>Submit</button>
  )
}
```

### 3. Vlastná dĺžka trvania

```typescript
// Zobrazí notifikáciu na 10 sekúnd
showSuccess('Táto správa sa zobrazí dlhšie', 10000)

// Notifikácia sa nezavrie automaticky (duration = 0)
showError('Kritická chyba - uzavrite manuálne', 0)
```

## Pravidlá použitia

### ✅ Použiť toast notifikácie pre:
- Potvrdenie úspešnej operácie (CRUD akcie)
- Zobrazenie chybových správ po neúspešnej operácii
- Validačné chyby
- Informácie o stave operácie (loading, success, error)
- Dočasné notifikácie, ktoré nevyžadujú používateľskú akciu

### ❌ NEpoužívať toast notifikácie pre:
- Kritické chyby vyžadujúce okamžitú pozornosť (použite modal)
- Potvrdzovacie dialógy ("Naozaj chcete zmazať?" - použite confirmation modal)
- Komplexné formulárové validačné chyby (zobrazte inline pri inputoch)
- Dlhé správy alebo inštrukcie

### ⛔ NIKDY nepoužívať:
- `alert()` - JavaScript natívny alert
- `confirm()` - JavaScript natívny confirm (použite `<ConfirmModal />`)
- `prompt()` - JavaScript natívny prompt

**Dôvod:** Tieto natívne dialógy:
- Blokujú celú aplikáciu
- Nemôžu byť štylizované
- Majú zlý UX
- Nie sú prístupné (accessibility)

## ConfirmModal komponent

Pre potvrdzovacie dialógy (namiesto `confirm()`) používajte `<ConfirmModal />` komponent.

### Použitie

```typescript
import { ConfirmModal } from '@/components/ConfirmModal'

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false)

  function handleDeleteClick() {
    setShowConfirm(true)
  }

  async function handleDeleteConfirm() {
    setShowConfirm(false)
    // Vykonať akciu
    await deleteItem()
  }

  return (
    <>
      <button onClick={handleDeleteClick}>Odstrániť</button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Odstrániť položku"
        message="Naozaj chcete odstrániť túto položku? Táto akcia je nevratná."
        confirmLabel="Odstrániť"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
```

### Props

| Prop | Typ | Popis |
|------|-----|-------|
| `isOpen` | `boolean` | Či je modal otvorený |
| `title` | `string` | Nadpis modalu |
| `message` | `string` | Text správy |
| `confirmLabel` | `string` | Text potvrdz ovacieho tlačidla (default: "Potvrdiť") |
| `cancelLabel` | `string` | Text zrušovacieho tlačidla (default: "Zrušiť") |
| `variant` | `'danger' \| 'warning'` | Farebná schéma (default: "danger") |
| `onConfirm` | `() => void` | Callback po potvrdení |
| `onCancel` | `() => void` | Callback po zrušení |

### Kedy použiť ConfirmModal

✅ **Použite ConfirmModal pre:**
- Deštruktívne akcie (mazanie, archivácia)
- Zmeny, ktoré nemožno vrátiť späť
- Dôležité rozhodnutia vyžadujúce potvrdenie

❌ **Nepoužívajte ConfirmModal pre:**
- Validačné chyby (použite toast error)
- Informatívne správy (použite toast info)
- Formulárové chyby (zobrazte inline pri inputoch)

## Príklady z projektu

### AddCandidateModal.tsx

```typescript
async function handleSave() {
  if (selectedUserIds.length === 0) {
    showError('Vyberte aspoň jedného uchádzača')
    return
  }

  try {
    const res = await fetch(`/api/admin/vk/${vkId}/candidates`, {
      method: 'POST',
      body: JSON.stringify({ userIds: selectedUserIds })
    })

    if (res.ok) {
      const data = await res.json()
      showSuccess(`Úspešne pridaných ${data.count} uchádzačov`)
      onSuccess()
      onClose()
    } else {
      const data = await res.json()
      showError(data.error || 'Chyba pri pridávaní uchádzačov')
    }
  } catch (error) {
    showError('Chyba pri pridávaní uchádzačov')
  }
}
```

## Styling

Toast notifikácie sa zobrazujú:
- **Pozícia:** Vpravo hore (top-right)
- **Z-index:** 9999 (najvyššia vrstva)
- **Max šírka:** 400px (max-w-md)
- **Animácia:** Slide-in z pravej strany
- **Medzera:** 8px medzi jednotlivými notifikáciami

## Dostupnosť (Accessibility)

- Každý toast má `role="alert"` pre screen readers
- Tlačidlo zatvorenia má `aria-label="Zavrieť"`
- Farebný kontrast spĺňa WCAG 2.1 štandardy
- Ikony poskytujú vizuálnu indikáciu typu správy

## Budúce rozšírenia

### Statické alerty (TODO)
Pre dlhodobé notifikácie, ktoré zostanú na obrazovke:
- Admin musí schváliť VK
- Gestor musí vytvoriť testy
- Systémové upozornenia

**Poznámka:** Statické alerty sú zatiaľ mimo scope. Budú implementované ako samostatná komponenta, pravdepodobne v rámci layout-u alebo dashboard-u.

## Súvisiaca dokumentácia

- [Interná komunikácia](./20-internal-communication.md) - Ako komunikujú komponenty medzi sebou
- [UX Guidelines](./ux-guidelines.md) - Všeobecné UX pravidlá (ak existuje)

## Technické detaily

### Implementácia Context API

```typescript
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}
```

### State management

```typescript
type Toast = {
  id: string           // Unikátny identifikátor
  type: ToastType      // success | error | warning | info
  message: string      // Text správy
  duration?: number    // Trvanie v ms (default: 5000)
}
```

## Migrácia z alert()

Ak nájdete v kóde použitie `alert()`, nahraďte ho podľa tohto vzoru:

```typescript
// ❌ Zlé
alert('Operácia úspešná')
alert('Došlo k chybe')

// ✅ Správne
showSuccess('Operácia úspešná')
showError('Došlo k chybe')
```

## Testovanie

Pri písaní testov môžete mockovať useToast hook:

```typescript
jest.mock('@/components/Toast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  })
}))
```
