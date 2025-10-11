'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PlusIcon, MagnifyingGlassIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useApplicants, type Applicant } from '@/hooks/useApplicants'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null)

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

  // Handle switch to applicant
  const handleSwitchToApplicant = async (userId: string, userName: string) => {
    try {
      setSwitchingUserId(userId)
      toast.loading('Prepínam na uchádzača...')

      const response = await fetch(`/api/admin/applicants/${userId}/switch`, {
        method: 'POST',
      })

      toast.dismiss()

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Chyba pri prepínaní')
        return
      }

      const data = await response.json()
      toast.success(data.message || `Prepnuté na ${userName}`)

      // Redirect to applicant dashboard and refresh to show banner
      router.push(data.redirectTo || '/applicant/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Switch error:', error)
      toast.dismiss()
      toast.error('Chyba pri prepínaní na uchádzača')
    } finally {
      setSwitchingUserId(null)
    }
  }

  // Column definitions
  const columns: ColumnDef<Applicant>[] = [
    {
      accessorKey: 'name',
      header: 'Meno a priezvisko',
      cell: ({ row }) => {
        const user = row.original
        return (
          <Link
            href={`/applicants/${user.id}`}
            data-testid={`applicant-name-${user.id}`}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {user.name} {user.surname}
          </Link>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      id: 'vk',
      header: 'VK',
      cell: ({ row }) => {
        const applicant = row.original
        if (!applicant.vk) {
          return <span className="text-gray-400">-</span>
        }
        return (
          <div>
            <Link
              href={`/vk/${applicant.vk.id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {applicant.vk.identifier}
            </Link>
            <div className="text-xs text-gray-500">{applicant.vk.position}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'cisIdentifier',
      header: 'CIS ID',
      cell: ({ row }) => row.original.cisIdentifier || '-',
    },
    {
      accessorKey: 'testResultsCount',
      header: 'Testy',
      cell: ({ row }) => row.original.testResultsCount || '-',
    },
    {
      accessorKey: 'evaluationsCount',
      header: 'Hodnotenia',
      cell: ({ row }) => row.original.evaluationsCount || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Vytvorený',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('sk-SK'),
    },
    {
      accessorKey: 'active',
      header: 'Stav',
      cell: ({ row }) =>
        row.original.active ? (
          <span data-testid={`status-badge-${row.original.id}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aktívny
          </span>
        ) : (
          <span data-testid={`status-badge-${row.original.id}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Neaktívny
          </span>
        ),
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => {
        const user = row.original
        const userName = `${user.name} ${user.surname}`
        const isSwitching = switchingUserId === user.id

        return (
          <button
            onClick={() => handleSwitchToApplicant(user.id, userName)}
            disabled={isSwitching || !user.active}
            data-testid={`switch-button-${user.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isSwitching ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Prepínam...
              </>
            ) : (
              <>
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Prepnúť
              </>
            )}
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6" data-testid="applicants-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">Uchádzači</h1>
          <p data-testid="page-description" className="mt-2 text-gray-600">
            Zoznam všetkých uchádzačov a ich priradenie k výberovým konaniam
          </p>
        </div>
        <Link
          href="/applicants/new"
          data-testid="add-applicant-button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Pridať uchádzača
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow" data-testid="filters-section">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Hľadať..."
              data-testid="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {isFetching && (
              <div data-testid="search-spinner" className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
          <div data-testid="status-filter">
            <Select
              value={archivedFilter}
              onChange={(selected) => setArchivedFilter(selected as StatusOption)}
              options={statusOptions}
              className="basic-select"
              classNamePrefix="select"
              inputId="status-filter-select"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div data-testid="loading-state" className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-500">Načítavam...</div>
        </div>
      ) : (
        <div data-testid="applicants-table">
          <DataTable columns={columns} data={applicants} />
        </div>
      )}
    </div>
  )
}
