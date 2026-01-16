'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  Bars3Icon,
  UserIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useVKs } from '@/hooks/useVKs'
import FilterSidebar, { type VKStatusFilter, type DateFilter } from '@/components/admin/FilterSidebar'

type SortOption = {
  value: string
  label: string
}

const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Zoradiť od najnovších' },
  { value: 'oldest', label: 'Zoradiť od najstarších' },
  { value: 'position', label: 'Podľa pozície (A-Z)' },
  { value: 'position_desc', label: 'Podľa pozície (Z-A)' },
]

// Status badge with colors matching Figma design
function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    PRIPRAVA: 'bg-ds-grey-50 text-ds-black-100',
    CAKA_NA_TESTY: 'bg-ds-grey-50 text-ds-black-100',
    TESTOVANIE: 'bg-ds-purple-10 text-ds-purple-80',
    HODNOTENIE: 'bg-[#FFF3E0] text-[#E65100]',
    DOKONCENE: 'bg-ds-green-light text-ds-green',
    ZRUSENE: 'bg-ds-red-light text-ds-red',
  }

  const labels: Record<string, string> = {
    PRIPRAVA: 'Rozpracované',
    CAKA_NA_TESTY: 'Čaká na dokumenty',
    TESTOVANIE: 'Písomná časť',
    HODNOTENIE: 'Ústna časť',
    DOKONCENE: 'Vyhovel',
    ZRUSENE: 'Nevyhovel',
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[120px] px-4 py-1.5 rounded-full text-sm font-medium text-center ${colors[status] || 'bg-ds-grey-50 text-ds-black-100'}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {labels[status] || status}
    </span>
  )
}

// Status icon colors for the card (circle with letter)
function getStatusIconColor(status: string): string {
  const colors: Record<string, string> = {
    PRIPRAVA: 'bg-ds-grey-50',
    CAKA_NA_TESTY: 'bg-ds-purple-10',
    TESTOVANIE: 'bg-ds-purple-10',
    HODNOTENIE: 'bg-[#FFF3E0]',
    DOKONCENE: 'bg-ds-green-light',
    ZRUSENE: 'bg-ds-red-light',
  }
  return colors[status] || 'bg-ds-grey-50'
}

// Default status filter state
const defaultStatusFilter: VKStatusFilter = {
  PRIPRAVA: false,
  CAKA_NA_TESTY: false,
  TESTOVANIE: false,
  HODNOTENIE: false,
  DOKONCENE: false,
  ZRUSENE: false,
}

// Default date filter state
const defaultDateFilter: DateFilter = {
  from: '',
  to: '',
}

export default function VKPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>(sortOptions[0])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [showFilterSidebar, setShowFilterSidebar] = useState(true)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<VKStatusFilter>(defaultStatusFilter)
  const [dateFilter, setDateFilter] = useState<DateFilter>(defaultDateFilter)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, dateFilter, sortBy])

  // Build status filter string for API
  const getActiveStatuses = (): string => {
    const activeStatuses = Object.entries(statusFilter)
      .filter(([_, isActive]) => isActive)
      .map(([status]) => status)
    return activeStatuses.join(',')
  }

  // Use React Query hook
  const { data, isLoading, isFetching } = useVKs({
    search: debouncedSearch,
    status: getActiveStatuses(),
    page,
    limit: pageSize,
    dateFrom: dateFilter.from,
    dateTo: dateFilter.to,
    // sortBy could be added to the hook if needed
  })

  const vks = data?.vks ?? []
  const pagination = data?.pagination

  // Clear all filters
  const handleClearAllFilters = () => {
    setStatusFilter(defaultStatusFilter)
    setDateFilter(defaultDateFilter)
  }

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white gap-2 p-2" data-testid="vk-page">
      {/* Filter Sidebar */}
      {showFilterSidebar && (
        <FilterSidebar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-ds-grey-40 rounded-[15px]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                className="p-2 rounded-[10px] text-ds-black-30 hover:text-ds-black-100 hover:bg-ds-grey-50"
                data-testid="toggle-filters-button"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
              <h1 className="font-heading text-[28px] font-medium text-ds-black-100" data-testid="page-title">
                Výberové konania
              </h1>
            </div>

            <Link
              href="/vk/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-ds-purple-80 text-white text-sm font-medium rounded-[10px] hover:opacity-90 transition-opacity"
              data-testid="create-vk-button"
            >
              <PlusIcon className="h-5 w-5" />
              Vytvoriť výberové konanie
            </Link>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center justify-between gap-4 mb-6">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ds-black-30" />
              <input
                type="text"
                placeholder="Vyhľadávať"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-ds-grey-50 bg-white rounded-[10px] focus:ring-ds-purple-80 focus:border-ds-purple-80 text-sm text-ds-black-100 placeholder:text-ds-black-30"
                data-testid="search-input"
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="animate-spin h-5 w-5 text-ds-purple-80"
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

            {/* Sort */}
            <select
              value={sortBy.value}
              onChange={(e) => {
                const selected = sortOptions.find((opt) => opt.value === e.target.value)
                if (selected) setSortBy(selected)
              }}
              className="px-4 py-2.5 border border-ds-grey-50 bg-white rounded-[10px] text-sm text-ds-black-100 focus:ring-ds-purple-80 focus:border-ds-purple-80"
              data-testid="sort-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 text-sm text-ds-black-30 font-medium">
            <div className="col-span-5"></div>
            <div className="col-span-2">Termín VK</div>
            <div className="col-span-2">Počet uchádzačov</div>
            <div className="col-span-2">Fáza VK</div>
            <div className="col-span-1"></div>
          </div>

          {/* VK List */}
          {isLoading ? (
            <div className="bg-white rounded-[15px] p-12 text-center">
              <div className="text-ds-black-30">Načítavam...</div>
            </div>
          ) : vks.length === 0 ? (
            <div className="bg-white rounded-[15px] p-12 text-center" data-testid="empty-state">
              <div className="text-ds-black-30">Žiadne výberové konania</div>
            </div>
          ) : (
            <div className="space-y-2" data-testid="vk-list">
              {vks.map((vk) => (
                <div
                  key={vk.id}
                  onClick={() => router.push(`/vk/${vk.id}`)}
                  className="bg-white rounded-[15px] border-2 border-transparent hover:border-ds-black-30 transition-all cursor-pointer"
                  data-testid={`vk-card-${vk.id}`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center px-5 py-4">
                    {/* Icon + Position Info */}
                    <div className="col-span-12 lg:col-span-5 flex items-center gap-4">
                      <div
                        className={`h-11 w-11 rounded-full ${getStatusIconColor(vk.status)} flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-lg font-medium text-ds-black-100">
                          {vk.position.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-ds-black-100 truncate">
                          {vk.position}
                        </div>
                        <div className="text-sm text-ds-black-30 truncate">
                          {vk.identifier}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-6 lg:col-span-2 text-sm text-ds-black-100">
                      <span className="lg:hidden text-ds-black-30">Termín: </span>
                      {formatDate(vk.startDateTime)}
                    </div>

                    {/* Applicants Count - Badge */}
                    <div className="col-span-6 lg:col-span-2">
                      <span className="lg:hidden text-ds-black-30 text-sm">Uchádzači: </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ds-grey-40 rounded-full text-sm text-ds-black-100">
                        <UserIcon className="h-4 w-4 text-ds-black-30" />
                        {vk.candidatesCount || 0}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-10 lg:col-span-2">
                      {getStatusBadge(vk.status)}
                    </div>

                    {/* Arrow */}
                    <div className="col-span-2 lg:col-span-1 flex justify-end">
                      <ArrowRightIcon className="h-5 w-5 text-ds-black-30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8" data-testid="pagination">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-[10px] text-ds-black-30 hover:bg-ds-grey-40 disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="pagination-prev"
              >
                <ChevronRightIcon className="h-5 w-5 rotate-180" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[40px] h-10 rounded-[10px] text-sm font-medium ${
                        page === pageNum
                          ? 'bg-ds-grey-40 text-ds-black-100'
                          : 'text-ds-black-30 hover:bg-ds-grey-40'
                      }`}
                      data-testid={`pagination-page-${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {pagination.totalPages > 5 && page < pagination.totalPages - 2 && (
                  <>
                    <span className="px-2 text-ds-black-30">...</span>
                    <button
                      onClick={() => setPage(pagination.totalPages)}
                      className="min-w-[40px] h-10 rounded-[10px] text-sm font-medium text-ds-black-30 hover:bg-ds-grey-40"
                      data-testid="pagination-last"
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-[10px] text-ds-black-30 hover:bg-ds-grey-40 disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="pagination-next"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
