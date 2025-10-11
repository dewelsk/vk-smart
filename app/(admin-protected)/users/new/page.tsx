'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Select from 'react-select'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type RoleOption = {
  value: string
  label: string
}

export default function NewUserPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  // Role options based on current user's role
  const roleOptions: RoleOption[] = session?.user?.role === 'SUPERADMIN'
    ? [
        { value: 'SUPERADMIN', label: 'Superadmin' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'GESTOR', label: 'Gestor' },
        { value: 'KOMISIA', label: 'Komisia' },
      ]
    : [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'GESTOR', label: 'Gestor' },
        { value: 'KOMISIA', label: 'Komisia' },
      ]

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    username: '',
    email: '',
    role: roleOptions[0],
    note: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})


  function validate() {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Meno je povinné'
    if (!formData.surname.trim()) newErrors.surname = 'Priezvisko je povinné'
    if (!formData.username.trim()) newErrors.username = 'Používateľské meno je povinné'
    if (!formData.role) newErrors.role = 'Rola je povinná'

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          username: formData.username,
          email: formData.email || null,
          role: formData.role.value,
          note: formData.note || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Chyba pri vytváraní používateľa' })
        return
      }

      // Success - redirect to user detail
      router.push(`/users/${data.user.id}`)
    } catch (error) {
      console.error('Failed to create user:', error)
      setErrors({ general: 'Chyba pri vytváraní používateľa' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/users"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
            Pridať používateľa
          </h1>
          <p className="mt-2 text-gray-600">
            {session?.user?.role === 'SUPERADMIN'
              ? 'Vytvorte nového používateľa s ľubovoľnou rolou'
              : 'Vytvorte nového používateľa s rolou Admin, Gestor alebo Komisia'
            }
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

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Meno <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Surname */}
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
              Priezvisko <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="surname"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.surname ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.surname && <p className="mt-1 text-sm text-red-600">{errors.surname}</p>}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Používateľské meno <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rola <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.role}
              onChange={(selected) => setFormData({ ...formData, role: selected as RoleOption })}
              options={roleOptions}
              className="basic-select"
              classNamePrefix="select"
            />
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Poznámka
            </label>
            <textarea
              id="note"
              rows={4}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Vytváram...' : 'Vytvoriť používateľa'}
            </button>
            <Link
              href="/users"
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
