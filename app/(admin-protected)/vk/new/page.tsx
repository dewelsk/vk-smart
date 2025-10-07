'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type Institution = {
  id: string
  code: string
  name: string
}

type InstitutionOption = {
  value: string
  label: string
}

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

export default function NewVKPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([])
  const [gestors, setGestors] = useState<GestorOption[]>([])
  const [formData, setFormData] = useState({
    identifier: '',
    institutionId: null as InstitutionOption | null,
    selectionType: '',
    organizationalUnit: '',
    serviceField: '',
    position: '',
    serviceType: '',
    date: '',
    numberOfPositions: 1,
    gestorId: null as GestorOption | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchInstitutions()
    fetchGestors()
  }, [])

  async function fetchInstitutions() {
    try {
      const res = await fetch('/api/admin/institutions')
      const data = await res.json()

      if (data.institutions) {
        const options: InstitutionOption[] = data.institutions.map((inst: Institution) => ({
          value: inst.id,
          label: `${inst.code} - ${inst.name}`,
        }))
        setInstitutions(options)
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    }
  }

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

    if (!formData.identifier.trim()) newErrors.identifier = 'Identifikátor je povinný'
    if (!formData.institutionId) newErrors.institutionId = 'Rezort je povinný'
    if (!formData.selectionType.trim()) newErrors.selectionType = 'Druh konania je povinný'
    if (!formData.organizationalUnit.trim()) newErrors.organizationalUnit = 'Organizačný útvar je povinný'
    if (!formData.serviceField.trim()) newErrors.serviceField = 'Odbor je povinný'
    if (!formData.position.trim()) newErrors.position = 'Pozícia je povinná'
    if (!formData.serviceType.trim()) newErrors.serviceType = 'Druh štátnej služby je povinný'
    if (!formData.date) newErrors.date = 'Dátum je povinný'
    if (formData.numberOfPositions < 1) newErrors.numberOfPositions = 'Počet miest musí byť aspoň 1'

    setErrors(newErrors)
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
          institutionId: formData.institutionId!.value,
          selectionType: formData.selectionType,
          organizationalUnit: formData.organizationalUnit,
          serviceField: formData.serviceField,
          position: formData.position,
          serviceType: formData.serviceType,
          date: formData.date,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vk"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 id="page-title" data-testid="page-title" className="text-3xl font-bold text-gray-900">
            Vytvoriť výberové konanie
          </h1>
          <p className="mt-2 text-gray-600">
            Vytvorte nové výberové konanie
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
        <div className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Identifier */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
              Identifikátor VK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="identifier"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder="napr. VK/2025/1234"
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.identifier ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>}
          </div>

          {/* Institution */}
          <div>
            <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
              Rezort <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.institutionId}
              onChange={(selected) => setFormData({ ...formData, institutionId: selected })}
              options={institutions}
              placeholder="Vyberte rezort..."
              className="basic-select"
              classNamePrefix="select"
            />
            {errors.institutionId && <p className="mt-1 text-sm text-red-600">{errors.institutionId}</p>}
          </div>

          {/* Selection Type */}
          <div>
            <label htmlFor="selectionType" className="block text-sm font-medium text-gray-700 mb-2">
              Druh konania <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="selectionType"
              value={formData.selectionType}
              onChange={(e) => setFormData({ ...formData, selectionType: e.target.value })}
              placeholder="napr. Výberové konanie"
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.selectionType ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.selectionType && <p className="mt-1 text-sm text-red-600">{errors.selectionType}</p>}
          </div>

          {/* Organizational Unit */}
          <div>
            <label htmlFor="organizationalUnit" className="block text-sm font-medium text-gray-700 mb-2">
              Organizačný útvar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organizationalUnit"
              value={formData.organizationalUnit}
              onChange={(e) => setFormData({ ...formData, organizationalUnit: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.organizationalUnit ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.organizationalUnit && <p className="mt-1 text-sm text-red-600">{errors.organizationalUnit}</p>}
          </div>

          {/* Service Field */}
          <div>
            <label htmlFor="serviceField" className="block text-sm font-medium text-gray-700 mb-2">
              Odbor štátnej služby <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="serviceField"
              value={formData.serviceField}
              onChange={(e) => setFormData({ ...formData, serviceField: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.serviceField ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.serviceField && <p className="mt-1 text-sm text-red-600">{errors.serviceField}</p>}
          </div>

          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
              Funkcia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.position ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Druh štátnej služby <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.serviceType ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.serviceType && <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Dátum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Number of Positions */}
          <div>
            <label htmlFor="numberOfPositions" className="block text-sm font-medium text-gray-700 mb-2">
              Počet obsadzovaných miest <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="numberOfPositions"
              min="1"
              value={formData.numberOfPositions}
              onChange={(e) => setFormData({ ...formData, numberOfPositions: parseInt(e.target.value) || 1 })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.numberOfPositions ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.numberOfPositions && <p className="mt-1 text-sm text-red-600">{errors.numberOfPositions}</p>}
          </div>

          {/* Gestor */}
          <div>
            <label htmlFor="gestor" className="block text-sm font-medium text-gray-700 mb-2">
              Gestor (voliteľné)
            </label>
            <Select
              value={formData.gestorId}
              onChange={(selected) => setFormData({ ...formData, gestorId: selected })}
              options={gestors}
              placeholder="Vyberte gestora..."
              isClearable
              className="basic-select"
              classNamePrefix="select"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Vytváram...' : 'Vytvoriť VK'}
            </button>
            <Link
              href="/vk"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Zrušiť
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
