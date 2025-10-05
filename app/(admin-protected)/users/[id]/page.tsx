'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Select from 'react-select'
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
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

type RoleOption = {
  value: string
  label: string
}

type VK = {
  id: string
  identifier: string
  position: string
  status: string
}

type User = {
  id: string
  name: string
  surname: string
  email: string | null
  username: string
  role: string
  active: boolean
  note: string | null
  createdAt: string
  lastLoginAt: string | null
  passwordSetToken: string | null
  institutions: Institution[]
  vks: VK[]
}

const roleOptions: RoleOption[] = [
  { value: 'SUPERADMIN', label: 'Superadmin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'KOMISIA', label: 'Komisia' },
]

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([])
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    role: roleOptions[0],
    note: '',
    active: true,
    institutionIds: [] as InstitutionOption[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchUser()
    fetchInstitutions()
  }, [userId])

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()

      if (data.user) {
        setUser(data.user)
        const roleOption = roleOptions.find(r => r.value === data.user.role) || roleOptions[0]
        setFormData({
          name: data.user.name,
          surname: data.user.surname,
          email: data.user.email || '',
          role: roleOption,
          note: data.user.note || '',
          active: data.user.active,
          institutionIds: data.user.institutions.map((inst: Institution) => ({
            value: inst.id,
            label: `${inst.code} - ${inst.name}`,
          })),
        })
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

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

  function validate() {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Meno je povinné'
    if (!formData.surname.trim()) newErrors.surname = 'Priezvisko je povinné'

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    setErrors({})

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email || null,
          role: formData.role.value,
          note: formData.note || null,
          active: formData.active,
          institutionIds: formData.institutionIds.map(i => i.value),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Chyba pri aktualizácii používateľa' })
        return
      }

      // Success - refresh data
      await fetchUser()
    } catch (error) {
      console.error('Failed to update user:', error)
      setErrors({ general: 'Chyba pri aktualizácii používateľa' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Naozaj chcete odstrániť tohto používateľa?')) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Chyba pri odstraňovaní používateľa')
        return
      }

      // Success - redirect to list
      router.push('/users')
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Chyba pri odstraňovaní používateľa')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Používateľ nenájdený</p>
        <Link href="/users" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Späť na zoznam
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.name} {user.surname}
            </h1>
            <p className="mt-2 text-gray-600">
              {user.username} • {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <TrashIcon className="h-5 w-5" />
          Odstrániť
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informácie</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Vytvorené</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('sk-SK')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Posledné prihlásenie</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString('sk-SK')
                : 'Nikdy'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Stav</dt>
            <dd className="mt-1">
              {user.passwordSetToken ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Čaká na heslo
                </span>
              ) : user.active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Aktívny
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Neaktívny
                </span>
              )}
            </dd>
          </div>
        </dl>

        {/* VKs */}
        {user.vks && user.vks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Výberové konania ({user.vks.length})</h3>
            <ul className="space-y-2">
              {user.vks.map((vk) => (
                <li key={vk.id} className="text-sm">
                  <Link
                    href={`/vk/${vk.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {vk.identifier} - {vk.position}
                  </Link>
                  <span className="ml-2 text-gray-500">({vk.status})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Upraviť používateľa</h2>

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
              Rola
            </label>
            <Select
              value={formData.role}
              onChange={(selected) => setFormData({ ...formData, role: selected as RoleOption })}
              options={roleOptions}
              className="basic-select"
              classNamePrefix="select"
            />
          </div>

          {/* Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Aktívny používateľ
            </label>
          </div>

          {/* Institutions */}
          <div>
            <label htmlFor="institutions" className="block text-sm font-medium text-gray-700 mb-2">
              Rezorty
            </label>
            <Select
              isMulti
              value={formData.institutionIds}
              onChange={(selected) =>
                setFormData({ ...formData, institutionIds: selected as InstitutionOption[] })
              }
              options={institutions}
              placeholder="Vyberte rezorty..."
              className="basic-multi-select"
              classNamePrefix="select"
            />
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
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Ukladám...' : 'Uložiť zmeny'}
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
