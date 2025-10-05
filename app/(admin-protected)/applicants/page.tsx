'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useApplicants, type Applicant } from '@/hooks/useApplicants'

type StatusOption = {
  value: string
  label: string
}

const statusOptions: StatusOption[] = [
  { value: 'all', label: 'Všetci' },
  { value: 'false', label: 'Aktívni' },
  { value: 'true', label: 'Archivovaní' },
]

export default function ApplicantsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [archivedFilter, setArchivedFilter] = useState<StatusOption>(statusOptions[1])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Use React Query hook
  const { data: applicants = [], isLoading, isFetching } = useApplicants({
    search: debouncedSearch,
    archived: archivedFilter.value,
  })

  // Column definitions
  const columns: ColumnDef<Applicant>[] = [
    {
      accessorKey: 'cisIdentifier',
      header: 'CIS ID',
      cell: ({ row }) => (
        <Link
          href={`/applicants/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.original.cisIdentifier}
        </Link>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Meno a priezvisko',
      cell: ({ row }) => `${row.original.user.name} ${row.original.user.surname}`,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || row.original.user.email || '-',
    },
    {
      accessorKey: 'vk',
      header: 'VK',
      cell: ({ row }) => (
        <div>
          <Link
            href={`/vk/${row.original.vk.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {row.original.vk.identifier}
          </Link>
          <div className="text-xs text-gray-500">{row.original.vk.position}</div>
        </div>
      ),
    },
    {
      id: 'institution',
      header: 'Rezort',
      cell: ({ row }) => row.original.vk.institution.code,
    },
    {
      accessorKey: 'testResultsCount',
      header: 'Testy',
    },
    {
      accessorKey: 'evaluationsCount',
      header: 'Hodnotenia',
    },
    {
      accessorKey: 'registeredAt',
      header: 'Registrácia',
      cell: ({ row }) => new Date(row.original.registeredAt).toLocaleDateString('sk-SK'),
    },
    {
      accessorKey: 'isArchived',
      header: 'Stav',
      cell: ({ row }) =>
        row.original.isArchived ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Archivovaný
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aktívny
          </span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uchádzači</h1>
          <p className="mt-2 text-gray-600">
            Zoznam uchádzačov prihlásených na výberové konania
          </p>
        </div>
        <Link
          href="/applicants/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Pridať uchádzača
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
              value={archivedFilter}
              onChange={(selected) => setArchivedFilter(selected as StatusOption)}
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
        <DataTable columns={columns} data={applicants} />
      )}
    </div>
  )
}
