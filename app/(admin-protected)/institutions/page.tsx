'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DataTable } from '@/components/table/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/components/Toast'

type Institution = {
  id: string
  name: string
  code: string
  description: string | null
  active: boolean
  allowedQuestionTypes: string[]
  createdAt: string
  vkCount: number
  adminCount: number
}

function getStatusBadge(active: boolean) {
  return active ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckIcon className="h-4 w-4 inline-block mr-1" />
      Aktívny
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      <XMarkIcon className="h-4 w-4 inline-block mr-1" />
      Neaktívny
    </span>
  )
}

function getQuestionTypeName(type: string): string {
  const names: { [key: string]: string } = {
    'SINGLE_CHOICE': 'Jednovýberová',
    'MULTIPLE_CHOICE': 'Viacvýberová',
    'TRUE_FALSE': 'Pravda/Nepravda',
    'OPEN_ENDED': 'Otvorená',
  }
  return names[type] || type
}

function getQuestionTypesDisplay(types: string[]): JSX.Element {
  if (!types || types.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>
  }

  if (types.length === 1) {
    return (
      <span className="text-sm text-gray-900">
        {getQuestionTypeName(types[0])}
      </span>
    )
  }

  const typesList = types.map(getQuestionTypeName).join(', ')

  return (
    <span
      className="text-sm text-blue-600 cursor-help"
      title={typesList}
      data-testid="question-types-multiple"
    >
      [{types.length} typy ⓘ]
    </span>
  )
}

export default function InstitutionsPage() {
  const { showSuccess, showError } = useToast()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showActive, setShowActive] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [institutionToToggle, setInstitutionToToggle] = useState<{ id: string; active: boolean } | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch institutions
  useEffect(() => {
    fetchInstitutions()
  }, [debouncedSearch, showActive, showInactive])

  async function fetchInstitutions() {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }

      // Active filter
      if (showActive && !showInactive) {
        params.set('active', 'true')
      } else if (!showActive && showInactive) {
        params.set('active', 'false')
      } else if (showActive && showInactive) {
        params.set('active', 'all')
      }

      const res = await fetch(`/api/superadmin/institutions?${params}`)
      const data = await res.json()

      setInstitutions(data.institutions || [])
    } catch (error) {
      console.error('Error fetching institutions:', error)
    } finally {
      setLoading(false)
    }
  }

  function openToggleModal(id: string, currentActive: boolean) {
    setInstitutionToToggle({ id, active: currentActive })
  }

  async function handleToggleConfirm() {
    if (!institutionToToggle) return

    const { id, active: currentActive } = institutionToToggle
    setInstitutionToToggle(null)

    try {
      const res = await fetch(`/api/superadmin/institutions/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (res.ok) {
        showSuccess(currentActive ? 'Rezort bol deaktivovaný' : 'Rezort bol aktivovaný')
        fetchInstitutions()
      } else {
        showError('Chyba pri zmene stavu rezortu')
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
      showError('Chyba pri zmene stavu rezortu')
    }
  }

  // Column definitions
  const columns: ColumnDef<Institution>[] = [
    {
      accessorKey: 'name',
      header: 'Názov rezortu',
      cell: ({ row }) => (
        <div>
          <Link
            href={`/institutions/${row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            data-testid={`institution-link-${row.original.id}`}
          >
            {row.original.name}
          </Link>
          <div className="text-xs text-gray-500">
            Vytvorený: {new Date(row.original.createdAt).toLocaleDateString('sk-SK')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Kód',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'allowedQuestionTypes',
      header: 'Povolené typy',
      cell: ({ row }) => getQuestionTypesDisplay(row.original.allowedQuestionTypes || []),
    },
    {
      accessorKey: 'vkCount',
      header: 'VK',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.vkCount}</span>
      ),
    },
    {
      accessorKey: 'adminCount',
      header: 'Admini',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.adminCount}</span>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Stav',
      cell: ({ row }) => getStatusBadge(row.original.active),
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => openToggleModal(row.original.id, row.original.active)}
            className={`text-xs px-2 py-1 rounded ${
              row.original.active
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
          >
            {row.original.active ? (
              <>
                <TrashIcon className="h-4 w-4 inline-block mr-1" />
                Deaktivovať
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 inline-block mr-1" />
                Aktivovať
              </>
            )}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6" data-testid="institutions-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Správa rezortov</h1>
          <p className="mt-2 text-gray-600">
            Zoznam organizačných jednotiek
          </p>
        </div>
        <Link
          href="/institutions/new"
          data-testid="add-institution-button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Pridať rezort
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              data-testid="search-input"
              placeholder="Hľadať..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                data-testid="filter-active"
                checked={showActive}
                onChange={(e) => setShowActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Aktívne</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                data-testid="filter-inactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Neaktívne</span>
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-500">Načítavam...</div>
        </div>
      ) : institutions.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center" data-testid="no-data-message">
          <p className="text-gray-500 mb-4">Žiadne rezorty</p>
          <Link
            href="/institutions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Pridať prvý rezort
          </Link>
        </div>
      ) : (
        <div data-testid="institutions-table">
          <DataTable columns={columns} data={institutions} />
        </div>
      )}

      {/* Toggle Active Confirmation Modal */}
      <ConfirmModal
        isOpen={!!institutionToToggle}
        title={institutionToToggle?.active ? 'Deaktivovať rezort' : 'Aktivovať rezort'}
        message={
          institutionToToggle?.active
            ? 'Naozaj chcete deaktivovať tento rezort? Admini tohto rezortu sa nebudú môcť prihlásiť.'
            : 'Naozaj chcete aktivovať tento rezort?'
        }
        confirmLabel={institutionToToggle?.active ? 'Deaktivovať' : 'Aktivovať'}
        cancelLabel="Zrušiť"
        variant={institutionToToggle?.active ? 'danger' : 'warning'}
        onConfirm={handleToggleConfirm}
        onCancel={() => setInstitutionToToggle(null)}
      />
    </div>
  )
}
