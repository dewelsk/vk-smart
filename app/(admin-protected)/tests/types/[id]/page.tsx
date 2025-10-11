'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ConfirmModal'
import {
  useTestType,
  useUpdateTestType,
  useCreateTestTypeCondition,
  useUpdateTestTypeCondition,
  useDeleteTestTypeCondition,
} from '@/hooks/useTestTypes'

function formatDate(value: string) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type TypeFormValues = {
  name: string
  description: string
}

type DeleteContext = {
  id: string
  name: string
}

export default function TestTypeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [isAddingCondition, setIsAddingCondition] = useState(false)
  const [newConditionName, setNewConditionName] = useState('')
  const [newConditionDescription, setNewConditionDescription] = useState('')
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null)
  const [editingConditionName, setEditingConditionName] = useState('')
  const [editingConditionDescription, setEditingConditionDescription] = useState('')
  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null)

  const { data, isLoading, error } = useTestType(id)
  const updateTypeMutation = useUpdateTestType()
  const createConditionMutation = useCreateTestTypeCondition()
  const updateConditionMutation = useUpdateTestTypeCondition()
  const deleteConditionMutation = useDeleteTestTypeCondition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TypeFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        description: data.description ?? '',
      })
    }
  }, [data, reset])

  const sortedConditions = useMemo(() => {
    if (!data) return []
    return [...data.conditions].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [data])

  const onSubmitType = async (values: TypeFormValues) => {
    try {
      await updateTypeMutation.mutateAsync({
        id,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      })
      toast.success('Typ testu bol uložený')
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa uložiť typ testu')
    }
  }

  const handleStartEditCondition = (conditionId: string, name: string, description: string | null) => {
    setEditingConditionId(conditionId)
    setEditingConditionName(name)
    setEditingConditionDescription(description ?? '')
  }

  const handleCancelConditionEdit = () => {
    setEditingConditionId(null)
    setEditingConditionName('')
    setEditingConditionDescription('')
  }

  const handleAddCondition = async () => {
    const trimmedName = newConditionName.trim()
    if (!trimmedName) {
      toast.error('Názov podmienky je povinný')
      return
    }

    try {
      await createConditionMutation.mutateAsync({
        testTypeId: id,
        name: trimmedName,
        description: newConditionDescription.trim() || undefined,
      })
      toast.success('Podmienka bola pridaná')
      setIsAddingCondition(false)
      setNewConditionName('')
      setNewConditionDescription('')
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa pridať podmienku')
    }
  }

  const handleUpdateCondition = async () => {
    if (!editingConditionId) return

    const trimmedName = editingConditionName.trim()
    if (!trimmedName) {
      toast.error('Názov podmienky je povinný')
      return
    }

    try {
      await updateConditionMutation.mutateAsync({
        testTypeId: id,
        conditionId: editingConditionId,
        name: trimmedName,
        description: editingConditionDescription.trim() || undefined,
      })
      toast.success('Podmienka bola aktualizovaná')
      handleCancelConditionEdit()
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa aktualizovať podmienku')
    }
  }

  const handleDeleteCondition = async () => {
    if (!deleteContext) return

    try {
      await deleteConditionMutation.mutateAsync({
        testTypeId: id,
        conditionId: deleteContext.id,
      })
      toast.success('Podmienka bola odstránená')
      setDeleteContext(null)
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa odstrániť podmienku')
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-12">Načítavam typ testu…</div>
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Nepodarilo sa načítať typ testu.</p>
        <button
          type="button"
          onClick={() => router.push('/tests/types')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Späť na zoznam
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="test-type-detail">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/tests/types"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Späť na zoznam typov
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{data.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Posledná úprava: {formatDate(data.updatedAt)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitType)} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Názov typu
          </label>
          <input
            id="name"
            type="text"
            {...register('name', { required: 'Názov je povinný' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Popis
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting || updateTypeMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting || updateTypeMutation.isPending ? 'Ukladám…' : 'Uložiť zmeny'}
          </button>
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-transparent"
          >
            Zrušiť
          </button>
        </div>
      </form>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Podmienky typu testu</h2>
            <p className="text-sm text-gray-600">Definujte požiadavky pre jednotlivé úrovne alebo rolové scenáre.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAddingCondition((prev) => !prev)
              setNewConditionName('')
              setNewConditionDescription('')
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {!isAddingCondition && <PlusIcon className="-ml-1 mr-2 h-5 w-5" />}
            {isAddingCondition ? 'Zrušiť pridávanie' : 'Pridať podmienku'}
          </button>
        </div>

        {isAddingCondition && (
          <div className="px-6 pb-4 space-y-4">
            <div>
              <label htmlFor="new-condition-name" className="block text-sm font-medium text-gray-700">
                Názov
              </label>
              <input
                id="new-condition-name"
                type="text"
                value={newConditionName}
                onChange={(event) => setNewConditionName(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="new-condition-description" className="block text-sm font-medium text-gray-700">
                Popis (voliteľný)
              </label>
              <textarea
                id="new-condition-description"
                rows={3}
                value={newConditionDescription}
                onChange={(event) => setNewConditionDescription(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddCondition}
                disabled={createConditionMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {createConditionMutation.isPending ? 'Ukladám…' : 'Pridať podmienku'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCondition(false)
                  setNewConditionName('')
                  setNewConditionDescription('')
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Zrušiť
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {sortedConditions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              Zatiaľ nie sú definované žiadne podmienky.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Poradie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Názov
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Popis
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedConditions.map((condition, index) => {
                  const isEditing = editingConditionId === condition.id
                  return (
                    <tr key={condition.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingConditionName}
                            onChange={(event) => setEditingConditionName(event.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        ) : (
                          condition.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={editingConditionDescription}
                            onChange={(event) => setEditingConditionDescription(event.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        ) : (
                          condition.description || '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleUpdateCondition}
                              disabled={updateConditionMutation.isPending}
                              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                            >
                              Uložiť
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelConditionEdit}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Zrušiť
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditCondition(condition.id, condition.name, condition.description)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <PencilIcon className="-ml-1 mr-1 h-4 w-4" />
                              Upraviť
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteContext({ id: condition.id, name: condition.name })}
                              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                              <TrashIcon className="-ml-1 mr-1 h-4 w-4" />
                              Vymazať
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteContext)}
        title="Vymazať podmienku"
        message={
          deleteContext
            ? `Podmienka „${deleteContext.name}“ bude nenávratne odstránená. Pokračovať?`
            : 'Podmienka bude nenávratne odstránená. Pokračovať?'
        }
        confirmLabel={deleteConditionMutation.isPending ? 'Odstraňujem…' : 'Vymazať'}
        onConfirm={handleDeleteCondition}
        onCancel={() => setDeleteContext(null)}
      />
    </div>
  )
}
