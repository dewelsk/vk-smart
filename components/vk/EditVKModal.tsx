'use client'

import { useState, useRef, useEffect } from 'react'
import Select from 'react-select'
import { toast } from 'react-hot-toast'
import DateTimePicker from '@/components/DateTimePicker'

type GestorOption = {
  value: string
  label: string
}

type EditVKModalProps = {
  open: boolean
  onClose: () => void
  vk: {
    id: string
    identifier: string
    selectionType: string
    organizationalUnit: string
    serviceField: string
    position: string
    serviceType: string
    startDateTime: string
    numberOfPositions: number
    gestorId: string | null
    status: string
  }
  onUpdated: () => void | Promise<void>
}

export function EditVKModal({ open, onClose, vk, onUpdated }: EditVKModalProps) {
  const [identifier, setIdentifier] = useState('')
  const [selectionType, setSelectionType] = useState('')
  const [organizationalUnit, setOrganizationalUnit] = useState('')
  const [serviceField, setServiceField] = useState('')
  const [position, setPosition] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [startDateTime, setStartDateTime] = useState<Date | null>(null)
  const [numberOfPositions, setNumberOfPositions] = useState(1)
  const [gestorId, setGestorId] = useState<GestorOption | null>(null)
  const [gestors, setGestors] = useState<GestorOption[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setSaving] = useState(false)

  const identifierInputRef = useRef<HTMLInputElement>(null)
  const selectionTypeInputRef = useRef<HTMLInputElement>(null)
  const organizationalUnitInputRef = useRef<HTMLInputElement>(null)
  const serviceFieldInputRef = useRef<HTMLInputElement>(null)
  const positionInputRef = useRef<HTMLInputElement>(null)
  const serviceTypeInputRef = useRef<HTMLInputElement>(null)
  const startDateTimeWrapperRef = useRef<HTMLDivElement>(null)
  const numberOfPositionsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Load VK data
      setIdentifier(vk.identifier)
      setSelectionType(vk.selectionType)
      setOrganizationalUnit(vk.organizationalUnit)
      setServiceField(vk.serviceField)
      setPosition(vk.position)
      setServiceType(vk.serviceType)
      setStartDateTime(new Date(vk.startDateTime))
      setNumberOfPositions(vk.numberOfPositions)
      setErrors({})
      setSaving(false)

      // Fetch gestors
      fetchGestors()
    }
  }, [open, vk])

  async function fetchGestors() {
    try {
      const res = await fetch('/api/admin/users?roles=GESTOR&status=active&limit=100')
      const data = await res.json()

      if (data.users) {
        const options: GestorOption[] = data.users.map((user: any) => ({
          value: user.id,
          label: `${user.name} ${user.surname}`,
        }))
        setGestors(options)

        // Set current gestor if exists
        if (vk.gestorId) {
          const currentGestor = options.find(g => g.value === vk.gestorId)
          setGestorId(currentGestor || null)
        } else {
          setGestorId(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch gestors:', error)
    }
  }

  if (!open) {
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!identifier.trim()) {
      newErrors.identifier = 'Identifikátor je povinný'
    }

    if (!selectionType.trim()) {
      newErrors.selectionType = 'Druh konania je povinný'
    }

    if (!organizationalUnit.trim()) {
      newErrors.organizationalUnit = 'Organizačný útvar je povinný'
    }

    if (!serviceField.trim()) {
      newErrors.serviceField = 'Odbor je povinný'
    }

    if (!position.trim()) {
      newErrors.position = 'Pozícia je povinná'
    }

    if (!serviceType.trim()) {
      newErrors.serviceType = 'Druh štátnej služby je povinný'
    }

    if (!startDateTime) {
      newErrors.startDateTime = 'Dátum a čas začiatku je povinný'
    }

    if (numberOfPositions < 1) {
      newErrors.numberOfPositions = 'Počet miest musí byť aspoň 1'
    }

    setErrors(newErrors)

    // Auto-scroll to first error
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.identifier) {
        identifierInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.selectionType) {
        selectionTypeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.organizationalUnit) {
        organizationalUnitInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.serviceField) {
        serviceFieldInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.position) {
        positionInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.serviceType) {
        serviceTypeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.startDateTime) {
        startDateTimeWrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.numberOfPositions) {
        numberOfPositionsInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Skontrolujte chyby vo formulári')
      return
    }

    setSaving(true)
    toast.loading('Ukladám zmeny...')

    try {
      const response = await fetch(`/api/admin/vk/${vk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          selectionType,
          organizationalUnit,
          serviceField,
          position,
          serviceType,
          startDateTime: startDateTime?.toISOString(),
          numberOfPositions,
          gestorId: gestorId?.value || null,
        }),
      })

      const data = await response.json()
      toast.dismiss()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
          toast.error('Skontrolujte chyby vo formulári')
        } else {
          toast.error(data.error || 'Nepodarilo sa uložiť zmeny')
        }
        return
      }

      toast.success('Výberové konanie bolo upravené')
      await onUpdated()
      onClose()
    } catch (error) {
      console.error('Edit VK error:', error)
      toast.dismiss()
      toast.error('Nepodarilo sa uložiť zmeny')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) {
      return
    }
    onClose()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" data-testid="edit-vk-modal">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900" data-testid="modal-title">Upraviť výberové konanie</h2>
            <p className="text-sm text-gray-600">Upravte základné údaje výberového konania</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Zatvoriť"
            data-testid="close-modal-button"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {/* Identifier */}
          <div>
            <label htmlFor="identifier-input" className="block text-sm font-medium text-gray-700 mb-2">
              Identifikátor <span className="text-red-600">*</span>
            </label>
            <input
              ref={identifierInputRef}
              id="identifier-input"
              data-testid="identifier-input"
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value)
                if (errors.identifier) setErrors({ ...errors, identifier: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.identifier ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.identifier ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.identifier && (
              <p className="mt-2 text-sm text-red-600" data-testid="identifier-error">
                {errors.identifier}
              </p>
            )}
          </div>

          {/* Selection Type */}
          <div>
            <label htmlFor="selectionType-input" className="block text-sm font-medium text-gray-700 mb-2">
              Druh konania <span className="text-red-600">*</span>
            </label>
            <input
              ref={selectionTypeInputRef}
              id="selectionType-input"
              data-testid="selection-type-input"
              type="text"
              value={selectionType}
              onChange={(e) => {
                setSelectionType(e.target.value)
                if (errors.selectionType) setErrors({ ...errors, selectionType: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.selectionType ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.selectionType ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.selectionType && (
              <p className="mt-2 text-sm text-red-600" data-testid="selectionType-error">
                {errors.selectionType}
              </p>
            )}
          </div>

          {/* Organizational Unit */}
          <div>
            <label htmlFor="organizationalUnit-input" className="block text-sm font-medium text-gray-700 mb-2">
              Organizačný útvar <span className="text-red-600">*</span>
            </label>
            <input
              ref={organizationalUnitInputRef}
              id="organizationalUnit-input"
              data-testid="organizational-unit-input"
              type="text"
              value={organizationalUnit}
              onChange={(e) => {
                setOrganizationalUnit(e.target.value)
                if (errors.organizationalUnit) setErrors({ ...errors, organizationalUnit: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.organizationalUnit ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.organizationalUnit ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.organizationalUnit && (
              <p className="mt-2 text-sm text-red-600" data-testid="organizationalUnit-error">
                {errors.organizationalUnit}
              </p>
            )}
          </div>

          {/* Service Field */}
          <div>
            <label htmlFor="serviceField-input" className="block text-sm font-medium text-gray-700 mb-2">
              Odbor <span className="text-red-600">*</span>
            </label>
            <input
              ref={serviceFieldInputRef}
              id="serviceField-input"
              data-testid="service-field-input"
              type="text"
              value={serviceField}
              onChange={(e) => {
                setServiceField(e.target.value)
                if (errors.serviceField) setErrors({ ...errors, serviceField: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.serviceField ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.serviceField ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.serviceField && (
              <p className="mt-2 text-sm text-red-600" data-testid="serviceField-error">
                {errors.serviceField}
              </p>
            )}
          </div>

          {/* Position */}
          <div>
            <label htmlFor="position-input" className="block text-sm font-medium text-gray-700 mb-2">
              Pozícia <span className="text-red-600">*</span>
            </label>
            <input
              ref={positionInputRef}
              id="position-input"
              data-testid="position-input"
              type="text"
              value={position}
              onChange={(e) => {
                setPosition(e.target.value)
                if (errors.position) setErrors({ ...errors, position: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.position ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.position ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.position && (
              <p className="mt-2 text-sm text-red-600" data-testid="position-error">
                {errors.position}
              </p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="serviceType-input" className="block text-sm font-medium text-gray-700 mb-2">
              Druh štátnej služby <span className="text-red-600">*</span>
            </label>
            <input
              ref={serviceTypeInputRef}
              id="serviceType-input"
              data-testid="service-type-input"
              type="text"
              value={serviceType}
              onChange={(e) => {
                setServiceType(e.target.value)
                if (errors.serviceType) setErrors({ ...errors, serviceType: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.serviceType ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.serviceType ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.serviceType && (
              <p className="mt-2 text-sm text-red-600" data-testid="serviceType-error">
                {errors.serviceType}
              </p>
            )}
          </div>

          {/* Start DateTime */}
          <div ref={startDateTimeWrapperRef}>
            <label htmlFor="startDateTime-input" className="block text-sm font-medium text-gray-700 mb-2">
              Dátum a čas začiatku <span className="text-red-600">*</span>
            </label>
            <DateTimePicker
              value={startDateTime}
              onChange={(date) => {
                setStartDateTime(date)
                if (errors.startDateTime) {
                  setErrors({ ...errors, startDateTime: undefined })
                }
              }}
              error={errors.startDateTime}
              disabled={isSaving}
              data-testid="start-datetime-input"
              placeholder="Vyberte dátum a čas začiatku"
            />
          </div>

          {/* Number of Positions */}
          <div>
            <label htmlFor="numberOfPositions-input" className="block text-sm font-medium text-gray-700 mb-2">
              Počet miest <span className="text-red-600">*</span>
            </label>
            <input
              ref={numberOfPositionsInputRef}
              id="numberOfPositions-input"
              data-testid="number-of-positions-input"
              type="number"
              value={numberOfPositions}
              onChange={(e) => {
                const value = e.target.value === '' ? 1 : parseInt(e.target.value)
                setNumberOfPositions(value)
                if (errors.numberOfPositions) setErrors({ ...errors, numberOfPositions: undefined })
              }}
              className={`block w-full rounded-md border ${
                errors.numberOfPositions ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.numberOfPositions ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.numberOfPositions && (
              <p className="mt-2 text-sm text-red-600" data-testid="number-of-positions-error">
                {errors.numberOfPositions}
              </p>
            )}
          </div>

          {/* Gestor */}
          <div>
            <label htmlFor="gestor-select" className="block text-sm font-medium text-gray-700 mb-2">
              Gestor
            </label>
            <Select
              inputId="gestor-select"
              value={gestorId}
              onChange={(selected) => setGestorId(selected)}
              options={gestors}
              placeholder="Vyberte gestora (voliteľné)"
              isClearable
              isDisabled={isSaving}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            data-testid="cancel-button"
          >
            Zrušiť
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
              isSaving
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
            }`}
            data-testid="save-button"
          >
            {isSaving ? 'Ukladám...' : 'Uložiť'}
          </button>
        </div>
      </div>
    </div>
  )
}
