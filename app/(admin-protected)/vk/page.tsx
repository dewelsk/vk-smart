'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PlusIcon, MagnifyingGlassIcon, CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useVKs, type VK } from '@/hooks/useVKs'

type StatusOption = {
  value: string
  label: string
}

const statusOptions: StatusOption[] = [
  { value: '', label: 'Všetky stavy' },
  { value: 'PRIPRAVA', label: 'Príprava' },
  { value: 'CAKA_NA_TESTY', label: 'Čaká na testy' },
  { value: 'TESTOVANIE', label: 'Testovanie' },
  { value: 'HODNOTENIE', label: 'Hodnotenie' },
  { value: 'DOKONCENE', label: 'Dokončené' },
  { value: 'ZRUSENE', label: 'Zrušené' },
]

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    PRIPRAVA: 'bg-gray-100 text-gray-800',
    CAKA_NA_TESTY: 'bg-yellow-100 text-yellow-800',
    TESTOVANIE: 'bg-blue-100 text-blue-800',
    HODNOTENIE: 'bg-purple-100 text-purple-800',
    DOKONCENE: 'bg-green-100 text-green-800',
    ZRUSENE: 'bg-red-100 text-red-800',
  }

  const labels: Record<string, string> = {
    PRIPRAVA: 'Príprava',
    CAKA_NA_TESTY: 'Čaká na testy',
    TESTOVANIE: 'Testovanie',
    HODNOTENIE: 'Hodnotenie',
    DOKONCENE: 'Dokončené',
    ZRUSENE: 'Zrušené',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function VKPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusOption>(statusOptions[0])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  // Use React Query hook
  const { data, isLoading, isFetching } = useVKs({
    search: debouncedSearch,
    status: statusFilter.value,
    page,
    limit: pageSize,
  })

  const vks = data?.vks ?? []
  const pagination = data?.pagination

  // Column definitions
  const columns: ColumnDef<VK>[] = [
    {
      accessorKey: 'identifier',
      header: 'Identifikátor',
      cell: ({ row }) => (
        <Link
          href={`/vk/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.original.identifier}
        </Link>
      ),
    },
    {
      accessorKey: 'position',
      header: 'Pozícia',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.position}</div>
          <div className="text-xs text-gray-500">{row.original.organizationalUnit}</div>
        </div>
      ),
    },
    {
      id: 'gestor',
      header: 'Gestor',
      cell: ({ row }) =>
        row.original.gestor
          ? `${row.original.gestor.name} ${row.original.gestor.surname}`
          : '-',
    },
    {
      accessorKey: 'candidatesCount',
      header: 'Uchádzači',
    },
    {
      accessorKey: 'numberOfPositions',
      header: 'Miesta',
    },
    {
      accessorKey: 'startDateTime',
      header: 'Dátum a čas začiatku',
      cell: ({ row }) => new Date(row.original.startDateTime).toLocaleString('sk-SK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    },
    {
      id: 'validation',
      header: 'Kontrola',
      cell: ({ row }) => {
        const v = row.original.validation
        const colors = {
          ready: 'bg-green-50 text-green-700 border-green-200',
          warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          error: 'bg-red-50 text-red-700 border-red-200',
        }

        // Build tooltip with errors and warnings
        const tooltipLines: string[] = []
        if (v.errors && v.errors.length > 0) {
          tooltipLines.push('Chyby:')
          v.errors.forEach(e => tooltipLines.push(`• ${e}`))
        }
        if (v.warnings && v.warnings.length > 0) {
          if (tooltipLines.length > 0) tooltipLines.push('')
          tooltipLines.push('Varovania:')
          v.warnings.forEach(w => tooltipLines.push(`• ${w}`))
        }
        if (tooltipLines.length === 0) {
          tooltipLines.push(v.label)
        }
        const tooltip = tooltipLines.join('\n')

        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[v.status]} cursor-help`}
            title={tooltip}
          >
            {v.status === 'ready' && <CheckIcon className="h-3 w-3" />}
            {v.status === 'warning' && <ExclamationTriangleIcon className="h-3 w-3" />}
            {v.status === 'error' && <XMarkIcon className="h-3 w-3" />}
            {v.count > 0 && <span>{v.count}</span>}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Stav',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Výberové konania</h1>
          <p className="mt-2 text-gray-600">
            Zoznam výberových konaní
          </p>
        </div>
        <Link
          href="/vk/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Vytvoriť VK
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Hľadať..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {isFetching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          {/* Status filter */}
          <div>
            <Select
              inputId="status-filter"
              value={statusFilter}
              onChange={(selected) => setStatusFilter(selected as StatusOption)}
              options={statusOptions}
              className="basic-select"
              classNamePrefix="select"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-500">Načítavam...</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={vks}
          pagination={true}
          pageSize={pageSize}
          pageIndex={page - 1}
          manualPagination={true}
          pageCount={pagination?.totalPages ?? 0}
          totalCount={pagination?.total ?? 0}
          onPaginationChange={(paginationState) => {
            setPage(paginationState.pageIndex + 1)
            if (paginationState.pageSize !== pageSize) {
              setPageSize(paginationState.pageSize)
              setPage(1) // Reset to page 1 when page size changes
            }
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          onRowClick={(vk) => router.push(`/vk/${vk.id}`)}
        />
      )}
    </div>
  )
}
