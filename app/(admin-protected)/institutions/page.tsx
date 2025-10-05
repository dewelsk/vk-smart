'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, CheckIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DataTable } from '@/components/table/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

type Institution = {
  id: string
  name: string
  code: string
  description: string | null
  active: boolean
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

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showActive, setShowActive] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

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

  async function toggleActive(id: string, currentActive: boolean) {
    const confirmMsg = currentActive
      ? 'Naozaj chcete deaktivovať tento rezort? Admini tohto rezortu sa nebudú môcť prihlásiť.'
      : 'Naozaj chcete aktivovať tento rezort?'

    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/superadmin/institutions/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (res.ok) {
        fetchInstitutions()
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
    }
  }

  // Column definitions
  const columns: ColumnDef<Institution>[] = [
    {
      accessorKey: 'name',
      header: 'Názov rezortu',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
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
            onClick={() => toggleActive(row.original.id, row.original.active)}
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
    <div className="space-y-6">
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
              placeholder="🔍 Hľadať..."
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
                checked={showActive}
                onChange={(e) => setShowActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">☑ Aktívne</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">☐ Neaktívne</span>
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
        <div className="bg-white p-12 rounded-lg shadow text-center">
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
        <DataTable columns={columns} data={institutions} />
      )}
    </div>
  )
}
