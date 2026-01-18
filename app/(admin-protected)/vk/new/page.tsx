'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowRightIcon, DocumentIcon, CloudArrowUpIcon, PencilSquareIcon, CalendarIcon, ClockIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/24/solid'

type User = {
  id: string
  name: string
  surname: string
  role: string
}

type GestorOption = {
  value: string
  label: string
}

// Commission member types
type CommissionRole = 'PREDSEDA' | 'CLEN' | 'NAHRADNIK' | null

type CommissionMember = {
  id: string
  name: string
  department: string
  info: string
  role: CommissionRole
}

// Available users for selection (dummy data)
const AVAILABLE_USERS: Omit<CommissionMember, 'role'>[] = [
  { id: '1', name: 'Jozef Kováč', department: 'Odbor personálnej politiky', info: '' },
  { id: '2', name: 'Mária Horvátová', department: 'Oddelenie implementácie projektov', info: '' },
  { id: '3', name: 'Peter Novotný', department: 'IT oddelenie – správa sietí a infraštruktúry', info: '' },
  { id: '4', name: 'Lucia Benková', department: 'Oddelenie interného auditu a kontroly', info: '' },
  { id: '5', name: 'Juraj Hronček', department: 'Odbor verejného obstarávania', info: '' },
  { id: '6', name: 'Katarína Šimková', department: 'Odbor právnych služieb', info: '' },
  { id: '7', name: 'Martin Polák', department: 'Oddelenie technickej podpory a správy IT', info: '' },
  { id: '8', name: 'Anna Kučerová', department: 'Odbor strategického plánovania', info: '' },
  { id: '9', name: 'Tomáš Zelený', department: 'Oddelenie medzinárodnej spolupráce', info: '' },
  { id: '10', name: 'Eva Malá', department: 'Odbor komunikácie a marketingu', info: '' },
]

// Step definitions for the wizard
// Labels in sidebar vs main content title
const STEPS = [
  { id: 'hlavicka', label: 'Tvorba hlavičky', title: 'Vytvorenie hlavičky', number: 1 },
  { id: 'nastavenie', label: 'Všeobecné nastavenie', title: 'Všeobecné nastavenie', number: 2 },
  { id: 'komisia', label: 'Zostavenie komisie', title: 'Zostavenie komisie', number: 3 },
  { id: 'testy', label: 'Nastavenie testov', title: 'Nastavenie testov', number: 4 },
  { id: 'ustna', label: 'Nastavenie ústnej časti', title: 'Nastavenie ústnej časti', number: 5 },
  { id: 'uchadzaci', label: 'Import uchádzačov', title: 'Import uchádzačov', number: 6 },
]

export default function NewVKPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [gestors, setGestors] = useState<GestorOption[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    identifier: '',
    selectionType: '',
    organizationalUnit: '',
    serviceField: '',
    position: '',
    serviceType: '',
    startDateTime: null as Date | null,
    numberOfPositions: 1,
    gestorId: null as GestorOption | null,
    // Step 2 fields
    eventDate: '',
    eventTime: '',
    room: '',
    additionalDates: [] as { date: string; time: string }[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 3: Commission members state
  const [commissionMembers, setCommissionMembers] = useState<CommissionMember[]>([])
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberModalPage, setMemberModalPage] = useState(1)
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null)

  // Step errors for sidebar display
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    fetchGestors()
  }, [])

  async function fetchGestors() {
    try {
      const res = await fetch('/api/admin/users?roles=GESTOR&status=active&limit=100')
      const data = await res.json()

      if (data.users) {
        const options: GestorOption[] = data.users.map((user: User) => ({
          value: user.id,
          label: `${user.name} ${user.surname}`,
        }))
        setGestors(options)
      }
    } catch (error) {
      console.error('Failed to fetch gestors:', error)
    }
  }

  function validate() {
    const newErrors: Record<string, string> = {}
    const newStepErrors: Record<string, string[]> = {}

    // Validate step 1 - Hlavička
    const hlavickaErrors: string[] = []
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Identifikátor je povinný'
      hlavickaErrors.push('Chýba identifikátor VK')
    }
    if (!formData.selectionType.trim()) {
      newErrors.selectionType = 'Druh konania je povinný'
      hlavickaErrors.push('Chýba druh konania')
    }
    if (!formData.organizationalUnit.trim()) {
      newErrors.organizationalUnit = 'Organizačný útvar je povinný'
      hlavickaErrors.push('Chýba organizačný útvar')
    }
    if (!formData.serviceField.trim()) {
      newErrors.serviceField = 'Odbor je povinný'
      hlavickaErrors.push('Chýba odbor štátnej služby')
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Funkcia je povinná'
      hlavickaErrors.push('Chýba obsadzovaná funkcia')
    }
    if (formData.numberOfPositions < 1) {
      newErrors.numberOfPositions = 'Počet miest musí byť aspoň 1'
      hlavickaErrors.push('Neplatný počet miest')
    }
    if (hlavickaErrors.length > 0) {
      newStepErrors.hlavicka = hlavickaErrors
    }

    // Note: Other steps will be validated as they are implemented
    // Nastavenie errors would go here
    // Komisia errors would go here
    // etc.

    setErrors(newErrors)
    setStepErrors(newStepErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/admin/vk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          selectionType: formData.selectionType,
          organizationalUnit: formData.organizationalUnit,
          serviceField: formData.serviceField,
          position: formData.position,
          serviceType: formData.serviceType,
          startDateTime: formData.startDateTime?.toISOString(),
          numberOfPositions: formData.numberOfPositions,
          gestorId: formData.gestorId?.value || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Chyba pri vytváraní VK' })
        return
      }

      // Success - redirect to VK detail
      router.push(`/vk/${data.vk.id}`)
    } catch (error) {
      console.error('Failed to create VK:', error)
      setErrors({ general: 'Chyba pri vytváraní VK' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDraft() {
    setLoading(true)

    try {
      const res = await fetch('/api/admin/vk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier || `VK-DRAFT-${Date.now()}`,
          selectionType: formData.selectionType || 'Výberové konanie',
          organizationalUnit: formData.organizationalUnit || '',
          serviceField: formData.serviceField || '',
          position: formData.position || 'Rozpracované VK',
          serviceType: formData.serviceType || '',
          startDateTime: formData.startDateTime?.toISOString() || new Date().toISOString(),
          numberOfPositions: formData.numberOfPositions || 1,
          gestorId: formData.gestorId?.value || null,
          status: 'PRIPRAVA',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Chyba pri ukladaní konceptu' })
        return
      }

      router.push(`/vk/${data.vk.id}`)
    } catch (error) {
      console.error('Failed to save draft:', error)
      setErrors({ general: 'Chyba pri ukladaní konceptu' })
    } finally {
      setLoading(false)
    }
  }

  // File upload handlers
  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        setUploadedFile(file)
        // TODO: Process PDF and extract data
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setUploadedFile(file)
        // TODO: Process PDF and extract data
      }
    }
  }

  function getStepStatus(stepId: string, index: number) {
    if (index < currentStep) return 'completed'
    if (index === currentStep) return 'current'
    return 'upcoming'
  }

  // Commission member functions
  function addCommissionMember(user: Omit<CommissionMember, 'role'>) {
    const newMember: CommissionMember = {
      ...user,
      role: null, // Default: no role selected
    }
    setCommissionMembers([...commissionMembers, newMember])
  }

  function removeCommissionMember(memberId: string) {
    setCommissionMembers(commissionMembers.filter(m => m.id !== memberId))
  }

  function setMemberRole(memberId: string, role: CommissionRole) {
    setCommissionMembers(prev => {
      // If setting to PREDSEDA, remove PREDSEDA from others
      let updated = prev.map(m => {
        if (role === 'PREDSEDA' && m.id !== memberId && m.role === 'PREDSEDA') {
          return { ...m, role: 'CLEN' as CommissionRole }
        }
        if (m.id === memberId) {
          return { ...m, role }
        }
        return m
      })

      // Sort: PREDSEDA first, then CLEN, then NAHRADNIK at the end
      return updated.sort((a, b) => {
        const order = { PREDSEDA: 0, CLEN: 1, NAHRADNIK: 2, null: 1 }
        const orderA = order[a.role ?? 'null'] ?? 1
        const orderB = order[b.role ?? 'null'] ?? 1
        return orderA - orderB
      })
    })
    setOpenRoleDropdown(null)
  }

  // Filter available users (not already selected)
  const availableUsersForModal = AVAILABLE_USERS.filter(
    user => !commissionMembers.some(m => m.id === user.id)
  )

  // Normalize text for diacritics-insensitive search
  function normalizeText(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  // Filter by search query (diacritics-insensitive)
  const filteredModalUsers = availableUsersForModal.filter(user => {
    if (memberSearchQuery === '') return true
    const normalizedQuery = normalizeText(memberSearchQuery)
    return (
      normalizeText(user.name).includes(normalizedQuery) ||
      normalizeText(user.department).includes(normalizedQuery)
    )
  })

  // Pagination for modal
  const ITEMS_PER_PAGE = 7
  const totalModalPages = Math.ceil(filteredModalUsers.length / ITEMS_PER_PAGE)
  const paginatedModalUsers = filteredModalUsers.slice(
    (memberModalPage - 1) * ITEMS_PER_PAGE,
    memberModalPage * ITEMS_PER_PAGE
  )

  // Get role badge style
  function getRoleBadgeStyle(role: CommissionRole) {
    switch (role) {
      case 'PREDSEDA':
        return 'bg-[#D1FAE5] text-[#065F46]' // Green
      case 'CLEN':
        return 'bg-[#F3F4F6] text-[#374151]' // Gray
      case 'NAHRADNIK':
        return 'bg-[#F3F4F6] text-[#374151]' // Gray
      default:
        return 'bg-ds-purple-10 text-ds-purple-80 border border-ds-purple-80' // Purple outline
    }
  }

  function getRoleLabel(role: CommissionRole) {
    switch (role) {
      case 'PREDSEDA':
        return 'Predseda'
      case 'CLEN':
        return 'Člen'
      case 'NAHRADNIK':
        return 'Náhradník'
      default:
        return 'Nastaviť rolu'
    }
  }

  return (
    <div data-testid="vk-new-page" className="flex flex-col h-[calc(100vh-56px)] bg-white">
      {/* Top Header with breadcrumb */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/vk"
            data-testid="back-button"
            className="w-10 h-10 flex items-center justify-center bg-ds-purple-80 text-white rounded-lg hover:bg-ds-purple-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <nav className="flex items-center gap-2 text-sm text-[#6A646B]">
            <Link href="/vk" className="hover:text-[#3F3840]">
              Domov
            </Link>
            <span>›</span>
            <span className="text-[#3F3840] font-medium">Vytvorenie výberového konania</span>
          </nav>
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={loading}
          data-testid="save-draft-button"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-ds-purple-80 text-ds-purple-80 rounded-[10px] text-sm font-medium hover:bg-[#F4EEFF] transition-colors disabled:opacity-50"
        >
          <DocumentIcon className="h-5 w-5" />
          Uložiť koncept
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div data-testid="process-sidebar" className="w-64 p-4 flex flex-col gap-4">
          {/* Proces tvorby box */}
          <div className="bg-[#F4F3F5] rounded-[15px] p-4">
            <div className="flex items-center gap-2">
              <PencilSquareIcon className="h-5 w-5 text-[#6A646B]" />
              <h2 className="text-sm font-medium text-[#3F3840]">Proces tvorby</h2>
            </div>
          </div>

          {/* Step navigation box */}
          <div className="bg-[#F4F3F5] rounded-[15px] p-4 flex-1">
            <nav>
              <ul className="space-y-1 relative">
                {STEPS.map((step, index) => {
                  const status = getStepStatus(step.id, index)
                  const hasErrors = stepErrors[step.id]?.length > 0
                  const isLastStep = index === STEPS.length - 1

                  return (
                    <li key={step.id} className="relative">
                      {/* Connecting line to next step */}
                      {!isLastStep && (
                        <div
                          className={`absolute left-[17px] top-6 h-[calc(100%)] ${
                            index < currentStep
                              ? 'w-0.5 bg-[#4ADE80]'
                              : 'border-l-2 border-dashed border-[#D1D5DB]'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <button
                        onClick={() => setCurrentStep(index)}
                        data-testid={`step-${step.id}`}
                        className="w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-white/50"
                      >
                        <div className="flex-shrink-0 mt-1.5 relative z-10">
                          {hasErrors ? (
                            <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                          ) : (
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                status === 'current' || index < currentStep
                                  ? 'bg-[#4ADE80]'
                                  : 'bg-[#D1D5DB]'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`block text-sm ${
                              status === 'current'
                                ? 'font-semibold text-[#4ADE80]'
                                : hasErrors
                                ? 'font-medium text-red-600'
                                : index < currentStep
                                ? 'font-medium text-[#3F3840]'
                                : 'font-medium text-[#9CA3AF]'
                            }`}
                          >
                            {step.label}
                          </span>
                          {/* Show errors under each step */}
                          {hasErrors && (
                            <ul className="mt-1 space-y-0.5">
                              {stepErrors[step.id].map((error, errorIndex) => (
                                <li
                                  key={errorIndex}
                                  className="text-xs text-red-500"
                                  data-testid={`step-error-${step.id}-${errorIndex}`}
                                >
                                  • {error}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit}>
            {/* Step Title with separator */}
            <div className="mb-6 pb-4 border-b border-[#EAE9EA]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[#4ADE80] text-white rounded-lg flex items-center justify-center text-sm font-medium">
                  {currentStep + 1}
                </span>
                <h1 data-testid="page-title" className="text-2xl font-medium text-[#3F3840]">
                  {STEPS[currentStep].title}
                </h1>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" data-testid="general-error">
                {errors.general}
              </div>
            )}

            {/* Step 1: Hlavička */}
            {currentStep === 0 && (
              <div className="space-y-8">
                {/* PDF Upload Section */}
                <div className="bg-white rounded-[15px] p-6 border border-[#EAE9EA]">
                  <h2 className="text-sm font-medium text-[#3F3840] mb-4">
                    Import hlavičky z dokumentu
                  </h2>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[15px] p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-ds-purple-80 bg-[#F4EEFF]'
                        : uploadedFile
                        ? 'border-green-500 bg-green-50'
                        : 'border-ds-purple-80 bg-white'
                    }`}
                    data-testid="pdf-upload-zone"
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                      data-testid="pdf-upload-input"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <CloudArrowUpIcon className="h-10 w-10 text-ds-purple-80 mb-3" />
                      {uploadedFile ? (
                        <>
                          <span className="text-sm font-medium text-green-600">
                            {uploadedFile.name}
                          </span>
                          <span className="text-xs text-[#6A646B] mt-1">
                            Kliknutím zmeníte súbor
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-ds-purple-80">
                            Vložte PDF súbor s údajmi o výberovom konaní
                          </span>
                          <span className="text-xs text-[#6A646B] mt-1">
                            Max. veľkosť: 50MB
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-[#EAE9EA]" />
                  <span className="text-sm text-[#6A646B]">alebo</span>
                  <div className="flex-1 border-t border-[#EAE9EA]" />
                </div>

                {/* Manual Entry Form */}
                <div className="bg-white rounded-[15px] p-6 border border-[#EAE9EA]">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Identifier */}
                    <div>
                      <label htmlFor="identifier" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Identifikátor výberového konania
                      </label>
                      <input
                        type="text"
                        id="identifier"
                        data-testid="identifier-input"
                        value={formData.identifier}
                        onChange={(e) => {
                          setFormData({ ...formData, identifier: e.target.value })
                          if (errors.identifier) setErrors({ ...errors, identifier: '' })
                        }}
                        placeholder=""
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.identifier ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.identifier && (
                        <p className="mt-1 text-sm text-red-600" data-testid="identifier-error">
                          {errors.identifier}
                        </p>
                      )}
                    </div>

                    {/* Selection Type */}
                    <div>
                      <label htmlFor="selectionType" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Druh výberového konania
                      </label>
                      <input
                        type="text"
                        id="selectionType"
                        data-testid="selection-type-input"
                        value={formData.selectionType}
                        onChange={(e) => {
                          setFormData({ ...formData, selectionType: e.target.value })
                          if (errors.selectionType) setErrors({ ...errors, selectionType: '' })
                        }}
                        placeholder="Vonkajšie výberové konanie"
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.selectionType ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.selectionType && (
                        <p className="mt-1 text-sm text-red-600" data-testid="selection-type-error">
                          {errors.selectionType}
                        </p>
                      )}
                    </div>

                    {/* Organizational Unit */}
                    <div>
                      <label htmlFor="organizationalUnit" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Organizačný útvar
                      </label>
                      <input
                        type="text"
                        id="organizationalUnit"
                        data-testid="organizational-unit-input"
                        value={formData.organizationalUnit}
                        onChange={(e) => {
                          setFormData({ ...formData, organizationalUnit: e.target.value })
                          if (errors.organizationalUnit) setErrors({ ...errors, organizationalUnit: '' })
                        }}
                        placeholder="IT špecialista"
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.organizationalUnit ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.organizationalUnit && (
                        <p className="mt-1 text-sm text-red-600" data-testid="organizational-unit-error">
                          {errors.organizationalUnit}
                        </p>
                      )}
                    </div>

                    {/* Service Field */}
                    <div>
                      <label htmlFor="serviceField" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Odbor štátnej služby
                      </label>
                      <input
                        type="text"
                        id="serviceField"
                        data-testid="service-field-input"
                        value={formData.serviceField}
                        onChange={(e) => {
                          setFormData({ ...formData, serviceField: e.target.value })
                          if (errors.serviceField) setErrors({ ...errors, serviceField: '' })
                        }}
                        placeholder="IT špecialista"
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.serviceField ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.serviceField && (
                        <p className="mt-1 text-sm text-red-600" data-testid="service-field-error">
                          {errors.serviceField}
                        </p>
                      )}
                    </div>

                    {/* Position */}
                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Obsadzovaná funkcia
                      </label>
                      <input
                        type="text"
                        id="position"
                        data-testid="position-input"
                        value={formData.position}
                        onChange={(e) => {
                          setFormData({ ...formData, position: e.target.value })
                          if (errors.position) setErrors({ ...errors, position: '' })
                        }}
                        placeholder="1.03 - Medzinárodná spolupráca"
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.position ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.position && (
                        <p className="mt-1 text-sm text-red-600" data-testid="position-error">
                          {errors.position}
                        </p>
                      )}
                    </div>

                    {/* Number of Positions */}
                    <div>
                      <label htmlFor="numberOfPositions" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Počet obsadzovaných štátnozamestnaneckých miest
                      </label>
                      <input
                        type="number"
                        id="numberOfPositions"
                        data-testid="number-of-positions-input"
                        min="1"
                        value={formData.numberOfPositions}
                        onChange={(e) => {
                          setFormData({ ...formData, numberOfPositions: parseInt(e.target.value) || 1 })
                          if (errors.numberOfPositions) setErrors({ ...errors, numberOfPositions: '' })
                        }}
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.numberOfPositions ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.numberOfPositions && (
                        <p className="mt-1 text-sm text-red-600" data-testid="number-of-positions-error">
                          {errors.numberOfPositions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Všeobecné nastavenie */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-white rounded-[15px] p-6 border border-[#EAE9EA]">
                  <div className="max-w-sm mx-auto space-y-6">
                    {/* Event Date and Time - side by side */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="eventDate" className="block text-sm font-medium text-[#3F3840] mb-2">
                          Dátum
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="eventDate"
                            data-testid="event-date-input"
                            value={formData.eventDate}
                            onChange={(e) => {
                              setFormData({ ...formData, eventDate: e.target.value })
                              if (errors.eventDate) setErrors({ ...errors, eventDate: '' })
                            }}
                            placeholder="DD.MM.RRRR"
                            className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                              errors.eventDate ? 'border-red-500' : 'border-[#EAE9EA]'
                            }`}
                          />
                          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6A646B] pointer-events-none" />
                        </div>
                        {errors.eventDate && (
                          <p className="mt-1 text-sm text-red-600" data-testid="event-date-error">
                            {errors.eventDate}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="eventTime" className="block text-sm font-medium text-[#3F3840] mb-2">
                          Čas
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="eventTime"
                            data-testid="event-time-input"
                            value={formData.eventTime}
                            onChange={(e) => {
                              setFormData({ ...formData, eventTime: e.target.value })
                              if (errors.eventTime) setErrors({ ...errors, eventTime: '' })
                            }}
                            placeholder="HH:MM"
                            className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                              errors.eventTime ? 'border-red-500' : 'border-[#EAE9EA]'
                            }`}
                          />
                          <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6A646B] pointer-events-none" />
                        </div>
                        {errors.eventTime && (
                          <p className="mt-1 text-sm text-red-600" data-testid="event-time-error">
                            {errors.eventTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Add another date link */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          additionalDates: [...formData.additionalDates, { date: '', time: '' }]
                        })
                      }}
                      className="inline-flex items-center gap-2 text-sm text-ds-purple-80 hover:text-ds-purple-100 font-medium"
                      data-testid="add-date-button"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Pridať termín
                    </button>

                    {/* Additional dates */}
                    {formData.additionalDates.map((additionalDate, index) => (
                      <div key={index} className="p-4 bg-[#F9F9F9] rounded-[10px] space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-[#3F3840]">Ďalší termín {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = formData.additionalDates.filter((_, i) => i !== index)
                              setFormData({ ...formData, additionalDates: newDates })
                            }}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Odstrániť
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#3F3840] mb-2">Dátum</label>
                            <input
                              type="text"
                              value={additionalDate.date}
                              onChange={(e) => {
                                const newDates = [...formData.additionalDates]
                                newDates[index].date = e.target.value
                                setFormData({ ...formData, additionalDates: newDates })
                              }}
                              placeholder="DD.MM.RRRR"
                              className="w-full px-4 py-2.5 border border-[#EAE9EA] rounded-[10px] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80"
                              data-testid={`additional-date-${index}-input`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#3F3840] mb-2">Čas</label>
                            <input
                              type="text"
                              value={additionalDate.time}
                              onChange={(e) => {
                                const newDates = [...formData.additionalDates]
                                newDates[index].time = e.target.value
                                setFormData({ ...formData, additionalDates: newDates })
                              }}
                              placeholder="HH:MM"
                              className="w-full px-4 py-2.5 border border-[#EAE9EA] rounded-[10px] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80"
                              data-testid={`additional-time-${index}-input`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Room */}
                    <div>
                      <label htmlFor="room" className="block text-sm font-medium text-[#3F3840] mb-2">
                        Miestnosť
                      </label>
                      <input
                        type="text"
                        id="room"
                        data-testid="room-input"
                        value={formData.room}
                        onChange={(e) => {
                          setFormData({ ...formData, room: e.target.value })
                          if (errors.room) setErrors({ ...errors, room: '' })
                        }}
                        placeholder="Napr. Zasadacia miestnosť A"
                        className={`w-full px-4 py-2.5 border rounded-[10px] bg-[#F9F9F9] text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80 ${
                          errors.room ? 'border-red-500' : 'border-[#EAE9EA]'
                        }`}
                      />
                      {errors.room && (
                        <p className="mt-1 text-sm text-red-600" data-testid="room-error">
                          {errors.room}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Zostavenie komisie */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Header with Add button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearchQuery('')
                      setMemberModalPage(1)
                      setShowMemberModal(true)
                    }}
                    data-testid="add-member-button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#EAE9EA] text-[#3F3840] rounded-[10px] text-sm font-medium hover:bg-[#F9F9F9] transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Pridať člena komisie
                  </button>
                </div>

                {/* Commission members table or empty state */}
                {commissionMembers.length === 0 ? (
                  <div className="bg-[#FEF3C7] rounded-[15px] p-6 border border-[#F59E0B]" data-testid="empty-commission-warning">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-6 w-6 text-[#D97706] flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-[#92400E]">Komisia nemá žiadnych členov</h3>
                        <p className="mt-1 text-sm text-[#B45309]">
                          Pridajte aspoň jedného člena do komisie pre pokračovanie vo vytváraní výberového konania.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberSearchQuery('')
                            setMemberModalPage(1)
                            setShowMemberModal(true)
                          }}
                          data-testid="empty-add-member-button"
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#D97706] text-white rounded-[10px] text-sm font-medium hover:bg-[#B45309] transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Pridať člena komisie
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[15px] border border-[#EAE9EA]" data-testid="commission-table">
                    <table className="w-full">
                      <tbody>
                        {commissionMembers.map((member) => (
                          <tr key={member.id} className="border-b border-[#EAE9EA] last:border-b-0" data-testid={`commission-member-${member.id}`}>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-[#3F3840]" data-testid={`member-name-${member.id}`}>
                                {member.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <a
                                href="#"
                                className="text-sm text-ds-purple-80 underline hover:text-ds-purple-100"
                                data-testid={`member-department-${member.id}`}
                              >
                                {member.department}
                              </a>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-[#6A646B]" data-testid={`member-info-${member.id}`}>
                                {member.info || 'info'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenRoleDropdown(openRoleDropdown === member.id ? null : member.id)}
                                  data-testid={`member-role-button-${member.id}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${getRoleBadgeStyle(member.role)}`}
                                >
                                  {getRoleLabel(member.role)}
                                  {!member.role && <ChevronDownIcon className="h-4 w-4" />}
                                </button>
                                {/* Role dropdown */}
                                {openRoleDropdown === member.id && (
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#EAE9EA] rounded-[10px] shadow-lg z-10" data-testid={`member-role-dropdown-${member.id}`}>
                                    <button
                                      type="button"
                                      onClick={() => setMemberRole(member.id, 'PREDSEDA')}
                                      className="w-full px-4 py-2 text-left text-sm text-[#3F3840] hover:bg-[#F9F9F9] first:rounded-t-[10px]"
                                      data-testid={`role-option-predseda-${member.id}`}
                                    >
                                      Predseda
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMemberRole(member.id, 'CLEN')}
                                      className="w-full px-4 py-2 text-left text-sm text-[#3F3840] hover:bg-[#F9F9F9]"
                                      data-testid={`role-option-clen-${member.id}`}
                                    >
                                      Člen
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setMemberRole(member.id, 'NAHRADNIK')}
                                      className="w-full px-4 py-2 text-left text-sm text-[#3F3840] hover:bg-[#F9F9F9] last:rounded-b-[10px]"
                                      data-testid={`role-option-nahradnik-${member.id}`}
                                    >
                                      Náhradník
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => removeCommissionMember(member.id)}
                                data-testid={`remove-member-${member.id}`}
                                className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Other steps placeholder (Step 4, 5, 6) */}
            {currentStep > 2 && (
              <div className="bg-white rounded-[15px] p-12 border border-[#EAE9EA] text-center">
                <p className="text-[#6A646B]">
                  Táto časť bude implementovaná v ďalších krokoch.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  data-testid="back-step-button"
                  className="inline-flex items-center gap-2 px-8 py-3 border border-ds-purple-80 text-ds-purple-80 rounded-[10px] text-sm font-medium hover:bg-[#F4EEFF] transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  Ísť naspäť
                </button>
              )}
              <button
                type={currentStep === 0 ? 'submit' : 'button'}
                onClick={currentStep > 0 ? () => setCurrentStep(currentStep + 1) : undefined}
                disabled={loading}
                data-testid="continue-button"
                className="inline-flex items-center gap-2 px-8 py-3 bg-ds-purple-80 text-white rounded-[10px] text-sm font-medium hover:bg-ds-purple-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Spracovávam...' : 'Pokračovať'}
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Member Selection Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMemberModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-[15px] w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-xl" data-testid="member-modal">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE9EA]">
              <h2 className="text-lg font-medium text-[#3F3840]">Vyberte člena do komisie</h2>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="text-[#6A646B] hover:text-[#3F3840] transition-colors"
                data-testid="close-modal-button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4">
              <div className="relative max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Vyhľadávať členov"
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value)
                    setMemberModalPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#EAE9EA] rounded-[10px] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80"
                  data-testid="member-search-input"
                />
              </div>
            </div>

            {/* User list */}
            <div className="px-6 overflow-y-auto max-h-[400px]">
              {paginatedModalUsers.length === 0 ? (
                <div className="py-8 text-center text-[#6A646B]">
                  {memberSearchQuery ? 'Žiadni členovia nevyhovujú vyhľadávaniu' : 'Všetci dostupní členovia boli pridaní'}
                </div>
              ) : (
                <table className="w-full">
                  <tbody>
                    {paginatedModalUsers.map((user) => (
                      <tr key={user.id} className="border-b border-[#EAE9EA] last:border-b-0" data-testid={`available-user-${user.id}`}>
                        <td className="py-4">
                          <span className="text-sm font-medium text-[#3F3840]">
                            {user.name}
                          </span>
                        </td>
                        <td className="py-4">
                          <a
                            href="#"
                            className="text-sm text-ds-purple-80 underline hover:text-ds-purple-100"
                          >
                            {user.department}
                          </a>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-[#6A646B]">
                            {user.info || 'info'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              addCommissionMember(user)
                            }}
                            data-testid={`add-user-${user.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#EAE9EA] text-[#3F3840] rounded-[10px] text-sm font-medium hover:bg-[#F9F9F9] transition-colors"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Pridať člena
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalModalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#EAE9EA] flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setMemberModalPage(Math.max(1, memberModalPage - 1))}
                  disabled={memberModalPage === 1}
                  className="p-2 rounded-[10px] hover:bg-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="modal-prev-page"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-[#6A646B]" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalModalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalModalPages <= 5) {
                    pageNum = i + 1
                  } else if (memberModalPage <= 3) {
                    pageNum = i + 1
                  } else if (memberModalPage >= totalModalPages - 2) {
                    pageNum = totalModalPages - 4 + i
                  } else {
                    pageNum = memberModalPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setMemberModalPage(pageNum)}
                      className={`w-8 h-8 rounded-[10px] text-sm font-medium ${
                        pageNum === memberModalPage
                          ? 'bg-ds-purple-80 text-white'
                          : 'text-[#6A646B] hover:bg-[#F9F9F9]'
                      }`}
                      data-testid={`modal-page-${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {totalModalPages > 5 && memberModalPage < totalModalPages - 2 && (
                  <>
                    <span className="text-[#6A646B]">...</span>
                    <button
                      type="button"
                      onClick={() => setMemberModalPage(totalModalPages)}
                      className="w-8 h-8 rounded-[10px] text-sm font-medium text-[#6A646B] hover:bg-[#F9F9F9]"
                      data-testid={`modal-page-${totalModalPages}`}
                    >
                      {totalModalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setMemberModalPage(Math.min(totalModalPages, memberModalPage + 1))}
                  disabled={memberModalPage === totalModalPages}
                  className="p-2 rounded-[10px] hover:bg-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="modal-next-page"
                >
                  <ChevronRightIcon className="h-4 w-4 text-[#6A646B]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
