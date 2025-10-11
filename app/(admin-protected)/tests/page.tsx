'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PageHeader } from '@/components/PageHeader'
import { PlusIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useTests, useDeleteTest, type Test } from '@/hooks/useTests'
import { useTestTypes } from '@/hooks/useTestTypes'
import { ConfirmModal } from '@/components/ConfirmModal'
import { toast } from 'react-hot-toast'

type TestTypeOption = {
  value: string
  label: string
}

function getQuestionWord(count: number) {
  if (count === 1) return 'otázka'
  if (count >= 2 && count <= 4) return 'otázky'
  return 'otázok'
}

function getTestTypeBadge(testType: { id: string; name: string } | null) {
  if (!testType) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Neurčený
      </span>
    )
  }

  // Dynamické farby podľa názvu typu
  let colorClass = 'bg-gray-100 text-gray-800'
  const name = testType.name.toLowerCase()

  if (name.includes('odborn')) colorClass = 'bg-purple-100 text-purple-800'
  else if (name.includes('všeobecn')) colorClass = 'bg-blue-100 text-blue-800'
  else if (name.includes('štátn') || name.includes('jazyk')) colorClass = 'bg-green-100 text-green-800'
  else if (name.includes('cudz') || name.includes('anglick')) colorClass = 'bg-orange-100 text-orange-800'
  else if (name.includes('it') || name.includes('počítač')) colorClass = 'bg-cyan-100 text-cyan-800'
  else if (name.includes('schopnos') || name.includes('vlastnos')) colorClass = 'bg-pink-100 text-pink-800'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {testType.name}
    </span>
  )
}

export default function TestsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TestTypeOption | null>(null)
  const [approvedFilter, setApprovedFilter] = useState<'all' | boolean>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTest, setDeletingTest] = useState<Test | null>(null)

  // Fetch test types for filter
  const { data: testTypesData } = useTestTypes({ limit: 100 })
  const deleteTestMutation = useDeleteTest()

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
  }, [typeFilter, approvedFilter])

  // Use React Query hook
  const { data, isLoading, isFetching, error } = useTests({
    search: debouncedSearch,
    testTypeId: typeFilter?.value,
    approved: approvedFilter,
    page,
    limit: pageSize,
  })

  // Build test type options from fetched test types
  const testTypeOptions = testTypesData?.testTypes.map(type => ({
    value: type.id,
    label: type.name
  })) || []

  const tests = data?.tests ?? []
  const pagination = {
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    totalItems: data?.total ?? 0,
    pageSize: data?.limit ?? 10,
  }

  const handleDeleteClick = (test: Test) => {
    setDeletingTest(test)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTest) return

    try {
      await deleteTestMutation.mutateAsync(deletingTest.id)
      toast.success('Test bol úspešne vymazaný')
      setShowDeleteModal(false)
      setDeletingTest(null)
    } catch (error: any) {
      toast.error(error.message || 'Nepodarilo sa vymazať test')
    }
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
      accessorKey: 'testType',
      header: 'Typ testu',
      cell: ({ row }) => getTestTypeBadge(row.original.testType),
    },
    {
      accessorKey: 'testTypeCondition',
      header: 'Podmienky',
      cell: ({ row }) => {
        if (!row.original.testTypeCondition) {
          return <span className="text-gray-400">-</span>
        }
        return (
          <span className="text-sm text-gray-700">
            {row.original.testTypeCondition.name}
          </span>
        )
      },
    },
    {
      accessorKey: 'questionCount',
      header: 'Otázky',
      cell: ({ row }) => `${row.original.questionCount} ${getQuestionWord(row.original.questionCount)}`,
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
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent row click navigation
            handleDeleteClick(row.original)
          }}
          className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
          title="Vymazať test"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      ),
    },
  ]

  return (
    <div data-testid="tests-page" className="space-y-6">
      <PageHeader
        title="Testy"
        description="Pool hotových testov pre výberové konania"
        actions={
          <Link
            href="/tests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Vytvoriť test
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Vymazať test"
        message={`Naozaj chcete vymazať test "${deletingTest?.name}"? Táto akcia je nevratná.`}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeletingTest(null)
        }}
      />
    </div>
  )
}
