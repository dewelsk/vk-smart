'use client'

import { useState, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

function getRecordLabel(count: number): string {
  if (count === 1) return 'záznam'
  if (count >= 2 && count <= 4) return 'záznamy'
  return 'záznamov'
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pagination?: boolean
  pageSize?: number
  manualPagination?: boolean
  pageCount?: number
  totalCount?: number
  pageIndex?: number
  onPaginationChange?: (pagination: PaginationState) => void
  pageSizeOptions?: number[]
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = false,
  pageSize = 10,
  manualPagination = false,
  pageCount,
  totalCount,
  pageIndex = 0,
  onPaginationChange,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pageIndex,
    pageSize: pageSize,
  })

  // Sync external pageIndex with internal state
  useEffect(() => {
    setPaginationState((prev) => ({
      ...prev,
      pageIndex: pageIndex,
    }))
  }, [pageIndex])

  // Sync external pageSize with internal state
  useEffect(() => {
    setPaginationState((prev) => ({
      ...prev,
      pageSize: pageSize,
    }))
  }, [pageSize])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(paginationState) : updater
      setPaginationState(newPagination)
      if (onPaginationChange) {
        onPaginationChange(newPagination)
      }
    },
    state: {
      sorting,
      pagination: paginationState,
    },
    manualPagination,
    pageCount: pageCount ?? -1,
  })

  return (
    <div className="rounded-md border border-gray-200 bg-white shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={
                        header.column.getCanSort()
                          ? 'flex items-center gap-2 cursor-pointer select-none'
                          : ''
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="flex flex-col">
                          <ChevronUpIcon
                            className={`h-3 w-3 ${
                              header.column.getIsSorted() === 'asc'
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <ChevronDownIcon
                            className={`h-3 w-3 -mt-1 ${
                              header.column.getIsSorted() === 'desc'
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                        </span>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                Žiadne výsledky
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Predchádzajúca
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nasledujúca
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Celkom{' '}
                <span className="font-medium">
                  {manualPagination ? totalCount ?? 0 : table.getFilteredRowModel().rows.length}
                </span>{' '}
                {getRecordLabel(manualPagination ? totalCount ?? 0 : table.getFilteredRowModel().rows.length)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / strana
                  </option>
                ))}
              </select>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center rounded-l-md px-2 py-1.5 text-xs text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Prvá</span>
                  «
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center px-2 py-1.5 text-xs text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Predchádzajúca</span>
                  ‹
                </button>
                {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIdx) => (
                  <button
                    key={pageIdx}
                    onClick={() => table.setPageIndex(pageIdx)}
                    className={`relative inline-flex items-center px-3 py-1.5 text-xs font-medium ${
                      table.getState().pagination.pageIndex === pageIdx
                        ? 'z-10 bg-blue-600 text-white focus:z-20'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                    }`}
                  >
                    {pageIdx + 1}
                  </button>
                ))}
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center px-2 py-1.5 text-xs text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Nasledujúca</span>
                  ›
                </button>
                <button
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center rounded-r-md px-2 py-1.5 text-xs text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Posledná</span>
                  »
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
