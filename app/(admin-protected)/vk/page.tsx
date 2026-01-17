'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  UserIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { SimpleSelect } from '@/components/StyledSelect'
import { Pagination } from '@/components/Pagination'
import { useVKs } from '@/hooks/useVKs'
import FilterSidebar, { VKStatusFilter, DateFilter } from '@/components/admin/FilterSidebar'

// Status badge with colors matching Figma design
function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    PRIPRAVA: 'bg-[#F4F3F5] text-[#554E55]',
    CAKA_NA_TESTY: 'bg-[#F4F3F5] text-[#554E55]',
    TESTOVANIE: 'bg-[#EEEDFC] text-[#302F85]',
    HODNOTENIE: 'bg-[#FFF3E0] text-[#E65100]',
    DOKONCENE: 'bg-[#E6FBEA] text-[#125F52]',
    ZRUSENE: 'bg-[#FBF5F4] text-[#B93429]',
  }

  const labels: Record<string, string> = {
    PRIPRAVA: 'Rozpracované',
    CAKA_NA_TESTY: 'Schválené',
    TESTOVANIE: 'Prebieha testovanie',
    HODNOTENIE: 'Hodnotenie',
    DOKONCENE: 'Vyhovel',
    ZRUSENE: 'Nevyhovel',
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-[10px] text-xs font-medium ${colors[status] || 'bg-[#F4F3F5] text-[#554E55]'}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {labels[status] || status}
    </span>
  )
}

export default function VKPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOption, setSortOption] = useState('newest')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  // Sidebar filters
  const [statusFilter, setStatusFilter] = useState<VKStatusFilter>({
    PRIPRAVA: false,
    CAKA_NA_TESTY: false,
    TESTOVANIE: false,
    HODNOTENIE: false,
    DOKONCENE: false,
    ZRUSENE: false,
  })
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    from: '',
    to: '',
  })

  // Parse sort option into sortBy and sortOrder
  const getSortParams = (option: string): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
    switch (option) {
      case 'oldest':
        return { sortBy: 'createdAt', sortOrder: 'asc' }
      case 'position_asc':
        return { sortBy: 'position', sortOrder: 'asc' }
      case 'position_desc':
        return { sortBy: 'position', sortOrder: 'desc' }
      case 'date_asc':
        return { sortBy: 'startDateTime', sortOrder: 'asc' }
      case 'date_desc':
        return { sortBy: 'startDateTime', sortOrder: 'desc' }
      case 'newest':
      default:
        return { sortBy: 'createdAt', sortOrder: 'desc' }
    }
  }

  const { sortBy, sortOrder } = getSortParams(sortOption)

  // Convert status filter to API format
  const getStatusForAPI = (): string => {
    const activeStatuses = Object.entries(statusFilter)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key)
    return activeStatuses.join(',')
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, dateFilter, sortOption])

  // Use React Query hook
  const { data, isLoading } = useVKs({
    search: debouncedSearch,
    status: getStatusForAPI(),
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
    dateFrom: dateFilter.from,
    dateTo: dateFilter.to,
  })

  const vks = data?.vks ?? []
  const pagination = {
    currentPage: data?.pagination?.page ?? 1,
    totalPages: data?.pagination?.totalPages ?? 1,
    totalItems: data?.pagination?.total ?? 0,
    pageSize: data?.pagination?.limit ?? 10,
  }

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
  }

  // Clear all filters
  const handleClearAll = () => {
    setStatusFilter({
      PRIPRAVA: false,
      CAKA_NA_TESTY: false,
      TESTOVANIE: false,
      HODNOTENIE: false,
      DOKONCENE: false,
      ZRUSENE: false,
    })
    setDateFilter({ from: '', to: '' })
  }

  return (
    <div data-testid="vk-page" className="flex h-[calc(100vh-56px)] bg-ds-grey-40">
      {/* Sidebar Filters */}
      <FilterSidebar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onClearAll={handleClearAll}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bars3Icon className="h-6 w-6 text-[#3F3840]" />
            <h1 data-testid="page-title" className="text-[28px] font-medium text-[#3F3840] font-heading">
              Výberové konania
            </h1>
          </div>
          <Link
            href="/vk/new"
            data-testid="create-vk-button"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ds-purple-80 text-white rounded-[10px] text-sm font-medium hover:bg-ds-purple-100 transition-colors"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Vytvoriť výberové konanie
          </Link>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center justify-between gap-4">
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

          {/* Sort dropdown */}
          <SimpleSelect
            value={sortOption}
            onChange={(value) => setSortOption(value)}
            options={[
              { value: 'newest', label: 'Zoradiť od najnovších' },
              { value: 'oldest', label: 'Zoradiť od najstarších' },
              { value: 'position_asc', label: 'Podľa pozície A-Z' },
              { value: 'position_desc', label: 'Podľa pozície Z-A' },
              { value: 'date_asc', label: 'Podľa termínu (vzostupne)' },
              { value: 'date_desc', label: 'Podľa termínu (zostupne)' },
            ]}
            className="w-52"
            data-testid="sort-dropdown"
          />
        </div>

        {/* Table Header */}
        {!isLoading && vks.length > 0 && (
          <div data-testid="vk-list-header" className="px-6 py-2 flex items-center text-sm text-[#6A646B]">
            <div className="flex-[3] min-w-0"></div>
            <div className="flex-1 text-center">Termín VK</div>
            <div className="flex-1 text-center">Počet uchádzačov</div>
            <div className="flex-[1.5] text-center">Fáza VK</div>
            <div className="w-6"></div>
          </div>
        )}

        {/* Table or Empty state */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="bg-white p-12 rounded-[15px] shadow-sm text-center">
              <div className="text-[#6A646B]">Načítavam...</div>
            </div>
          ) : vks.length === 0 ? (
            <div data-testid="empty-state" className="text-center py-12 bg-white rounded-[15px] shadow-sm">
              {debouncedSearch || Object.values(statusFilter).some(Boolean) || dateFilter.from || dateFilter.to ? (
                <>
                  <h3 data-testid="no-results-title" className="mt-2 text-sm font-medium text-[#3F3840]">Žiadne výsledky</h3>
                  <p data-testid="no-results-message" className="mt-1 text-sm text-[#6A646B]">
                    Skúste zmeniť vyhľadávanie alebo filtre.
                  </p>
                </>
              ) : (
                <>
                  <h3 data-testid="no-vk-title" className="mt-2 text-sm font-medium text-[#3F3840]">Žiadne výberové konania</h3>
                  <p data-testid="no-vk-message" className="mt-1 text-sm text-[#6A646B]">
                    Zatiaľ neboli vytvorené žiadne výberové konania.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/vk/new"
                      data-testid="create-vk-empty-button"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-ds-purple-80 text-white rounded-[10px] text-sm font-medium hover:bg-ds-purple-100 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" aria-hidden="true" />
                      Vytvoriť výberové konanie
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div data-testid="vk-list" className="space-y-2">
              {vks.map((vk) => (
                <div
                  key={vk.id}
                  data-testid={`vk-row-${vk.id}`}
                  onClick={() => router.push(`/vk/${vk.id}`)}
                  className="bg-white border border-[#EAE9EA] rounded-[10px] shadow-[0px_8px_25px_0px_rgba(42,34,43,0.07)] px-6 py-3 flex items-center cursor-pointer hover:border-ds-black-30 transition-colors"
                >
                  {/* Position icon + name + identifier */}
                  <div className="flex-[3] min-w-0 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📋</span>
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-[#3F3840] truncate block">{vk.position}</span>
                      <span className="text-sm text-[#6A646B] truncate block">{vk.identifier}</span>
                    </div>
                  </div>

                  {/* Termín VK */}
                  <div className="flex-1 flex justify-center">
                    <span className="text-sm text-[#3F3840]">
                      {formatDate(vk.startDateTime)}
                    </span>
                  </div>

                  {/* Počet uchádzačov */}
                  <div className="flex-1 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 text-[#3F3840] font-medium text-sm">
                      <UserIcon className="h-4 w-4 text-[#6A646B]" />
                      {vk.candidatesCount || 0}
                    </span>
                  </div>

                  {/* Fáza VK (Status) */}
                  <div className="flex-[1.5] flex justify-center">
                    {getStatusBadge(vk.status)}
                  </div>

                  {/* Arrow */}
                  <ChevronRightIcon className="h-5 w-5 text-[#6A646B] flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && vks.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
