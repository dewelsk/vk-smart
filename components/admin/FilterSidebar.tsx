'use client'

import { useState } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export type VKStatusFilter = {
  PRIPRAVA: boolean
  CAKA_NA_TESTY: boolean
  TESTOVANIE: boolean
  HODNOTENIE: boolean
  DOKONCENE: boolean
  ZRUSENE: boolean
}

export type DateFilter = {
  from: string
  to: string
}

interface FilterSidebarProps {
  statusFilter: VKStatusFilter
  onStatusChange: (status: VKStatusFilter) => void
  dateFilter: DateFilter
  onDateChange: (date: DateFilter) => void
  onClearAll: () => void
}

const statusLabels: Record<keyof VKStatusFilter, string> = {
  PRIPRAVA: 'Rozpracované',
  CAKA_NA_TESTY: 'Schválené',
  TESTOVANIE: 'Prebieha testovanie',
  HODNOTENIE: 'Hodnotenie',
  DOKONCENE: 'Ukončené',
  ZRUSENE: 'Archivované',
}

export default function FilterSidebar({
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  onClearAll,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['status', 'date'])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const handleStatusToggle = (key: keyof VKStatusFilter) => {
    onStatusChange({
      ...statusFilter,
      [key]: !statusFilter[key],
    })
  }

  // Count active status filters
  const activeStatusCount = Object.values(statusFilter).filter(Boolean).length

  // Check if any filters are active
  const hasActiveFilters = activeStatusCount > 0 || dateFilter.from || dateFilter.to

  // Count active date filters
  const activeDateCount = (dateFilter.from ? 1 : 0) + (dateFilter.to ? 1 : 0)

  return (
    <aside className="w-64 bg-ds-grey-40 flex-shrink-0 overflow-y-auto overflow-x-hidden" data-testid="filter-sidebar">
      {/* Header */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-ds-black-30" />
          <span className="text-base font-medium text-ds-black-100">Filtre</span>
        </div>
      </div>

      {/* Filter Sections */}
      <div className="space-y-1">
        {/* Status Filter */}
        <div className="py-2" data-testid="filter-section-status">
          <button
            onClick={() => toggleSection('status')}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px]"
          >
            <div className="flex items-center gap-2">
              {activeStatusCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-ds-purple-80 text-white text-xs font-medium">
                  {activeStatusCount}
                </span>
              )}
              <span className="text-sm font-medium text-ds-black-100">Stav výb. konania</span>
            </div>
            {expandedSections.includes('status') ? (
              <ChevronUpIcon className="h-4 w-4 text-ds-black-30" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
            )}
          </button>

          {expandedSections.includes('status') && (
            <div className="mt-2 px-4 space-y-1" data-testid="status-filter-options">
              {(Object.keys(statusLabels) as Array<keyof VKStatusFilter>).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer group py-1.5 px-2 rounded-[10px] hover:bg-ds-grey-40"
                >
                  <input
                    type="checkbox"
                    checked={statusFilter[key]}
                    onChange={() => handleStatusToggle(key)}
                    className="h-4 w-4 rounded border-ds-black-30 text-ds-purple-80 focus:ring-ds-purple-80"
                    data-testid={`status-filter-${key.toLowerCase()}`}
                  />
                  <span className="text-sm text-ds-black-100">
                    {statusLabels[key]}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div className="py-2" data-testid="filter-section-date">
          <button
            onClick={() => toggleSection('date')}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px]"
          >
            <div className="flex items-center gap-2">
              {activeDateCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-ds-purple-80 text-white text-xs font-medium">
                  {activeDateCount}
                </span>
              )}
              <span className="text-sm font-medium text-ds-black-100">Dátum konania</span>
            </div>
            {expandedSections.includes('date') ? (
              <ChevronUpIcon className="h-4 w-4 text-ds-black-30" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
            )}
          </button>

          {expandedSections.includes('date') && (
            <div className="mt-2 px-4 space-y-3" data-testid="date-filter-options">
              <div>
                <label className="block text-xs text-ds-black-30 mb-1">Od</label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => onDateChange({ ...dateFilter, from: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-ds-grey-50 bg-white rounded-[10px] focus:ring-ds-purple-80 focus:border-ds-purple-80 text-ds-black-100"
                  data-testid="date-filter-from"
                />
              </div>
              <div>
                <label className="block text-xs text-ds-black-30 mb-1">Do</label>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => onDateChange({ ...dateFilter, to: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-ds-grey-50 bg-white rounded-[10px] focus:ring-ds-purple-80 focus:border-ds-purple-80 text-ds-black-100"
                  data-testid="date-filter-to"
                />
              </div>
              {(dateFilter.from || dateFilter.to) && (
                <button
                  onClick={() => onDateChange({ from: '', to: '' })}
                  className="flex items-center gap-1 text-xs text-ds-black-30 hover:text-ds-black-100"
                  data-testid="clear-date-filter"
                >
                  <XMarkIcon className="h-3 w-3" />
                  Zrušiť dátum
                </button>
              )}
            </div>
          )}
        </div>

        {/* Additional placeholder sections to match Figma design */}
        <div className="py-2">
          <button className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ds-black-100">Typ výb. konania</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
          </button>
        </div>

        <div className="py-2">
          <button className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ds-black-100">Pracovná pozícia</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
          </button>
        </div>

        <div className="py-2">
          <button className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ds-black-100">Komisia</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
          </button>
        </div>

        <div className="py-2">
          <button className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ds-black-100">Počet uchádzačov</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
          </button>
        </div>

        <div className="py-2">
          <button className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-ds-grey-50 rounded-[10px] opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ds-black-100">Stav testov</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-ds-black-30" />
          </button>
        </div>
      </div>
    </aside>
  )
}
