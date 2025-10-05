'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewInstitutionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    active: true,
  })

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Názov je povinný'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Názov môže mať maximálne 100 znakov'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Kód je povinný'
    } else if (formData.code.length > 10) {
      newErrors.code = 'Kód môže mať maximálne 10 znakov'
    } else if (!/^[A-Z0-9]+$/i.test(formData.code)) {
      newErrors.code = 'Kód môže obsahovať len písmená A-Z a číslice 0-9'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Popis môže mať maximálne 500 znakov'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/superadmin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'CODE_EXISTS') {
          setErrors({ code: data.message })
        } else {
          setErrors({ submit: data.error || 'Nastala chyba pri vytváraní rezortu' })
        }
        setLoading(false)
        return
      }

      // Success
      router.push('/institutions')
    } catch (error: any) {
      setErrors({ submit: error.message || 'Nastala chyba pri vytváraní rezortu' })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/institutions" className="hover:text-gray-700">
            Správa rezortov
          </Link>
          {' > '}
          <span className="text-gray-900">Nový rezort</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900">Nový rezort</h1>
      </div>

      {/* Form */}
      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Názov *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              placeholder="napr. Ministerstvo zahraničných vecí a európskych záležitostí"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Plný názov rezortu (max 100 znakov)
            </p>
          </div>

          {/* Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Kód *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.code ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono`}
              placeholder="napr. MZVAEZ"
              maxLength={10}
            />
            {errors.code && (
              <p className="mt-2 text-sm text-red-600">{errors.code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Krátka skratka (max 10 znakov, len A-Z a 0-9, automaticky UPPERCASE)
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Popis
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Voliteľné, napr. oblasť pôsobnosti"
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Voliteľné (max 500 znakov)
            </p>
          </div>

          {/* Active status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">☑ Aktívny rezort</span>
            </label>
            <p className="mt-1 ml-6 text-xs text-gray-500">
              (i) Neaktívny rezort nemôže vytvárať nové VK
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/institutions"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Zrušiť
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Vytváranie...' : 'Vytvoriť rezort'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
