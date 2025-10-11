'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { PageHeader } from '@/components/PageHeader'
import { useQuestionCategories } from '@/hooks/useQuestionCategories'

function formatDate(value: string) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function QuestionBatteryPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading, error, refetch, isFetching } = useQuestionCategories()

  const filteredCategories = useMemo(() => {
    if (!data) {
      return []
    }

    if (!search.trim()) {
      return data
    }

    const lowerSearch = search.trim().toLowerCase()
    return data.filter((category) =>
      [category.name, category.description]
        .join(' ')
        .toLowerCase()
        .includes(lowerSearch)
    )
  }, [data, search])

  return (
    <div className="space-y-6" data-testid="question-battery-page">
      <PageHeader
        title="Bateria otázok"
        description="Databáza kategórií a otázok pre riadený rozhovor"
      />

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Hľadať kategóriu alebo popis"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Načítavam kategórie…</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">Nepodarilo sa načítať kategórie.</div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Žiadne kategórie nevyhovujú vyhľadávaniu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategória
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popis
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Počet otázok
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posledná aktualizácia
                  </th>
                  <th scope="col" className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xl">
                      <p className="truncate">
                        {category.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {category.questionCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(category.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/questions/battery/${category.id}`}
                        className="inline-flex items-center px-3 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Upraviť
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
