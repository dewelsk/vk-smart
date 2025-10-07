import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type TestCategory = {
  id: string
  name: string
  description: string | null
  typeId: string | null
  type: {
    id: string
    name: string
  } | null
  testCount: number
  createdAt: Date
  updatedAt: Date
}

type UseTestCategoriesParams = {
  search?: string
  typeId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

type TestCategoriesResponse = {
  categories: TestCategory[]
  total: number
  page: number
  limit: number
  pages: number
}

async function fetchTestCategories(params: UseTestCategoriesParams): Promise<TestCategoriesResponse> {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.set('search', params.search)
  if (params.typeId) queryParams.set('typeId', params.typeId)
  if (params.page) queryParams.set('page', String(params.page))
  if (params.limit) queryParams.set('limit', String(params.limit))
  if (params.sortBy) queryParams.set('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder)

  const response = await fetch(`/api/admin/test-categories?${queryParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch test categories')
  }

  return response.json()
}

export function useTestCategories(params: UseTestCategoriesParams = {}) {
  return useQuery({
    queryKey: ['test-categories', params],
    queryFn: () => fetchTestCategories(params),
    staleTime: 30000,
  })
}

type CreateCategoryData = {
  name: string
  typeId: string
  description?: string | null
}

async function createCategory(data: CreateCategoryData): Promise<TestCategory> {
  const response = await fetch('/api/admin/test-categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create category')
  }

  return response.json()
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-categories'] })
    },
  })
}

type UpdateCategoryData = {
  id: string
  name?: string
  typeId?: string
  description?: string | null
}

async function updateCategory({ id, ...data }: UpdateCategoryData): Promise<TestCategory> {
  const response = await fetch(`/api/admin/test-categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update category')
  }

  return response.json()
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-categories'] })
    },
  })
}

async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/admin/test-categories/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete category')
  }
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-categories'] })
    },
  })
}
