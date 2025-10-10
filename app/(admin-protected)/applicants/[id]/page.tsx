'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DataTable } from '@/components/table/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

type VK = {
  id: string
  identifier: string
  position: string
  status: string
  institution: {
    id: string
    code: string
    name: string
  }
}

type Candidate = {
  id: string
  cisIdentifier: string
  email: string | null
  isArchived: boolean
  registeredAt: string
  vk: VK
  testResults: any[]
  evaluations: any[]
}

type User = {
  id: string
  username: string
  email: string | null
  name: string
  surname: string
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
  candidates: Candidate[]
}

type TabType = 'overview' | 'vk'

export default function ApplicantDetailPage() {
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    fetchUser()
  }, [params.id])

  async function fetchUser() {
    try {
      const res = await fetch(`/api/admin/users/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const vkColumns: ColumnDef<Candidate>[] = [
    {
      accessorKey: 'vk.identifier',
      header: 'VK',
      cell: ({ row }) => (
        <Link
          href={`/vk/${row.original.vk.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {row.original.vk.identifier}
        </Link>
      ),
    },
    {
      accessorKey: 'vk.position',
      header: 'Pozícia',
    },
    {
      accessorKey: 'vk.institution.name',
      header: 'Inštitúcia',
    },
    {
      accessorKey: 'cisIdentifier',
      header: 'CIS ID',
    },
    {
      accessorKey: 'registeredAt',
      header: 'Registrácia',
      cell: ({ row }) => new Date(row.original.registeredAt).toLocaleDateString('sk-SK'),
    },
    {
      id: 'testResults',
      header: 'Testy',
      cell: ({ row }) => row.original.testResults.length || '-',
    },
    {
      id: 'evaluations',
      header: 'Hodnotenia',
      cell: ({ row }) => row.original.evaluations.length || '-',
    },
    {
      accessorKey: 'vk.status',
      header: 'Stav VK',
      cell: ({ row }) => {
        const status = row.original.vk.status
        const statusMap: Record<string, { label: string; color: string }> = {
          DRAFT: { label: 'Návrh', color: 'bg-gray-100 text-gray-800' },
          PUBLISHED: { label: 'Zverejnené', color: 'bg-blue-100 text-blue-800' },
          IN_PROGRESS: { label: 'Prebieha', color: 'bg-yellow-100 text-yellow-800' },
          COMPLETED: { label: 'Ukončené', color: 'bg-green-100 text-green-800' },
          CANCELLED: { label: 'Zrušené', color: 'bg-red-100 text-red-800' },
        }
        const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Načítavam...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-gray-500 mb-4">Uchádzač nebol nájdený</div>
        <Link
          href="/applicants"
          className="text-blue-600 hover:text-blue-800"
        >
          Späť na zoznam
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="applicant-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/applicants"
            data-testid="back-button"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 data-testid="applicant-name" className="text-3xl font-bold text-gray-900">
              {user.name} {user.surname}
            </h1>
            <p data-testid="applicant-email" className="text-gray-600">{user.email || user.username}</p>
          </div>
        </div>
        <div>
          {user.active ? (
            <span data-testid="status-badge" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Aktívny
            </span>
          ) : (
            <span data-testid="status-badge" className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              Neaktívny
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200" data-testid="tabs-container">
        <nav className="-mb-px flex space-x-8">
          <button
            data-testid="overview-tab"
            onClick={() => setActiveTab('overview')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Prehľad
          </button>
          <button
            data-testid="vk-tab"
            onClick={() => setActiveTab('vk')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'vk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Výberové konania ({user.candidates.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div data-testid="overview-content" className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 data-testid="overview-title" className="text-lg font-medium text-gray-900">Základné informácie</h2>
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div data-testid="field-name">
                <dt className="text-sm font-medium text-gray-500">Meno</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
              <div data-testid="field-surname">
                <dt className="text-sm font-medium text-gray-500">Priezvisko</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.surname}</dd>
              </div>
              <div data-testid="field-email">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email || '-'}</dd>
              </div>
              <div data-testid="field-username">
                <dt className="text-sm font-medium text-gray-500">Používateľské meno</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
              </div>
              <div data-testid="field-role">
                <dt className="text-sm font-medium text-gray-500">Rola</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
              </div>
              <div data-testid="field-status">
                <dt className="text-sm font-medium text-gray-500">Stav</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.active ? 'Aktívny' : 'Neaktívny'}
                </dd>
              </div>
              <div data-testid="field-created">
                <dt className="text-sm font-medium text-gray-500">Vytvorený</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('sk-SK')}
                </dd>
              </div>
              <div data-testid="field-updated">
                <dt className="text-sm font-medium text-gray-500">Aktualizovaný</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.updatedAt).toLocaleDateString('sk-SK')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'vk' && (
        <div data-testid="vk-content" className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 data-testid="vk-title" className="text-lg font-medium text-gray-900">Výberové konania</h2>
          </div>
          <div className="p-6">
            {user.candidates.length === 0 ? (
              <div data-testid="vk-empty-message" className="text-center py-12 text-gray-500">
                Uchádzač nie je priradený k žiadnemu výberovému konaniu
              </div>
            ) : (
              <div data-testid="vk-table">
                <DataTable columns={vkColumns} data={user.candidates} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
