# Interná komunikácia komponentov

## Prehľad

Tento dokument popisuje, ako komponenty v aplikácii komunikujú medzi sebou, akým spôsobom sa odovzdávajú dáta a ako sa spúšťajú akcie.

## Komunikačné vzory

### 1. Parent → Child (Props)

Najzákladnejší spôsob komunikácie - rodič odovzdá dáta alebo callback funkcie dieťaťu cez props.

```typescript
// Parent Component
function VKDetailPage() {
  const [vkData, setVkData] = useState(null)
  const [showModal, setShowModal] = useState(false)

  function handleCandidateAdded() {
    // Refresh data after adding candidate
    fetchVKData()
  }

  return (
    <div>
      {showModal && (
        <AddCandidateModal
          vkId={vkData.id}
          onClose={() => setShowModal(false)}
          onSuccess={handleCandidateAdded}
        />
      )}
    </div>
  )
}
```

**Pravidlá:**
- Props by mali byť immutable
- Callback funkcie by mali mať jasný názov začínajúci `on` (onClose, onSuccess, onChange)
- Vyhýbajte sa "prop drilling" - ak potrebujete odovzdať props cez viac ako 3 úrovne, zvážte Context API

### 2. Child → Parent (Callback Functions)

Dieťa volá callback funkciu od rodiča, aby oznámilo udalosť alebo odovzdalo dáta.

```typescript
// Child Component
function AddCandidateModal({ vkId, onClose, onSuccess }) {
  async function handleSave() {
    const res = await fetch(`/api/admin/vk/${vkId}/candidates`, {
      method: 'POST',
      body: JSON.stringify({ userIds })
    })

    if (res.ok) {
      onSuccess()  // Notify parent of success
      onClose()    // Request parent to close modal
    }
  }

  return (
    <div>
      <button onClick={handleSave}>Uložiť</button>
      <button onClick={onClose}>Zrušiť</button>
    </div>
  )
}
```

**Callback konvencie:**

| Názov callbacku | Účel | Parametre | Príklad použitia |
|----------------|------|-----------|------------------|
| `onClose` | Zatvoriť modal/panel | žiadne | Modal, Dropdown, Sidebar |
| `onSuccess` | Akcia úspešná | žiadne alebo data | Form submission, API call |
| `onError` | Akcia zlyhala | error message | Form submission, API call |
| `onChange` | Hodnota sa zmenila | new value | Input, Select, Checkbox |
| `onSelect` | Item bol vybraný | selected item | Dropdown, List |
| `onSubmit` | Formulár bol odoslaný | form data | Form |
| `onDelete` | Item bol zmazaný | item id | List, Table |
| `onCancel` | Akcia zrušená | žiadne | Form, Modal |

### 3. Global State (Context API)

Pre dáta, ktoré potrebuje viacero komponentov naprieč aplikáciou (autentifikácia, toast notifikácie, téma).

```typescript
// Toast Context Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showSuccess = useCallback((message) => {
    // Add toast to state
  }, [])

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
    </ToastContext.Provider>
  )
}

// Usage in any component
function MyComponent() {
  const { showSuccess } = useToast()

  function handleAction() {
    showSuccess('Akcia úspešná!')
  }
}
```

**Kedy použiť Context:**
- ✅ Autentifikácia (session data)
- ✅ Téma (dark/light mode)
- ✅ Toast notifikácie
- ✅ Jazyk/locale
- ❌ Form state (použite local state)
- ❌ Fetched data (použite SWR alebo React Query)

### 4. URL State (Search Params, Route Params)

Pre state, ktorý má byť zdieľateľný cez URL (filtre, pagination, sorting).

```typescript
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

function UsersTable() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const page = searchParams.get('page') || '1'
  const search = searchParams.get('search') || ''

  function handleSearchChange(newSearch: string) {
    const params = new URLSearchParams(searchParams)
    params.set('search', newSearch)
    params.set('page', '1') // Reset to page 1 on search
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <input
      value={search}
      onChange={(e) => handleSearchChange(e.target.value)}
    />
  )
}
```

**Výhody:**
- Zdieľateľné URL
- Tlačidlo "Späť" funguje správne
- State sa zachováva pri refresh

### 5. Server → Client (API Routes)

Komponenty komunikujú so serverom cez API routes.

```typescript
// API Route: app/api/admin/vk/[id]/candidates/route.ts
export async function POST(request: NextRequest, { params }) {
  const { userIds } = await request.json()

  // Business logic
  await prisma.candidate.createMany({ data: candidatesData })

  return NextResponse.json({
    success: true,
    count: candidatesData.length
  })
}

// Client Component
async function addCandidates(vkId: string, userIds: string[]) {
  const res = await fetch(`/api/admin/vk/${vkId}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds })
  })

  if (!res.ok) {
    throw new Error('Failed to add candidates')
  }

  return res.json()
}
```

**Response formát:**

```typescript
// Success response
{
  success: true,
  data: { /* response data */ },
  message?: string
}

// Error response
{
  error: string,
  details?: any
}
```

## Komunikačné scenáre

### Scenár 1: Modal s formulárom

**Flow:**
1. Parent má button "Pridať uchádzača"
2. Klik otvorí modal (parent nastaví `showModal = true`)
3. Modal zobrazí formulár
4. User vyplní formulár a klikne "Uložiť"
5. Modal zavolá API
6. Na success: Modal zavolá `onSuccess()` a `onClose()`
7. Parent v `onSuccess` refreshne dáta
8. Parent v `onClose` nastaví `showModal = false`

```typescript
// Parent
function VKDetail() {
  const [showModal, setShowModal] = useState(false)

  function handleSuccess() {
    fetchCandidates() // Refresh data
    showToast('Uchádzači pridaní!')
  }

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Pridať uchádzača
      </button>

      {showModal && (
        <AddCandidateModal
          vkId={vkId}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

// Child
function AddCandidateModal({ vkId, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast()

  async function handleSave() {
    try {
      const res = await fetch(`/api/admin/vk/${vkId}/candidates`, {
        method: 'POST',
        body: JSON.stringify({ userIds: selectedUserIds })
      })

      if (res.ok) {
        const data = await res.json()
        showSuccess(`Pridaných ${data.count} uchádzačov`)
        onSuccess() // Tell parent to refresh
        onClose()   // Tell parent to close modal
      } else {
        const data = await res.json()
        showError(data.error)
      }
    } catch (error) {
      showError('Chyba pri pridávaní')
    }
  }

  return (
    <div>
      {/* Modal content */}
      <button onClick={handleSave}>Uložiť</button>
      <button onClick={onClose}>Zrušiť</button>
    </div>
  )
}
```

### Scenár 2: Table s inline editáciou

**Flow:**
1. Table zobrazí zoznam items
2. User klikne na "Edit" button
3. Table row sa zmení na edit mode
4. User upraví hodnotu a klikne "Save"
5. Table row zavolá API
6. Na success: Table refreshne dáta alebo optimisticky updatne local state

```typescript
function UsersTable() {
  const [users, setUsers] = useState([])
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleEditStart(userId: string) {
    setEditingId(userId)
  }

  async function handleEditSave(userId: string, newData: any) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(newData)
      })

      if (res.ok) {
        // Optimistic update
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, ...newData } : u
        ))
        setEditingId(null)
        showSuccess('Používateľ aktualizovaný')
      }
    } catch (error) {
      showError('Chyba pri ukladaní')
    }
  }

  return (
    <table>
      {users.map(user => (
        <UserRow
          key={user.id}
          user={user}
          isEditing={editingId === user.id}
          onEditStart={() => handleEditStart(user.id)}
          onEditSave={(newData) => handleEditSave(user.id, newData)}
          onEditCancel={() => setEditingId(null)}
        />
      ))}
    </table>
  )
}
```

### Scenár 3: Multi-step form

**Flow:**
1. User začne vyplňať formulár na step 1
2. Klikne "Ďalej" → prejde na step 2
3. Klikne "Späť" → vráti sa na step 1 (data zostanú zachované)
4. Na poslednom step klikne "Dokončiť" → odošle všetky dáta

```typescript
function MultiStepForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    step1: {},
    step2: {},
    step3: {}
  })

  function handleStepComplete(stepNumber: number, data: any) {
    setFormData(prev => ({
      ...prev,
      [`step${stepNumber}`]: data
    }))
    setStep(stepNumber + 1)
  }

  async function handleFinalSubmit() {
    // Combine all steps data
    const completeData = {
      ...formData.step1,
      ...formData.step2,
      ...formData.step3
    }

    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(completeData)
    })
  }

  return (
    <div>
      {step === 1 && (
        <Step1Form
          initialData={formData.step1}
          onComplete={(data) => handleStepComplete(1, data)}
        />
      )}
      {step === 2 && (
        <Step2Form
          initialData={formData.step2}
          onComplete={(data) => handleStepComplete(2, data)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Form
          initialData={formData.step3}
          onComplete={handleFinalSubmit}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  )
}
```

## Anti-patterns (čo NEROBIŤ)

### ❌ 1. Priame manipulovanie DOM

```typescript
// ❌ ZLÉ
function MyComponent() {
  function handleClick() {
    document.getElementById('modal').style.display = 'block'
  }
}

// ✅ DOBRÉ
function MyComponent() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && <Modal />}
    </>
  )
}
```

### ❌ 2. Global variables pre state

```typescript
// ❌ ZLÉ
let globalSelectedUsers = []

function MyComponent() {
  globalSelectedUsers.push(userId)
}

// ✅ DOBRÉ
function MyComponent() {
  const [selectedUsers, setSelectedUsers] = useState([])

  function addUser(userId) {
    setSelectedUsers(prev => [...prev, userId])
  }
}
```

### ❌ 3. Props drilling cez veľa úrovní

```typescript
// ❌ ZLÉ - passing same props through 5 levels
<Level1 userData={userData}>
  <Level2 userData={userData}>
    <Level3 userData={userData}>
      <Level4 userData={userData}>
        <Level5 userData={userData} />

// ✅ DOBRÉ - use Context API
const UserContext = createContext()

function App() {
  return (
    <UserContext.Provider value={userData}>
      <Level1>
        <Level2>
          <Level5 />
```

### ❌ 4. Mixing concerns v callback-och

```typescript
// ❌ ZLÉ - callback robí príliš veľa vecí
function handleSuccess() {
  closeModal()
  refreshData()
  showToast()
  logAnalytics()
  redirectToPage()
}

// ✅ DOBRÉ - každý callback má jednu zodpovednosť
function handleCandidateAdded() {
  refreshCandidates()
}

function handleModalClose() {
  setShowModal(false)
}
```

## Best Practices

### 1. Jednoznačné názvy callback funkcií

```typescript
// ✅ DOBRÉ
onUserDeleted()
onCandidateAdded()
onFormSubmitted()
onModalClosed()

// ❌ ZLÉ
doSomething()
handleIt()
callback1()
```

### 2. TypeScript typy pre props

```typescript
type ModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  children: ReactNode
}

function Modal({ isOpen, onClose, onSuccess, title, children }: ModalProps) {
  // ...
}
```

### 3. Async/await s error handling

```typescript
async function handleSave() {
  try {
    setLoading(true)
    const res = await fetch('/api/endpoint', { method: 'POST' })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message)
    }

    const data = await res.json()
    onSuccess(data)
  } catch (error) {
    showError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### 4. Optimistic updates

```typescript
async function handleToggleActive(userId: string) {
  // Optimistically update UI
  setUsers(prev => prev.map(u =>
    u.id === userId ? { ...u, active: !u.active } : u
  ))

  try {
    await fetch(`/api/users/${userId}/toggle-active`, { method: 'POST' })
  } catch (error) {
    // Revert on error
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, active: !u.active } : u
    ))
    showError('Nepodarilo sa aktualizovať')
  }
}
```

## Súvisiace dokumenty

- [Systém notifikácií](./19-notifications-system.md) - Toast messages a user feedback
- [API konvencie](./api-conventions.md) - Pravidlá pre API routes (ak existuje)
- [State management](./state-management.md) - Detailnejšie info o state (ak existuje)

## Debugging komunikácie

### React DevTools

```typescript
// Add displayName to components for easier debugging
MyComponent.displayName = 'MyComponent'

// Log props in development
if (process.env.NODE_ENV === 'development') {
  console.log('MyComponent props:', props)
}
```

### Console logging callbacks

```typescript
function ParentComponent() {
  function handleSuccess(data: any) {
    console.log('[ParentComponent] handleSuccess called with:', data)
    // ... rest of logic
  }

  return <ChildComponent onSuccess={handleSuccess} />
}
```

## Zhrnutie

| Pattern | Použitie | Príklad |
|---------|----------|---------|
| Props | Parent → Child data | `<Modal title="Hello" />` |
| Callbacks | Child → Parent events | `<Modal onClose={() => ...} />` |
| Context | Global state | `const { user } = useAuth()` |
| URL Params | Shareable state | `?page=2&search=test` |
| API Routes | Client ↔ Server | `fetch('/api/users')` |
