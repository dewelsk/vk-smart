# Form Validation Patterns

Tento dokument obsahuje kompletné príklady validácie formulárov v aplikácii.

## Základný pattern s inline validáciou

### Jednoduchý formulár

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
        <p className="mt-2 text-sm text-red-600" data-testid="name-error">
          {errors.name}
        </p>
      )}
    </div>
  )
}
```

## Komplexný formulár s viacerými poľami

### Pattern pre production-ready formulár

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

## React-select integrácia

### Select s validáciou

```tsx
import Select from 'react-select'

function FormWithSelect() {
  const [category, setCategory] = useState<{ value: string; label: string } | null>(null)
  const [errors, setErrors] = useState<{ category?: string }>({})
  const categoryRef = useRef<any>(null)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Kategória *
      </label>
      <Select
        ref={categoryRef}
        inputId="category-select-input"  // Stabilné ID pre testy!
        value={category}
        onChange={(val) => {
          setCategory(val)
          if (errors.category) {
            setErrors({ ...errors, category: undefined })
          }
        }}
        options={categoryOptions}
        placeholder="Vyberte kategóriu"
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base) => ({
            ...base,
            borderColor: errors.category ? '#ef4444' : '#d1d5db',
          })
        }}
      />
      {errors.category && (
        <p className="mt-2 text-sm text-red-600" data-testid="category-error">
          {errors.category}
        </p>
      )}
    </div>
  )
}
```

## Toast notifikácie

### Konzistentné používanie react-hot-toast

```typescript
import { toast } from 'react-hot-toast'

// Loading state
const toastId = toast.loading('Ukladám...')

try {
  const result = await saveData()

  // Dismiss loading toast
  toast.dismiss(toastId)

  // Show success
  toast.success('Úspešne uložené')
} catch (error) {
  // Dismiss loading toast
  toast.dismiss(toastId)

  // Show error
  toast.error('Chyba pri ukladaní')
}

// Warning
toast.warning('Niektoré polia neboli vyplnené')
```

**DÔLEŽITÉ:**
- Vždy volaj `toast.dismiss()` pred zobrazením úspešnej/chybovej správy
- Toast správy majú byť krátke a výstižné
- Nepoužívaj `alert()`, `confirm()` - len toast a modály

## Príklady z produkcie

Skutočné implementácie formulárov v aplikácii:

- **Test Import Form:** `app/(admin-protected)/tests/import/page.tsx`
- **User Create Form:** `app/(admin-protected)/users/new/page.tsx`
- **VK Create Form:** `app/(admin-protected)/vk/create/page.tsx`
- **Institution Form:** `app/(admin-protected)/institutions/[id]/page.tsx`

## Kontrolný zoznam

Pri vytváraní nového formulára:

- [ ] Každý input má `ref` pre auto-scroll
- [ ] Každý input má `data-testid="[názov]-input"`
- [ ] Každá error správa má `data-testid="[názov]-error"`
- [ ] Errors state definovaný: `useState<Record<string, string>>({})`
- [ ] Validačná funkcia vracia `boolean`
- [ ] Pri chybe sa scroll na prvý nevalidný input
- [ ] Červený border pri chybe: `border-red-500 focus:ring-red-200`
- [ ] Error správa pod inputom: `<p className="mt-2 text-sm text-red-600">`
- [ ] Clear error pri zmene hodnoty inputu
- [ ] `toast.loading()` pri odoslaní
- [ ] `toast.dismiss()` pred `toast.success()` alebo `toast.error()`
- [ ] Submit button má `disabled={saving}` state
- [ ] Form má `onSubmit={(e) => { e.preventDefault(); handleSubmit() }}`
