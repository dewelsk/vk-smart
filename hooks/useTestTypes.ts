import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type TestType = {
  id: string
  name: string
  description: string | null
  categoryCount: number
  createdAt: Date
  updatedAt: Date
}

type UseTestTypesParams = {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

type TestTypesResponse = {
  testTypes: TestType[]
  total: number
  page: number
  limit: number
  pages: number
}

type CreateTestTypeData = {
  name: string
  description?: string
}

type UpdateTestTypeData = {
  id: string
  name?: string
  description?: string
}

async function fetchTestTypes(params: UseTestTypesParams): Promise<TestTypesResponse> {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.set('search', params.search)
  if (params.page) queryParams.set('page', String(params.page))
  if (params.limit) queryParams.set('limit', String(params.limit))
  if (params.sortBy) queryParams.set('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder)

  const response = await fetch(`/api/admin/test-types?${queryParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch test types')
  }

  return response.json()
}

async function createTestType(data: CreateTestTypeData): Promise<TestType> {
  const response = await fetch('/api/admin/test-types', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create test type')
  }

  return response.json()
}

async function updateTestType(data: UpdateTestTypeData): Promise<TestType> {
  const { id, ...updateData } = data
  const response = await fetch(`/api/admin/test-types/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update test type')
  }

  return response.json()
}

async function deleteTestType(id: string): Promise<void> {
  const response = await fetch(`/api/admin/test-types/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete test type')
  }
}

export function useTestTypes(params: UseTestTypesParams = {}) {
  return useQuery({
    queryKey: ['test-types', params],
    queryFn: () => fetchTestTypes(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
}

export function useCreateTestType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTestType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-types'] })
    },
  })
}

export function useUpdateTestType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTestType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-types'] })
    },
  })
}

export function useDeleteTestType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTestType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-types'] })
    },
  })
}
