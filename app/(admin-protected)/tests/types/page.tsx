'use client'

import { useState } from 'react'
import { DataTable } from '@/components/table/DataTable'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useTestTypes, useCreateTestType, useUpdateTestType, useDeleteTestType, type TestType } from '@/hooks/useTestTypes'
import { toast } from 'react-hot-toast'

export default function TestTypesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<TestType | null>(null)
  const [deletingType, setDeletingType] = useState<TestType | null>(null)

  const { data, isLoading } = useTestTypes({ page, limit: pageSize })
  const createMutation = useCreateTestType()
  const updateMutation = useUpdateTestType()
  const deleteMutation = useDeleteTestType()

  const testTypes = data?.testTypes ?? []
  const pagination = {
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    totalItems: data?.total ?? 0,
    pageSize: data?.limit ?? 10,
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    try {
      await createMutation.mutateAsync({ name, description: description || undefined })
      toast.success('Typ testu bol vytvorený')
      setIsCreateModalOpen(false)
      e.currentTarget.reset()
    } catch (error: any) {
      toast.error(error.message || 'Chyba pri vytváraní typu testu')
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingType) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    try {
      await updateMutation.mutateAsync({
        id: editingType.id,
        name,
        description: description || undefined
      })
      toast.success('Typ testu bol aktualizovaný')
      setEditingType(null)
    } catch (error: any) {
      toast.error(error.message || 'Chyba pri aktualizácii typu testu')
    }
  }

  const handleDelete = async () => {
    if (!deletingType) return

    try {
      await deleteMutation.mutateAsync(deletingType.id)
      toast.success('Typ testu bol vymazaný')
      setDeletingType(null)
    } catch (error: any) {
      toast.error(error.message || 'Chyba pri vymazávaní typu testu')
    }
  }

  const columns: ColumnDef<TestType>[] = [
    {
      accessorKey: 'name',
      header: 'Názov',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Popis',
      cell: ({ row }) => (
        <span className="text-gray-600">{row.original.description || '-'}</span>
      ),
    },
    {
      accessorKey: 'categoryCount',
      header: 'Počet kategórií',
      cell: ({ row }) => (
        <span className="text-gray-900">{row.original.categoryCount}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingType(row.original)}
            className="text-blue-600 hover:text-blue-800"
            title="Upraviť"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDeletingType(row.original)}
            className="text-red-600 hover:text-red-800"
            title="Vymazať"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Typy testov</h1>
          <p className="mt-2 text-sm text-gray-700">
            Správa typov testov (napr. Štátny jazyk, Cudzí jazyk, IT zručnosti)
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Vytvoriť typ testu
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-gray-500">Načítavam...</div>
        </div>
      ) : testTypes.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne typy testov</h3>
          <p className="mt-1 text-sm text-gray-500">
            Začnite vytvorením prvého typu testu.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Vytvoriť typ testu
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <DataTable
            columns={columns}
            data={testTypes}
            loading={isLoading}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vytvoriť typ testu</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Názov *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Popis
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Vytváranie...' : 'Vytvoriť'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upraviť typ testu</h2>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                    Názov *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="edit-name"
                    defaultValue={editingType.name}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Popis
                  </label>
                  <textarea
                    name="description"
                    id="edit-description"
                    defaultValue={editingType.description || ''}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Ukladanie...' : 'Uložiť'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingType && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vymazať typ testu</h2>
            <p className="text-sm text-gray-600 mb-6">
              Naozaj chcete vymazať typ testu <strong>{deletingType.name}</strong>?
              {deletingType.categoryCount > 0 && (
                <span className="block mt-2 text-red-600">
                  Tento typ má priradených {deletingType.categoryCount} kategórií a nemožno ho vymazať.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingType(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Zrušiť
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending || deletingType.categoryCount > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Vymazávanie...' : 'Vymazať'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
