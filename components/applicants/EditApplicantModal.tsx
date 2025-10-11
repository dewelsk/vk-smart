'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'

type EditApplicantModalProps = {
  open: boolean
  onClose: () => void
  applicant: {
    id: string
    name: string
    surname: string
    cisIdentifier: string
    email: string
    phone: string
    active: boolean
  }
  onUpdated: () => void | Promise<void>
}

export default function EditApplicantModal({ open, onClose, applicant, onUpdated }: EditApplicantModalProps) {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)
  const [pin, setPin] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setSaving] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const surnameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(applicant.name)
      setSurname(applicant.surname)
      setEmail(applicant.email)
      setPhone(applicant.phone)
      setActive(applicant.active)
      setPin('')
      setErrors({})
      setSaving(false)
    }
  }, [open, applicant])

  if (!open) {
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Meno je povinné'
    }

    if (!surname.trim()) {
      newErrors.surname = 'Priezvisko je povinné'
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Neplatná emailová adresa'
    }

    setErrors(newErrors)

    // Auto-scroll to first error
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name) {
        nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.surname) {
        surnameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (newErrors.email) {
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
      const response = await fetch(`/api/admin/applicants/${applicant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          surname,
          email: email || null,
          phone: phone || null,
          active,
          pin: pin || undefined,
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

      toast.success('Údaje boli uložené')
      await onUpdated()
      onClose()
    } catch (error) {
      console.error('Edit applicant error:', error)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" data-testid="edit-applicant-modal">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upraviť uchádzača</h2>
            <p className="text-sm text-gray-600">Upravte základné údaje uchádzača</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Zatvoriť"
            data-testid="close-button"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-6 py-6 overflow-y-auto">
          {/* CIS Identifier (read-only) */}
          <div>
            <label htmlFor="cis-identifier-display" className="block text-sm font-medium text-gray-700 mb-2">
              CIS Identifikátor
            </label>
            <input
              id="cis-identifier-display"
              data-testid="cis-identifier-display"
              type="text"
              value={applicant.cisIdentifier}
              disabled
              className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">CIS identifikátor sa nedá zmeniť</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-2">
              Meno <span className="text-red-600">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="name-input"
              data-testid="name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: undefined! })
              }}
              className={`block w-full rounded-md border ${
                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.name ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600" data-testid="name-error">
                {errors.name}
              </p>
            )}
          </div>

          {/* Surname */}
          <div>
            <label htmlFor="surname-input" className="block text-sm font-medium text-gray-700 mb-2">
              Priezvisko <span className="text-red-600">*</span>
            </label>
            <input
              ref={surnameInputRef}
              id="surname-input"
              data-testid="surname-input"
              type="text"
              value={surname}
              onChange={(e) => {
                setSurname(e.target.value)
                if (errors.surname) setErrors({ ...errors, surname: undefined! })
              }}
              className={`block w-full rounded-md border ${
                errors.surname ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.surname ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
            />
            {errors.surname && (
              <p className="mt-2 text-sm text-red-600" data-testid="surname-error">
                {errors.surname}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              ref={emailInputRef}
              id="email-input"
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: undefined! })
              }}
              className={`block w-full rounded-md border ${
                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
              } px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                errors.email ? 'focus:ring-red-200' : 'focus:ring-blue-200'
              }`}
              disabled={isSaving}
              placeholder="jan.novak@example.sk"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600" data-testid="email-error">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-2">
              Telefón
            </label>
            <input
              id="phone-input"
              data-testid="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isSaving}
              placeholder="+421 900 123 456"
            />
          </div>

          {/* Password (optional password change) */}
          <div>
            <label htmlFor="pin-input" className="block text-sm font-medium text-gray-700 mb-2">
              Nové heslo
            </label>
            <input
              id="pin-input"
              data-testid="pin-input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isSaving}
              placeholder="Nechajte prázdne ak nechcete meniť"
            />
            <p className="mt-1 text-xs text-gray-500">Nechajte prázdne ak nechcete zmeniť heslo</p>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="active-checkbox"
              data-testid="active-checkbox"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isSaving}
            />
            <label htmlFor="active-checkbox" className="text-sm text-gray-700">
              Aktívny používateľ
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-white">
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
