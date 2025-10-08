'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from 'react-select'
import { PageHeader } from '@/components/PageHeader'
import {
  MagnifyingGlassIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { usePracticeTests } from '@/hooks/usePracticeTests'
import { useTestCategories } from '@/hooks/useTestCategories'
import { toast } from 'react-hot-toast'

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

export default function PracticePage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TestTypeOption | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<{ value: string; label: string } | null>(null)
  const [startingTestId, setStartingTestId] = useState<string | null>(null)

  // Fetch categories for filter
  const { data: categoriesData } = useTestCategories({ limit: 100 })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Use React Query hook
  const { data, isLoading, error } = usePracticeTests({
    search: debouncedSearch,
    type: typeFilter?.value,
    categoryId: categoryFilter?.value,
  })

  // Build category options from fetched categories
  const categoryOptions = categoriesData?.categories.map(cat => ({
    value: cat.id,
    label: cat.name
  })) || []

  const tests = data?.tests ?? []

  const handleStartPractice = async (testId: string) => {
    setStartingTestId(testId)
    toast.loading('Spúšťam test...')

    try {
      const res = await fetch(`/api/practice/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })

      toast.dismiss()

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Chyba pri spustení testu')
        setStartingTestId(null)
        return
      }

      const data = await res.json()

      // Store test data in sessionStorage for the test page
      sessionStorage.setItem(`practice-session-${data.sessionId}`, JSON.stringify(data))

      toast.success('Test spustený')

      // Redirect to practice test page
      router.push(`/tests/practice/${data.sessionId}`)

    } catch (error) {
      toast.dismiss()
      toast.error('Chyba pri spustení testu')
      setStartingTestId(null)
    }
  }

  return (
    <div className="space-y-6" data-testid="practice-page">
      <PageHeader
        title="Precvičovanie testov"
        description="Vyskúšajte si testy pred nasadením do výberového konania"
      />

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4" data-testid="practice-filters">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              data-testid="search-input"
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
              inputId="type-filter-select-input"
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
              inputId="category-filter-select-input"
              isClearable
              placeholder="Všetky kategórie"
              value={categoryFilter}
              onChange={(option) => setCategoryFilter(option)}
              options={categoryOptions}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-500">Načítavam...</div>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg" data-testid="empty-state">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne testy</h3>
          <p className="mt-1 text-sm text-gray-500">
            Zatiaľ nie sú k dispozícii žiadne schválené testy na precvičovanie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="tests-grid">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              data-testid={`test-card-${test.id}`}
            >
              {/* Test Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="test-name">
                    {test.name}
                  </h3>
                  {getTestTypeBadge(test.type)}
                </div>
              </div>

              {/* Test Description */}
              {test.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {test.description}
                </p>
              )}

              {/* Test Category */}
              {test.category && (
                <div className="text-sm text-gray-500 mb-4">
                  Kategória: <span className="font-medium">{test.category.name}</span>
                </div>
              )}

              {/* Test Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  <span>{test.questionCount} otázok</span>
                </div>

                {test.recommendedDuration && (
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>{test.recommendedDuration} minút</span>
                  </div>
                )}

                {test.difficulty && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">Náročnosť:</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(test.difficulty / 10) * 100}%`,
                          backgroundColor:
                            test.difficulty <= 3 ? '#10B981' :
                            test.difficulty <= 6 ? '#F59E0B' :
                            '#EF4444'
                        }}
                      />
                    </div>
                    <span className="text-xs ml-2">{test.difficulty}/10</span>
                  </div>
                )}
              </div>

              {/* Last Attempt Info */}
              {test.userLastAttempt && test.userLastAttempt.completedAt && (
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <div className="text-xs text-gray-500 mb-1">Posledný pokus:</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {test.userLastAttempt.passed ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        test.userLastAttempt.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {test.userLastAttempt.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {test.totalAttempts} {test.totalAttempts === 1 ? 'pokus' : 'pokusy'}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                data-testid="start-practice-button"
                onClick={() => handleStartPractice(test.id)}
                disabled={startingTestId === test.id}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4" />
                {startingTestId === test.id ? 'Spúšťam...' : 'Spustiť test'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
