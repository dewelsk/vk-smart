'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type VK = {
  id: string
  identifier: string
  position: string
  institution: {
    code: string
    name: string
  }
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
    email: '',
    password: '',
    cisIdentifier: '',
    applicantEmail: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
        label: `${vk.identifier} - ${vk.position} (${vk.institution.code})`,
      }))

      setVks(vkOptions)
    } catch (error) {
      console.error('Failed to fetch VKs:', error)
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}

    if (!formData.vkId) newErrors.vk = 'Výberové konanie je povinné'
    if (!formData.name.trim()) newErrors.name = 'Meno je povinné'
    if (!formData.surname.trim()) newErrors.surname = 'Priezvisko je povinné'
    if (!formData.email.trim()) newErrors.email = 'Email je povinný'
    if (!formData.password) newErrors.password = 'Heslo je povinné'
    if (!formData.cisIdentifier.trim()) newErrors.cisIdentifier = 'CIS identifikátor je povinný'

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatná emailová adresa'
    }

    if (formData.applicantEmail && !/\S+@\S+\.\S+/.test(formData.applicantEmail)) {
      newErrors.applicantEmail = 'Neplatná emailová adresa'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // Step 1: Create user with UCHADZAC role
      const userRes = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          username: formData.cisIdentifier, // Use CIS as username
          password: formData.password,
          role: 'UCHADZAC',
          active: true,
          institutionIds: [],
        }),
      })

      if (!userRes.ok) {
        const error = await userRes.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const userData = await userRes.json()

      // Step 2: Create applicant
      const applicantRes = await fetch('/api/admin/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vkId: formData.vkId?.value,
          userId: userData.user.id,
          cisIdentifier: formData.cisIdentifier,
          email: formData.applicantEmail || null,
        }),
      })

      if (!applicantRes.ok) {
        const error = await applicantRes.json()
        throw new Error(error.error || 'Failed to create applicant')
      }

      // Success - redirect to applicants list
      router.push('/applicants')
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/applicants"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vytvoriť nového uchádzača</h1>
          <p className="mt-2 text-gray-600">
            Vyplňte údaje pre nového uchádzača
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow space-y-6">
        {/* VK Selection */}
        <div>
          <label htmlFor="vk" className="block text-sm font-medium text-gray-700 mb-2">
            Výberové konanie *
          </label>
          <Select
            id="vk"
            value={formData.vkId}
            onChange={(selected) => setFormData({ ...formData, vkId: selected })}
            options={vks}
            placeholder="Vyber výberové konanie..."
            className="basic-select"
            classNamePrefix="select"
          />
          {errors.vk && <p className="mt-1 text-sm text-red-600">{errors.vk}</p>}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Údaje používateľa</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Meno *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="napr. Ján"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Surname */}
            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
                Priezvisko *
              </label>
              <input
                type="text"
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="napr. Novák"
              />
              {errors.surname && <p className="mt-1 text-sm text-red-600">{errors.surname}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="jan.novak@example.sk"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Heslo *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Minimálne 8 znakov"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Údaje uchádzača</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CIS Identifier */}
            <div>
              <label htmlFor="cisIdentifier" className="block text-sm font-medium text-gray-700 mb-2">
                CIS Identifikátor *
              </label>
              <input
                type="text"
                id="cisIdentifier"
                name="cisIdentifier"
                value={formData.cisIdentifier}
                onChange={(e) => setFormData({ ...formData, cisIdentifier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="napr. CIS123456"
              />
              {errors.cisIdentifier && <p className="mt-1 text-sm text-red-600">{errors.cisIdentifier}</p>}
            </div>

            {/* Applicant Email (optional) */}
            <div>
              <label htmlFor="applicantEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Alternatívny email uchádzača
              </label>
              <input
                type="email"
                id="applicantEmail"
                name="applicantEmail"
                value={formData.applicantEmail}
                onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="voliteľné"
              />
              {errors.applicantEmail && <p className="mt-1 text-sm text-red-600">{errors.applicantEmail}</p>}
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Link
            href="/applicants"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Zrušiť
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Vytváram...' : 'Vytvoriť uchádzača'}
          </button>
        </div>
      </form>
    </div>
  )
}
