'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Nezobrazuj pagináciu ak je len 1 stránka
  if (totalPages <= 1) {
    return null
  }

  // Generovanie stránok pre pagináciu
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex justify-center">
      <div className="bg-white border border-[#EAE9EA] rounded-[10px] shadow-[0px_8px_25px_0px_rgba(42,34,43,0.07)] p-2 flex items-center gap-4">
        {/* Prev button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded border border-[#D4D3D5] ${
            currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
          aria-label="Predchádzajúca stránka"
        >
          <ChevronLeftIcon className="h-5 w-5 text-[#2A222B]" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((pageNum, index) => (
          <button
            key={index}
            onClick={() => typeof pageNum === 'number' && onPageChange(pageNum)}
            disabled={pageNum === '...'}
            className={`w-10 h-10 flex items-center justify-center rounded text-base font-medium ${
              pageNum === currentPage
                ? 'bg-ds-purple-10 border border-ds-purple-80 text-ds-purple-80'
                : pageNum === '...'
                ? 'cursor-default text-[#2A222B]'
                : 'bg-white text-[#2A222B] hover:bg-gray-50'
            }`}
            aria-label={typeof pageNum === 'number' ? `Stránka ${pageNum}` : undefined}
            aria-current={pageNum === currentPage ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded border border-[#D4D3D5] ${
            currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
          aria-label="Nasledujúca stránka"
        >
          <ChevronRightIcon className="h-5 w-5 text-[#2A222B]" />
        </button>
      </div>
    </div>
  )
}
