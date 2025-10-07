'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Select from 'react-select'
import { DataTable } from '@/components/table/DataTable'
import { PageHeader } from '@/components/PageHeader'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { ColumnDef } from '@tanstack/react-table'
import { useTestCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type TestCategory } from '@/hooks/useTestCategories'
import { useTestTypes } from '@/hooks/useTestTypes'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

type TestTypeOption = {
  value: string
  label: string
}

function getTestTypeBadge(typeName: string | null) {
  if (!typeName) return <span className="text-gray-500">-</span>

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {typeName}
    </span>
  )
}

type CategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  category?: TestCategory | null
}

function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<TestTypeOption | null>(null)
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<{ name?: string; type?: string }>({})

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  // Fetch test types for dropdown
  const { data: testTypesData } = useTestTypes({ limit: 100 })
  const testTypeOptions: TestTypeOption[] = testTypesData?.testTypes.map(t => ({
    value: t.id,
    label: t.name
  })) || []

  useEffect(() => {
    if (category) {
      setName(category.name)
      setType(category.type ? { value: category.type.id, label: category.type.name } : null)
      setDescription(category.description || '')
    } else {
      setName('')
      setType(null)
      setDescription('')
    }
    setErrors({})
  }, [category, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { name?: string; type?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Názov kategórie je povinný'
    }

    if (!type) {
      newErrors.type = 'Typ testu je povinný'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    try {
      if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          name,
          typeId: type.value,
          description: description || null
        })
        toast.success('Kategória bola úspešne aktualizovaná')
      } else {
        await createMutation.mutateAsync({
          name,
          typeId: type.value,
          description: description || null
        })
        toast.success('Kategória bola úspešne vytvorená')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Nepodarilo sa uložiť kategóriu')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {category ? 'Upraviť kategóriu' : 'Pridať kategóriu'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Názov kategórie *
                  </label>
                  <input
                    data-testid="category-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined })
                      }
                    }}
                    className={`
                      mt-1 block w-full border rounded-md shadow-sm py-2 px-3
                      focus:outline-none focus:ring-1 sm:text-sm
                      ${errors.name
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                      }
                    `}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600" data-testid="category-name-error">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Typ testu *
                  </label>
                  <div data-testid="category-type-select">
                    <Select
                      value={type}
                      onChange={(option) => {
                        setType(option)
                        if (errors.type) {
                          setErrors({ ...errors, type: undefined })
                        }
                      }}
                      options={testTypeOptions}
                      placeholder="Vyberte typ testu"
                      className="mt-1"
                      inputId="category-type-select-input"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        control: (base) => ({
                          ...base,
                          borderColor: errors.type ? '#ef4444' : base.borderColor,
                          '&:hover': {
                            borderColor: errors.type ? '#ef4444' : base.borderColor,
                          }
                        })
                      }}
                    />
                  </div>
                  {errors.type && (
                    <p className="mt-2 text-sm text-red-600" data-testid="category-type-error">
                      {errors.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Popis
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Ukladám...' : 'Uložiť kategóriu'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Zrušiť
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function TestCategoriesPage() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TestTypeOption | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TestCategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<TestCategory | null>(null)

  const deleteMutation = useDeleteCategory()

  // Fetch test types for filter dropdown
  const { data: testTypesData } = useTestTypes({ limit: 100 })
  const testTypeOptions: TestTypeOption[] = testTypesData?.testTypes.map(t => ({
    value: t.id,
    label: t.name
  })) || []

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
  }, [typeFilter])

  // Use React Query hook
  const { data, isLoading } = useTestCategories({
    search: debouncedSearch,
    typeId: typeFilter?.value,
    page,
    limit: pageSize,
  })

  const categories = data?.categories ?? []
  const pagination = {
    currentPage: data?.page ?? 1,
    totalPages: data?.pages ?? 1,
    totalItems: data?.total ?? 0,
    pageSize: data?.limit ?? 10,
  }

  const handleEdit = (category: TestCategory) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (category: TestCategory) => {
    if (category.testCount > 0) {
      toast.error('Kategóriu nemožno zmazať - obsahuje testy')
      return
    }
    setCategoryToDelete(category)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id)
      toast.success('Kategória bola úspešne zmazaná')
      setCategoryToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Nepodarilo sa zmazať kategóriu')
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const isSuperAdmin = session?.user?.role === 'SUPERADMIN'

  // Column definitions
  const columns: ColumnDef<TestCategory>[] = [
    {
      accessorKey: 'name',
      header: 'Názov',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Typ testu',
      cell: ({ row }) => getTestTypeBadge(row.original.type?.name || null),
    },
    {
      accessorKey: 'description',
      header: 'Popis',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'testCount',
      header: 'Počet testov',
      cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {row.original.testCount}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Akcie',
      cell: ({ row }) => {
        if (!isSuperAdmin) return null

        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-800"
              title="Upraviť"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="text-red-600 hover:text-red-800"
              title="Zmazať"
              disabled={row.original.testCount > 0}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategórie testov"
        description="Organizácia testov podľa úrovne a špecializácie"
        actions={
          isSuperAdmin ? (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Pridať kategóriu
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Hľadať kategóriu..."
            />
          </div>

          {/* Type filter */}
          <div>
            <Select
              isClearable
              placeholder="Všetky typy"
              value={typeFilter}
              onChange={(option) => setTypeFilter(option)}
              options={testTypeOptions}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table or Empty state */}
      {!isLoading && categories.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne kategórie</h3>
          <p className="mt-1 text-sm text-gray-500">
            Zatiaľ neboli vytvorené žiadne kategórie testov.<br />
            Vytvorte prvú kategóriu pre lepšiu organizáciu.
          </p>
          {isSuperAdmin && (
            <div className="mt-6">
              <button
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Pridať kategóriu
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <DataTable
            columns={columns}
            data={categories}
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

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={editingCategory}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Vymazať kategóriu"
        message={`Naozaj chcete vymazať kategóriu "${categoryToDelete?.name}"?`}
        confirmLabel="Vymazať"
        cancelLabel="Zrušiť"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  )
}
