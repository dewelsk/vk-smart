import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

type TestTypeSummary = {
  id: string
  name: string
  description: string | null
}

type TestTypeConditionSummary = {
  id: string
  name: string
  description: string | null
}

export type Test = {
  id: string
  name: string
  testTypeId: string
  testType: TestTypeSummary | null
  testTypeConditionId: string | null
  testTypeCondition: TestTypeConditionSummary | null
  description: string | null
  questionCount: number
  allowedQuestionTypes?: string[]
  questions?: any
  recommendedDuration: number | null
  recommendedQuestionCount: number | null
  recommendedScore: number | null
  difficulty: number | null
  approved: boolean
  approvedAt: Date | null
  practiceEnabled: boolean
  categoryId: string | null
  category: {
    id: string
    name: string
  } | null
  author: {
    id: string
    name: string
    surname: string
  } | null
  usage: {
    totalVKs: number
    activeVKs: number
    hasActiveUsage: boolean
  }
  createdAt: Date
  updatedAt: Date
}

type UseTestsParams = {
  search?: string
  testTypeId?: string
  approved?: boolean | 'all'
  authorId?: string
  categoryId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

type TestsResponse = {
  tests: Test[]
  total: number
  page: number
  limit: number
  pages: number
}

async function fetchTests(params: UseTestsParams): Promise<TestsResponse> {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.set('search', params.search)
  if (params.testTypeId) queryParams.set('type', params.testTypeId)
  if (params.approved !== undefined && params.approved !== 'all') {
    queryParams.set('approved', String(params.approved))
  }
  if (params.authorId) queryParams.set('authorId', params.authorId)
  if (params.categoryId) queryParams.set('categoryId', params.categoryId)
  if (params.page) queryParams.set('page', String(params.page))
  if (params.limit) queryParams.set('limit', String(params.limit))
  if (params.sortBy) queryParams.set('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder)

  const response = await fetch(`/api/admin/tests?${queryParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch tests')
  }

  return response.json()
}

export function useTests(params: UseTestsParams = {}) {
  return useQuery({
    queryKey: ['tests', params],
    queryFn: () => fetchTests(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
}

// Fetch single test
async function fetchTest(id: string): Promise<{ test: Test }> {
  const response = await fetch(`/api/admin/tests/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch test')
  }

  return response.json()
}

export function useTest(id: string) {
  return useQuery({
    queryKey: ['test', id],
    queryFn: () => fetchTest(id),
    enabled: !!id,
  })
}

// Update test
type UpdateTestData = {
  id: string
  name?: string
  description?: string | null
  testTypeId?: string
  testTypeConditionId?: string | null
  recommendedDuration?: number
  recommendedQuestionCount?: number
  recommendedScore?: number
  approved?: boolean
  practiceEnabled?: boolean
  categoryId?: string
  questions?: any[]
}

async function updateTest(data: UpdateTestData): Promise<{ test: Test }> {
  const { id, ...updateData } = data

  const response = await fetch(`/api/admin/tests/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update test')
  }

  return response.json()
}

export function useUpdateTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTest,
    onSuccess: async (data) => {
      // Refetch test detail immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ['test', data.test.id] })
      // Invalidate tests list
      queryClient.invalidateQueries({ queryKey: ['tests'] })
    },
  })
}

// Clone test
async function cloneTest(id: string): Promise<{ test: Test }> {
  const response = await fetch(`/api/admin/tests/${id}/clone`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Nepodarilo sa naklonovať test')
  }

  return response.json()
}

export function useCloneTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cloneTest,
    onSuccess: () => {
      // Invalidate tests list to show new cloned test
      queryClient.invalidateQueries({ queryKey: ['tests'] })
    },
  })
}

// Delete test
async function deleteTest(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/admin/tests/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Nepodarilo sa vymazať test')
  }

  return response.json()
}

export function useDeleteTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTest,
    onSuccess: () => {
      // Invalidate tests list to remove deleted test
      queryClient.invalidateQueries({ queryKey: ['tests'] })
    },
  })
}
