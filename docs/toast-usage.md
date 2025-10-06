# Používanie Toast Notifikácií

## 1. Základné použitie

V akejkoľvek client komponent môžete použiť `useToast` hook:

```tsx
'use client'

import { useToast } from '@/components/Toast'

export function MyComponent() {
  const { showError, showSuccess, showWarning, showInfo } = useToast()

  async function handleSubmit() {
    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        showError(error.message || 'Chyba pri ukladaní')
        return
      }

      showSuccess('Úspešne uložené!')
    } catch (error) {
      showError('Problém s pripojením k serveru')
    }
  }

  return <button onClick={handleSubmit}>Submit</button>
}
```

## 2. Dostupné metódy

- `showError(message, duration?)` - Červené upozornenie pre chyby
- `showSuccess(message, duration?)` - Zelené upozornenie pre úspech
- `showWarning(message, duration?)` - Žlté upozornenie pre varovania
- `showInfo(message, duration?)` - Modré upozornenie pre informácie
- `showToast(message, type, duration?)` - Univerzálna metóda

## 3. Príklad s API chybami

```tsx
async function saveCommission() {
  try {
    const res = await fetch(`/api/admin/vk/${vkId}/commission/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, chairmanId })
    })

    if (!res.ok) {
      const data = await res.json()
      showError(data.error || 'Chyba pri ukladaní komisie')
      return
    }

    showSuccess('Komisia bola úspešne uložená')
    onClose()
  } catch (error) {
    showError('Problém s pripojením k databáze. Skontrolujte internetové pripojenie.')
  }
}
```

## 4. Dĺžka zobrazenia

Predvolene sa toast zobrazí na 5 sekúnd. Môžete zmeniť:

```tsx
showError('Chyba!', 3000) // 3 sekundy
showSuccess('OK!', 10000) // 10 sekúnd
```

## 5. Prispôsobenie

Toast notifikácie sú už štylizované v `components/Toast.tsx` a používajú Tailwind CSS.
