'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/table/DataTable'

const formatDateTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleString('sk-SK')
}

type ArchivedApplicant = {
  candidateId: string
  userId: string
  name: string
  surname: string
  email: string | null
  cisIdentifier: string
  vkIdentifier: string
  position: string
  institutionName: string
  completedAt: string
  registeredAt: string
}

export default function ArchiveApplicantsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ArchivedApplicant[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) {
          params.set('search', debouncedSearch)
        }

        const response = await fetch(`/api/admin/archive/applicants?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load archived applicants')
        }

        const json = await response.json()
        setData(json.applicants ?? [])
      } catch (error) {
        console.error('Failed to fetch archived applicants', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [debouncedSearch])

  const columns = useMemo<ColumnDef<ArchivedApplicant>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Uchádzač',
      cell: ({ row }) => (
        <div>
          <Link
            href={`/applicants/${row.original.userId}`}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            {row.original.name} {row.original.surname}
          </Link>
          <div className="text-xs text-gray-500">CIS: {row.original.cisIdentifier}</div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email ?? '-',
    },
    {
      accessorKey: 'vkIdentifier',
      header: 'Výberové konanie',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.vkIdentifier}</div>
          <div className="text-xs text-gray-500">{row.original.position}</div>
        </div>
      ),
    },
    {
      accessorKey: 'institutionName',
      header: 'Inštitúcia',
    },
    {
      accessorKey: 'completedAt',
      header: 'Ukončené',
      cell: ({ row }) => formatDateTime(row.original.completedAt),
    },
    {
      accessorKey: 'registeredAt',
      header: 'Registrácia uchádzača',
      cell: ({ row }) => formatDateTime(row.original.registeredAt),
    },
  ], [])

  return (
    <div className="space-y-6" data-testid="archive-applicants-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Archív uchádzačov</h1>
          <p className="text-sm text-gray-600">Prehľad uchádzačov z ukončených výberových konaní.</p>
        </div>
        <div className="w-full max-w-xs">
          <label className="block text-sm font-medium text-gray-700" htmlFor="archive-applicants-search">
            Hľadať
          </label>
          <input
            id="archive-applicants-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Meno, email alebo VK"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-500">Načítavam...</div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  )
}
