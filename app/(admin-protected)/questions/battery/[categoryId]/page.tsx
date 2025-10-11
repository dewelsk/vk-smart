'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ConfirmModal'
import {
  useQuestionCategory,
  useUpdateQuestionCategory,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '@/hooks/useQuestionCategories'

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

type CategoryFormValues = {
  name: string
  description: string
}

type DeleteContext = {
  id: string
  text: string
}

export default function QuestionCategoryDetailPage({
  params,
}: {
  params: { categoryId: string }
}) {
  const router = useRouter()
  const { categoryId } = params

  const [questionSearch, setQuestionSearch] = useState('')
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editingQuestionText, setEditingQuestionText] = useState('')
  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null)

  const { data, isLoading, error } = useQuestionCategory(categoryId)
  const updateCategoryMutation = useUpdateQuestionCategory()
  const createQuestionMutation = useCreateQuestion()
  const updateQuestionMutation = useUpdateQuestion()
  const deleteQuestionMutation = useDeleteQuestion()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        description: data.description,
      })
    }
  }, [data, reset])

  const filteredQuestions = useMemo(() => {
    if (!data) {
      return []
    }

    if (!questionSearch.trim()) {
      return data.questions
    }

    const lookup = questionSearch.trim().toLowerCase()
    return data.questions.filter((question) => question.text.toLowerCase().includes(lookup))
  }, [data, questionSearch])

  const onSubmitCategory = async (values: CategoryFormValues) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id: categoryId,
        name: values.name.trim(),
        description: values.description.trim(),
      })
      toast.success('Kategória bola uložená')
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa uložiť kategóriu')
    }
  }

  const handleAddQuestion = async () => {
    const text = newQuestionText.trim()
    if (text.length < 5) {
      toast.error('Otázka musí mať aspoň 5 znakov')
      return
    }

    try {
      await createQuestionMutation.mutateAsync({
        categoryId,
        text,
      })
      toast.success('Otázka bola pridaná')
      setNewQuestionText('')
      setIsAddingQuestion(false)
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa pridať otázku')
    }
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId) {
      return
    }

    const text = editingQuestionText.trim()
    if (text.length < 5) {
      toast.error('Otázka musí mať aspoň 5 znakov')
      return
    }

    try {
      await updateQuestionMutation.mutateAsync({
        categoryId,
        questionId: editingQuestionId,
        text,
      })
      toast.success('Otázka bola aktualizovaná')
      setEditingQuestionId(null)
      setEditingQuestionText('')
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa aktualizovať otázku')
    }
  }

  const handleDeleteQuestion = async () => {
    if (!deleteContext) {
      return
    }

    try {
      await deleteQuestionMutation.mutateAsync({
        categoryId,
        questionId: deleteContext.id,
      })
      toast.success('Otázka bola zmazaná')
      setDeleteContext(null)
    } catch (mutationError: any) {
      toast.error(mutationError?.message ?? 'Nepodarilo sa zmazať otázku')
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-12">Načítavam kategóriu…</div>
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Nepodarilo sa načítať kategóriu.</p>
        <button
          type="button"
          onClick={() => router.push('/questions/battery')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Späť na zoznam
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="question-category-detail">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/questions/battery"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Späť na zoznam kategórií
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{data.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Posledná úprava: {formatDate(data.updatedAt)}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-white shadow rounded-md text-center">
            <div className="text-xs uppercase text-gray-500">Počet otázok</div>
            <div className="text-xl font-semibold">{data.questionCount}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitCategory)} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Názov kategórie
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
            {...register('description', { required: 'Popis je povinný' })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting || updateCategoryMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting || updateCategoryMutation.isPending ? 'Ukladám…' : 'Uložiť zmeny'}
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
            <h2 className="text-lg font-semibold text-gray-900">Otázky</h2>
            <p className="text-sm text-gray-600">Spravujte zoznam otázok pre túto kategóriu.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                type="search"
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder="Hľadať otázku"
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAddingQuestion((prev) => !prev)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {!isAddingQuestion && <PlusIcon className="-ml-1 mr-2 h-5 w-5" />}
              {isAddingQuestion ? 'Zrušiť' : 'Pridať otázku'}
            </button>
          </div>
        </div>

        {isAddingQuestion && (
          <div className="px-6 pb-4">
            <label htmlFor="new-question" className="block text-sm font-medium text-gray-700">
              Nová otázka
            </label>
            <textarea
              id="new-question"
              rows={3}
              value={newQuestionText}
              onChange={(event) => setNewQuestionText(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={createQuestionMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {createQuestionMutation.isPending ? 'Ukladám…' : 'Pridať otázku'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingQuestion(false)
                  setNewQuestionText('')
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Zrušiť
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {filteredQuestions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              Zatiaľ tu nie sú žiadne otázky.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Otázka
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question, index) => {
                  const isEditing = editingQuestionId === question.id
                  return (
                    <tr key={question.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={editingQuestionText}
                            onChange={(event) => setEditingQuestionText(event.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        ) : (
                          <p>{question.text}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleUpdateQuestion}
                              disabled={updateQuestionMutation.isPending}
                              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
                            >
                              Uložiť
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(null)
                                setEditingQuestionText('')
                              }}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Zrušiť
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(question.id)
                                setEditingQuestionText(question.text)
                              }}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <PencilIcon className="-ml-1 mr-1 h-4 w-4" />
                              Upraviť
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteContext({ id: question.id, text: question.text })}
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
        title="Vymazať otázku"
        message={
          deleteContext
            ? `Otázka „${deleteContext.text.slice(0, 80)}${deleteContext.text.length > 80 ? '…' : ''}“ bude nenávratne odstránená. Pokračovať?`
            : 'Otázka bude nenávratne odstránená.'
        }
        confirmLabel={deleteQuestionMutation.isPending ? 'Odstraňujem…' : 'Vymazať'}
        onConfirm={handleDeleteQuestion}
        onCancel={() => setDeleteContext(null)}
      />
    </div>
  )
}
