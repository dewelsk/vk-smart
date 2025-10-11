'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/table/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

const formatDate = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('sk-SK')
}

type ArchivedVK = {
  id: string
  identifier: string
  position: string
  date: string
  status: string
  institution: {
    name: string
    code: string
  }
  gestor?: {
    name: string
    surname: string
  } | null
  candidatesCount: number
}

export default function ArchiveVkPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ArchivedVK[]>([])

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

        const response = await fetch(`/api/admin/archive/vk?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load archive data')
        }

        const json = await response.json()
        setData(json.vks ?? [])
      } catch (error) {
        console.error('Failed to fetch archived VK', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [debouncedSearch])

  const columns = useMemo<ColumnDef<ArchivedVK>[]>(() => [
    {
      accessorKey: 'identifier',
      header: 'Identifikátor',
      cell: ({ row }) => (
        <Link
          href={`/vk/${row.original.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {row.original.identifier}
        </Link>
      ),
    },
    {
      accessorKey: 'position',
      header: 'Pozícia',
    },
    {
      accessorKey: 'institution.name',
      header: 'Inštitúcia',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.institution.name}</div>
          <div className="text-xs text-gray-500">{row.original.institution.code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'candidatesCount',
      header: 'Uchádzači',
      cell: ({ row }) => row.original.candidatesCount,
    },
    {
      accessorKey: 'date',
      header: 'Dátum',
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: 'status',
      header: 'Stav',
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {row.original.status}
        </span>
      ),
    },
  ], [])

  return (
    <div className="space-y-6" data-testid="archive-vk-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Archív výberových konaní</h1>
          <p className="text-sm text-gray-600">Zoznam ukončených výberových konaní.</p>
        </div>
        <div className="w-full max-w-xs">
          <label className="block text-sm font-medium text-gray-700" htmlFor="archive-vk-search">
            Hľadať
          </label>
          <input
            id="archive-vk-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Identifikátor alebo pozícia"
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
