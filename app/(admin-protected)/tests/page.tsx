'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useTests, type Test } from '@/hooks/useTests'
import { useTestCategories } from '@/hooks/useTestCategories'

type TestTypeOption = {
  value: string
  label: string
}

const testTypeOptions: TestTypeOption[] = [
  { value: 'ODBORNY', label: 'Odborný' },
  { value: 'VSEOBECNY', label: 'Všeobecný' },
  { value: 'STATNY_JAZYK', label: 'Štátny jazyk' },
  { value: 'CUDZI_JAZYK', label: 'Cudzí jazyk' },
  { value: 'IT_ZRUCNOSTI', label: 'IT zručnosti' },
  { value: 'SCHOPNOSTI_VLASTNOSTI', label: 'Schopnosti a vlastnosti' },
]

function getTestTypeBadge(type: string) {
  const colors: Record<string, string> = {
    ODBORNY: 'bg-purple-100 text-purple-800',
    VSEOBECNY: 'bg-blue-100 text-blue-800',
    STATNY_JAZYK: 'bg-green-100 text-green-800',
    CUDZI_JAZYK: 'bg-orange-100 text-orange-800',
    IT_ZRUCNOSTI: 'bg-cyan-100 text-cyan-800',
    SCHOPNOSTI_VLASTNOSTI: 'bg-pink-100 text-pink-800',
  }

  const labels: Record<string, string> = {
    ODBORNY: 'Odborný',
    VSEOBECNY: 'Všeobecný',
    STATNY_JAZYK: 'Štátny jazyk',
    CUDZI_JAZYK: 'Cudzí jazyk',
    IT_ZRUCNOSTI: 'IT zručnosti',
    SCHOPNOSTI_VLASTNOSTI: 'Schopnosti a vlastnosti',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {labels[type] || type}
    </span>
  )
}

export default function TestsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TestTypeOption | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<{ value: string; label: string } | null>(null)
  const [approvedFilter, setApprovedFilter] = useState<'all' | boolean>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch categories for filter
  const { data: categoriesData } = useTestCategories({ limit: 100 })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [typeFilter, categoryFilter, approvedFilter])

  // Use React Query hook
  const { data, isLoading, isFetching } = useTests({
    search: debouncedSearch,
    type: typeFilter?.value,
    categoryId: categoryFilter?.value,
    approved: approvedFilter,
    page,
    limit: pageSize,
  })

  // Build category options from fetched categories
  const categoryOptions = categoriesData?.categories.map(cat => ({
    value: cat.id,
    label: cat.name
  })) || []

  const tests = data?.tests ?? []
  const pagination = {
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    totalItems: data?.total ?? 0,
    pageSize: data?.limit ?? 10,
  }

  // Column definitions
  const columns: ColumnDef<Test>[] = [
    {
      accessorKey: 'name',
      header: 'Názov',
      cell: ({ row }) => (
        <Link
          href={`/tests/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Typ',
      cell: ({ row }) => getTestTypeBadge(row.original.type),
    },
    {
      accessorKey: 'questionCount',
      header: 'Otázky',
      cell: ({ row }) => `${row.original.questionCount} otázok`,
    },
    {
      accessorKey: 'recommendedDuration',
      header: 'Trvanie',
      cell: ({ row }) => row.original.recommendedDuration ? `${row.original.recommendedDuration} min` : '-',
    },
    {
      accessorKey: 'recommendedScore',
      header: 'Úspešnosť',
      cell: ({ row }) => row.original.recommendedScore ? `${row.original.recommendedScore}%` : '-',
    },
    {
      accessorKey: 'difficulty',
      header: 'Náročnosť',
      cell: ({ row }) => {
        const difficulty = row.original.difficulty || 5
        const percentage = (difficulty / 10) * 100

        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor:
                    difficulty <= 3 ? '#10B981' :  // Easy - green
                    difficulty <= 6 ? '#F59E0B' :  // Medium - orange
                    '#EF4444'                      // Hard - red
                }}
              />
            </div>
            <span className="text-xs text-gray-600 w-8">{difficulty}/10</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'usage',
      header: 'Použitie',
      cell: ({ row }) => {
        const { usage } = row.original
        if (usage.totalVKs === 0) return <span className="text-gray-500">-</span>

        if (usage.hasActiveUsage) {
          return (
            <span className="text-green-600 font-medium">
              🟢 {usage.totalVKs} VK {usage.activeVKs > 0 && `(${usage.activeVKs} aktívne)`}
            </span>
          )
        }

        return (
          <span className="text-yellow-600">
            🟡 {usage.totalVKs} VK
          </span>
        )
      },
    },
    {
      accessorKey: 'author',
      header: 'Autor',
      cell: ({ row }) => row.original.author ? `${row.original.author.name} ${row.original.author.surname}` : '-',
    },
    {
      accessorKey: 'approved',
      header: 'Stav',
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.original.approved
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.approved ? '✅ Schválený' : '⏳ Koncept'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testy</h1>
          <p className="mt-2 text-sm text-gray-700">
            Pool hotových testov pre výberové konania
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/tests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Vytvoriť test
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Hľadať test podľa názvu..."
            />
          </div>

          {/* Type filter */}
          <div>
            <Select
              isClearable
              placeholder="Všetky typy"
              value={typeFilter}
              onChange={(option) => setTypeFilter(option)}
              options={testTypeOptions}
              className="text-sm"
            />
          </div>

          {/* Category filter */}
          <div>
            <Select
              isClearable
              placeholder="Všetky kategórie"
              value={categoryFilter}
              onChange={(option) => setCategoryFilter(option)}
              options={categoryOptions}
              className="text-sm"
            />
          </div>

          {/* Approved filter */}
          <div>
            <select
              value={String(approvedFilter)}
              onChange={(e) => {
                const value = e.target.value
                setApprovedFilter(value === 'all' ? 'all' : value === 'true')
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">Všetky</option>
              <option value="true">Schválené</option>
              <option value="false">Neschválené</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table or Empty state */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-500">Načítavam...</div>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne testy</h3>
          <p className="mt-1 text-sm text-gray-500">
            Zatiaľ neboli vytvorené žiadne testy.
          </p>
          <div className="mt-6">
            <Link
              href="/tests/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Vytvoriť test
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <DataTable
            columns={columns}
            data={tests}
            loading={isLoading}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            onRowClick={(row) => router.push(`/tests/${row.id}`)}
          />
        </div>
      )}
    </div>
  )
}
