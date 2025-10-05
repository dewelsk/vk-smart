'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useUsers, type User } from '@/hooks/useUsers'

type RoleOption = {
  value: string
  label: string
}

const roleOptions: RoleOption[] = [
  { value: 'SUPERADMIN', label: 'Superadmin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'KOMISIA', label: 'Komisia' },
]

function getRoleBadge(role: string) {
  const colors: Record<string, string> = {
    SUPERADMIN: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    GESTOR: 'bg-green-100 text-green-800',
    KOMISIA: 'bg-orange-100 text-orange-800',
  }

  const labels: Record<string, string> = {
    SUPERADMIN: 'Superadmin',
    ADMIN: 'Admin',
    GESTOR: 'Gestor',
    KOMISIA: 'Komisia',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
      {labels[role] || role}
    </span>
  )
}

export default function UsersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleOption[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [roleFilter, statusFilter])

  // Use React Query hook
  const { data, isLoading, isFetching } = useUsers({
    search: debouncedSearch,
    roles: roleFilter.map(r => r.value),
    status: statusFilter,
    page,
    limit: pageSize,
  })

  const users = data?.users ?? []
  const pagination = data?.pagination

  // Column definitions
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Meno a priezvisko',
      cell: ({ row }) => (
        <Link
          href={`/users/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.original.name} {row.original.surname}
        </Link>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email || '-',
    },
    {
      accessorKey: 'role',
      header: 'Rola',
      cell: ({ row }) => getRoleBadge(row.original.role),
    },
    {
      id: 'institutions',
      header: 'Rezort',
      cell: ({ row }) => {
        const institutions = row.original.institutions
        if (institutions.length === 0) return '-'
        if (institutions.length === 1) return institutions[0].code
        return `${institutions.length} rezorty`
      },
    },
    {
      accessorKey: 'vkCount',
      header: 'VK',
    },
    {
      accessorKey: 'active',
      header: 'Stav',
      cell: ({ row }) => {
        if (row.original.passwordSetToken) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Čaká na heslo
            </span>
          )
        }
        return row.original.active ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Aktívny
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Neaktívny
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Správa používateľov
          </h1>
          <p className="mt-2 text-gray-600">
            Zoznam používateľov s rolami Admin, Gestor a Komisia
          </p>
        </div>
        <Link
          href="/users/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Pridať používateľa
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Role filter */}
          <div>
            <Select
              isMulti
              value={roleFilter}
              onChange={(selected) => setRoleFilter(selected as RoleOption[])}
              options={roleOptions}
              placeholder="Filtruj podľa role..."
              className="basic-multi-select"
              classNamePrefix="select"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#d1d5db',
                  '&:hover': {
                    borderColor: '#9ca3af',
                  },
                }),
              }}
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Všetci</option>
              <option value="active">Aktívni</option>
              <option value="inactive">Neaktívni</option>
              <option value="pending">Čakajú na heslo</option>
            </select>
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
          data={users}
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
        />
      )}
    </div>
  )
}
