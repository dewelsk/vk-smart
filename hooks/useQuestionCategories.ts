import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type QuestionCategorySummary = {
  id: string
  name: string
  description: string
  questionCount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type QuestionItem = {
  id: string
  categoryId: string
  text: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type QuestionCategoryDetail = QuestionCategorySummary & {
  questions: QuestionItem[]
}

async function fetchQuestionCategories(): Promise<QuestionCategorySummary[]> {
  const response = await fetch('/api/admin/question-categories')

  if (!response.ok) {
    throw new Error('Failed to fetch question categories')
  }

  const data = await response.json()
  return data.categories as QuestionCategorySummary[]
}

export function useQuestionCategories() {
  return useQuery({
    queryKey: ['question-categories'],
    queryFn: fetchQuestionCategories,
    staleTime: 30_000,
  })
}

async function fetchQuestionCategory(categoryId: string): Promise<QuestionCategoryDetail> {
  const response = await fetch(`/api/admin/question-categories/${categoryId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch question category detail')
  }

  return response.json()
}

export function useQuestionCategory(categoryId: string, enabled = true) {
  return useQuery({
    queryKey: ['question-category', categoryId],
    queryFn: () => fetchQuestionCategory(categoryId),
    enabled: Boolean(categoryId) && enabled,
    staleTime: 10_000,
  })
}

type UpdateCategoryPayload = {
  id: string
  name: string
  description: string
}

async function updateQuestionCategory(payload: UpdateCategoryPayload): Promise<QuestionCategoryDetail> {
  const response = await fetch(`/api/admin/question-categories/${payload.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: payload.name, description: payload.description }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to update category')
  }

  return response.json()
}

export function useUpdateQuestionCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateQuestionCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] })
      queryClient.invalidateQueries({ queryKey: ['question-category', data.id] })
    },
  })
}

type CreateQuestionPayload = {
  categoryId: string
  text: string
}

type CreateQuestionResponse = {
  question: QuestionItem
  questionCount: number
  categoryUpdatedAt: string
}

async function createQuestion(payload: CreateQuestionPayload): Promise<CreateQuestionResponse> {
  const response = await fetch(
    `/api/admin/question-categories/${payload.categoryId}/questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: payload.text }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to create question')
  }

  return response.json()
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createQuestion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] })
      queryClient.invalidateQueries({ queryKey: ['question-category', data.question.categoryId] })
    },
  })
}

type UpdateQuestionPayload = {
  categoryId: string
  questionId: string
  text: string
}

type UpdateQuestionResponse = {
  question: QuestionItem
  categoryUpdatedAt: string
}

async function updateQuestion(payload: UpdateQuestionPayload): Promise<UpdateQuestionResponse> {
  const response = await fetch(
    `/api/admin/question-categories/${payload.categoryId}/questions/${payload.questionId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: payload.text }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to update question')
  }

  const data = await response.json()
  return {
    question: { ...data.question, categoryId: payload.categoryId },
    categoryUpdatedAt: data.categoryUpdatedAt,
  }
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateQuestion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] })
      queryClient.invalidateQueries({
        queryKey: ['question-category', variables.categoryId],
      })
    },
  })
}

type DeleteQuestionPayload = {
  categoryId: string
  questionId: string
}

type DeleteQuestionResponse = {
  questionCount: number
  categoryUpdatedAt: string
}

async function deleteQuestion(payload: DeleteQuestionPayload): Promise<DeleteQuestionResponse> {
  const response = await fetch(
    `/api/admin/question-categories/${payload.categoryId}/questions/${payload.questionId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to delete question')
  }

  return response.json()
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] })
      queryClient.invalidateQueries({
        queryKey: ['question-category', variables.categoryId],
      })
    },
  })
}
