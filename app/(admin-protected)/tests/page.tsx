'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StyledSelect, SimpleSelect, type SelectOption } from '@/components/StyledSelect'
import { PlusIcon, MagnifyingGlassIcon, DocumentDuplicateIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Pagination } from '@/components/Pagination'
import { useTests, type Test } from '@/hooks/useTests'
import { useTestTypes } from '@/hooks/useTestTypes'

// Reuse SelectOption from StyledSelect
type TestTypeOption = SelectOption

// Status badge podľa Figma dizajnu
function getStatusBadge(approved: boolean | null, isPublished?: boolean) {
  // Logika: approved=true -> Schválený, approved=false -> Neschválený, approved=null -> Rozpracovaný
  // Môžeme rozšíriť o "Čaká na schválenie" ak bude potrebné

  if (approved === true) {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[10px] text-xs font-medium bg-[#E6FBEA] text-[#125F52] min-w-[120px]">
        Schválený
      </span>
    )
  }

  if (approved === false) {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[10px] text-xs font-medium bg-[#FBF5F4] text-[#B93429] min-w-[120px]">
        Neschválený
      </span>
    )
  }

  // Default: Rozpracovaný (null alebo undefined)
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[10px] text-xs font-medium bg-[#F4F3F5] text-[#554E55] min-w-[120px]">
      Rozpracovaný
    </span>
  )
}

export default function TestsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TestTypeOption | null>(null)
  const [approvedFilter, setApprovedFilter] = useState<'all' | boolean>('all')
  const [sortOption, setSortOption] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Parse sort option into sortBy and sortOrder
  const getSortParams = (option: string): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
    switch (option) {
      case 'oldest':
        return { sortBy: 'createdAt', sortOrder: 'asc' }
      case 'name_asc':
        return { sortBy: 'name', sortOrder: 'asc' }
      case 'name_desc':
        return { sortBy: 'name', sortOrder: 'desc' }
      case 'newest':
      default:
        return { sortBy: 'createdAt', sortOrder: 'desc' }
    }
  }

  const { sortBy, sortOrder } = getSortParams(sortOption)

  // Fetch test types for filter
  const { data: testTypesData } = useTestTypes({ limit: 100 })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setPage(1)
  }, [typeFilter, approvedFilter, sortOption])

  // Use React Query hook
  const { data, isLoading } = useTests({
    search: debouncedSearch,
    testTypeId: typeFilter?.value || undefined,
    approved: approvedFilter,
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
  })

  // Build test type options from fetched test types (with "Všetky typy" as first option)
  const testTypeOptions = [
    { value: '', label: 'Všetky typy' },
    ...(testTypesData?.testTypes.map(type => ({
      value: type.id,
      label: type.name
    })) || [])
  ]

  const tests = data?.tests ?? []
  const pagination = {
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    totalItems: data?.total ?? 0,
    pageSize: data?.limit ?? 10,
  }

  return (
    <div data-testid="tests-page" className="flex flex-col h-[calc(100vh-56px)] bg-ds-grey-40 p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DocumentDuplicateIcon className="h-7 w-7 text-[#3F3840]" />
          <h1 data-testid="page-title" className="text-[28px] font-medium text-[#3F3840] font-heading">Testy</h1>
        </div>
        <Link
          href="/tests/new"
          data-testid="create-test-button"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-ds-purple-80 bg-ds-purple-10 text-[#302F85] rounded-[10px] text-sm font-medium hover:bg-ds-purple-80 hover:text-white transition-colors"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          Vytvoriť nový test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[#6A646B]" aria-hidden="true" />
            </div>
            <input
              type="text"
              data-testid="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-[#EAE9EA] rounded-[10px] bg-white text-sm placeholder-[#6A646B] focus:outline-none focus:ring-1 focus:ring-ds-purple-80 focus:border-ds-purple-80"
              placeholder="Vyhľadávať"
            />
            {search && (
              <button
                type="button"
                data-testid="clear-search-button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6A646B] hover:text-[#3F3840]"
                aria-label="Vymazať vyhľadávanie"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <StyledSelect<TestTypeOption>
            isSearchable
            value={typeFilter || testTypeOptions[0]}
            onChange={(option) => setTypeFilter(option)}
            options={testTypeOptions}
            className="w-48"
            data-testid="type-filter"
          />

          {/* Approved filter */}
          <SimpleSelect
            value={String(approvedFilter)}
            onChange={(value) => setApprovedFilter(value === 'all' ? 'all' : value === 'true')}
            options={[
              { value: 'all', label: 'Všetky stavy' },
              { value: 'true', label: 'Schválené' },
              { value: 'false', label: 'Neschválené' },
            ]}
            className="w-44"
            data-testid="status-filter"
          />
        </div>

        {/* Sort dropdown */}
        <SimpleSelect
          value={sortOption}
          onChange={(value) => setSortOption(value)}
          options={[
            { value: 'newest', label: 'Zoradiť od najnovších' },
            { value: 'oldest', label: 'Zoradiť od najstarších' },
            { value: 'name_asc', label: 'Podľa názvu A-Z' },
            { value: 'name_desc', label: 'Podľa názvu Z-A' },
          ]}
          className="w-52"
          data-testid="sort-dropdown"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-[#EAE9EA]" />

      {/* Table or Empty state */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="bg-white p-12 rounded-[15px] shadow-sm text-center">
            <div className="text-[#6A646B]">Načítavam...</div>
          </div>
        ) : tests.length === 0 ? (
          <div data-testid="empty-state" className="text-center py-12 bg-white rounded-[15px] shadow-sm">
            {/* Rozlíšenie: aktívne filtre vs. žiadne testy */}
            {debouncedSearch || typeFilter || approvedFilter !== 'all' ? (
              <>
                <h3 data-testid="no-results-title" className="mt-2 text-sm font-medium text-[#3F3840]">Žiadne výsledky</h3>
                <p data-testid="no-results-message" className="mt-1 text-sm text-[#6A646B]">
                  Skúste zmeniť vyhľadávanie alebo filtre.
                </p>
              </>
            ) : (
              <>
                <h3 data-testid="no-tests-title" className="mt-2 text-sm font-medium text-[#3F3840]">Žiadne testy</h3>
                <p data-testid="no-tests-message" className="mt-1 text-sm text-[#6A646B]">
                  Zatiaľ neboli vytvorené žiadne testy.
                </p>
                <div className="mt-6">
                  <Link
                    href="/tests/new"
                    data-testid="create-test-empty-button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-ds-purple-80 bg-ds-purple-10 text-[#302F85] rounded-[10px] text-sm font-medium hover:bg-ds-purple-80 hover:text-white transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    Vytvoriť nový test
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div data-testid="tests-list" className="space-y-2">
            {/* Header riadok */}
            <div data-testid="tests-list-header" className="px-6 py-2 flex items-center text-sm text-[#6A646B]">
              <div className="flex-[2] min-w-0">Druh testu</div>
              <div className="flex-[1.5] min-w-0">Typ testu</div>
              <div className="flex-1 text-center">Počet otázok</div>
              <div className="flex-1 text-center">Bodovanie</div>
              <div className="flex-1 text-center">Čas</div>
              <div className="flex-[1.5] min-w-0">Gestor</div>
              <div className="flex-[1.2] min-w-0">Stav</div>
              <div className="flex-1 text-center">Použitie</div>
              <div className="w-6"></div>
            </div>

            {tests.map((test) => (
              <div
                key={test.id}
                data-testid={`test-row-${test.id}`}
                onClick={() => router.push(`/tests/${test.id}`)}
                className="bg-white border border-[#EAE9EA] rounded-[10px] shadow-[0px_8px_25px_0px_rgba(42,34,43,0.07)] px-6 py-3 flex items-center cursor-pointer hover:border-ds-black-30 transition-colors"
              >
                {/* Druh testu */}
                <div className="flex-[2] min-w-0">
                  <span className="font-medium text-[#3F3840] truncate block">{test.name}</span>
                </div>

                {/* Typ testu */}
                <div className="flex-[1.5] min-w-0">
                  <span className="text-sm text-[#554E55] truncate block">{test.testType?.name || '-'}</span>
                </div>

                {/* Počet otázok */}
                <div className="flex-1 flex justify-center">
                  <span className="inline-flex items-center justify-center px-2 py-1 border border-[#EAE9EA] rounded-[5px] text-[#3F3840] font-medium text-sm min-w-[40px]">
                    {test.questionCount}
                  </span>
                </div>

                {/* Bodovanie */}
                <div className="flex-1 flex justify-center">
                  <span className="inline-flex items-center justify-center px-2 py-1 border border-[#EAE9EA] rounded-[5px] text-[#3F3840] font-medium text-sm min-w-[40px]">
                    0,5b
                  </span>
                </div>

                {/* Čas */}
                <div className="flex-1 flex justify-center">
                  <span className="inline-flex items-center justify-center px-2 py-1 border border-[#EAE9EA] rounded-[5px] text-[#3F3840] font-medium text-sm min-w-[50px]">
                    {test.recommendedDuration ? `${test.recommendedDuration}min` : '60min'}
                  </span>
                </div>

                {/* Gestor */}
                <div className="flex-[1.5] min-w-0">
                  <span className="text-[#2A222B] underline text-sm truncate block">
                    {test.author ? `${test.author.name} ${test.author.surname}` : '-'}
                  </span>
                </div>

                {/* Stav */}
                <div className="flex-[1.2] min-w-0">
                  {getStatusBadge(test.approved)}
                </div>

                {/* Použitie vo VK */}
                <div className="flex-1 text-center">
                  <span className="text-sm text-[#554E55]">
                    {test.usage?.totalVKs || 0} VK
                  </span>
                </div>

                {/* Arrow */}
                <ChevronRightIcon className="h-5 w-5 text-[#6A646B] flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination - podľa Figma */}
      {!isLoading && tests.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
