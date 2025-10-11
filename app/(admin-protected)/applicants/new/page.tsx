'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

type VK = {
  id: string
  identifier: string
  position: string
}

type VKOption = {
  value: string
  label: string
}

export default function NewApplicantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vks, setVks] = useState<VKOption[]>([])
  const [formData, setFormData] = useState({
    vkId: null as VKOption | null,
    name: '',
    surname: '',
    cisIdentifier: '',
    pin: '',
    email: '',
    phone: '',
    birthDate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Refs for auto-scroll
  const vkRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const surnameRef = useRef<HTMLInputElement>(null)
  const cisIdentifierRef = useRef<HTMLInputElement>(null)
  const pinRef = useRef<HTMLInputElement>(null)

  // Fetch VKs
  useEffect(() => {
    fetchVKs()
  }, [])

  async function fetchVKs() {
    try {
      const res = await fetch('/api/admin/vk?limit=1000')
      if (!res.ok) throw new Error('Failed to fetch VKs')

      const data = await res.json()
      const vkOptions = data.vks.map((vk: VK) => ({
        value: vk.id,
        label: `${vk.identifier} - ${vk.position}`,
      }))

      setVks(vkOptions)
    } catch (error) {
      console.error('Failed to fetch VKs:', error)
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.vkId) newErrors.vk = 'Výberové konanie je povinné'
    if (!formData.name.trim()) newErrors.name = 'Meno je povinné'
    if (!formData.surname.trim()) newErrors.surname = 'Priezvisko je povinné'
    if (!formData.cisIdentifier.trim()) newErrors.cisIdentifier = 'CIS identifikátor je povinný'

    // Email validation (optional)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatná emailová adresa'
    }

    setErrors(newErrors)

    // Auto-scroll to first error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      if (firstErrorField === 'vk') vkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else if (firstErrorField === 'name') nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else if (firstErrorField === 'surname') surnameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else if (firstErrorField === 'cisIdentifier') cisIdentifierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else if (firstErrorField === 'pin') pinRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    toast.loading('Vytváram uchádzača...')

    try {
      const response = await fetch('/api/admin/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vkId: formData.vkId?.value,
          cisIdentifier: formData.cisIdentifier,
          pin: formData.pin || undefined,
          name: formData.name,
          surname: formData.surname,
          email: formData.email || null,
          phone: formData.phone || null,
          birthDate: formData.birthDate || null,
        }),
      })

      toast.dismiss()

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nepodarilo sa vytvoriť uchádzača')
      }

      toast.success('Uchádzač úspešne vytvorený')
      router.push('/applicants')
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message)
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="new-applicant-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/applicants"
          data-testid="back-button"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">Vytvoriť nového uchádzača</h1>
          <p className="mt-2 text-gray-600">
            Vyplňte údaje pre nového uchádzača
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
        {/* VK Selection */}
        <div ref={vkRef}>
          <label htmlFor="vk" className="block text-sm font-medium text-gray-700 mb-2">
            Výberové konanie *
          </label>
          <Select
            inputId="vk-select"
            value={formData.vkId}
            onChange={(selected) => {
              setFormData({ ...formData, vkId: selected })
              if (errors.vk) setErrors({ ...errors, vk: undefined! })
            }}
            options={vks}
            placeholder="Vyber výberové konanie..."
            className={`basic-select ${errors.vk ? 'border-red-500' : ''}`}
            classNamePrefix="select"
          />
          {errors.vk && <p className="mt-2 text-sm text-red-600" data-testid="vk-error">{errors.vk}</p>}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Základné údaje</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Meno *
              </label>
              <input
                ref={nameRef}
                type="text"
                id="name"
                data-testid="name-input"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: undefined! })
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                }`}
                placeholder="napr. Ján"
              />
              {errors.name && <p className="mt-2 text-sm text-red-600" data-testid="name-error">{errors.name}</p>}
            </div>

            {/* Surname */}
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
                Priezvisko *
              </label>
              <input
                ref={surnameRef}
                type="text"
                id="surname"
                data-testid="surname-input"
                value={formData.surname}
                onChange={(e) => {
                  setFormData({ ...formData, surname: e.target.value })
                  if (errors.surname) setErrors({ ...errors, surname: undefined! })
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.surname ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                }`}
                placeholder="napr. Novák"
              />
              {errors.surname && <p className="mt-2 text-sm text-red-600" data-testid="surname-error">{errors.surname}</p>}
            </div>

            {/* CIS Identifier */}
            <div>
              <label htmlFor="cisIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                CIS Identifikátor *
              </label>
              <input
                ref={cisIdentifierRef}
                type="text"
                id="cisIdentifier"
                data-testid="cis-identifier-input"
                value={formData.cisIdentifier}
                onChange={(e) => {
                  setFormData({ ...formData, cisIdentifier: e.target.value })
                  if (errors.cisIdentifier) setErrors({ ...errors, cisIdentifier: undefined! })
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cisIdentifier ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                }`}
                placeholder="napr. CIS123456"
              />
              {errors.cisIdentifier && <p className="mt-2 text-sm text-red-600" data-testid="cis-identifier-error">{errors.cisIdentifier}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                Heslo
              </label>
              <input
                ref={pinRef}
                type="password"
                id="pin"
                data-testid="pin-input"
                value={formData.pin}
                onChange={(e) => {
                  setFormData({ ...formData, pin: e.target.value })
                  if (errors.pin) setErrors({ ...errors, pin: undefined! })
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.pin ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                }`}
                placeholder="Voliteľné"
              />
              {errors.pin && <p className="mt-2 text-sm text-red-600" data-testid="pin-error">{errors.pin}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                data-testid="email-input"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) setErrors({ ...errors, email: undefined! })
                }}
                className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300'
                }`}
                placeholder="jan.novak@example.sk"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600" data-testid="email-error">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefón
              </label>
              <input
                type="tel"
                id="phone"
                data-testid="phone-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+421 900 123 456"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                Dátum narodenia
              </label>
              <input
                type="date"
                id="birthDate"
                data-testid="birth-date-input"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md" data-testid="submit-error">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Link
            href="/applicants"
            data-testid="cancel-button"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Zrušiť
          </Link>
          <button
            type="submit"
            disabled={loading}
            data-testid="submit-button"
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Vytváram...' : 'Vytvoriť uchádzača'}
          </button>
        </div>
      </form>
    </div>
  )
}
