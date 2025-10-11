import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type TestType = {
  id: string
  name: string
  description: string | null
  categoryCount: number
  conditionCount: number
  createdAt: string
  updatedAt: string
}

export type TestTypeCondition = {
  id: string
  name: string
  description: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type TestTypeDetail = TestType & {
  conditions: TestTypeCondition[]
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

  const payload = await response.json()

  const mappedTestTypes: TestType[] = payload.testTypes.map((type: any) => ({
    id: type.id,
    name: type.name,
    description: type.description ?? null,
    categoryCount: type.categoryCount ?? 0,
    conditionCount: type.conditionCount ?? 0,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
  }))

  return {
    testTypes: mappedTestTypes,
    total: payload.total,
    page: payload.page,
    limit: payload.limit,
    pages: payload.pages,
  }
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

  const payload = await response.json()

  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? null,
    categoryCount: 0,
    conditionCount: 0,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  }
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

  const payload = await response.json()

  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? null,
    categoryCount: payload.categoryCount ?? 0,
    conditionCount: payload.conditionCount ?? 0,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  }
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

async function fetchTestTypeDetail(id: string): Promise<TestTypeDetail> {
  const response = await fetch(`/api/admin/test-types/${id}`)

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to fetch test type detail')
  }

  const payload = await response.json()

  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? null,
    categoryCount: payload.categoryCount ?? 0,
    conditionCount: payload.conditionCount ?? 0,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    conditions: (payload.conditions ?? []).map((condition: any) => ({
      id: condition.id,
      name: condition.name,
      description: condition.description ?? null,
      sortOrder: condition.sortOrder ?? 0,
      createdAt: condition.createdAt,
      updatedAt: condition.updatedAt,
    })),
  }
}

type MutateConditionPayload = {
  testTypeId: string
}

type CreateConditionPayload = MutateConditionPayload & {
  name: string
  description?: string
}

type UpdateConditionPayload = MutateConditionPayload & {
  conditionId: string
  name: string
  description?: string
}

type DeleteConditionPayload = MutateConditionPayload & {
  conditionId: string
}

type ConditionMutationResponse = {
  condition?: TestTypeCondition
  testTypeUpdatedAt: string
  success?: boolean
}

async function createTestTypeCondition(payload: CreateConditionPayload): Promise<ConditionMutationResponse> {
  const response = await fetch(`/api/admin/test-types/${payload.testTypeId}/conditions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to create condition')
  }

  return response.json()
}

async function updateTestTypeCondition(payload: UpdateConditionPayload): Promise<ConditionMutationResponse> {
  const response = await fetch(
    `/api/admin/test-types/${payload.testTypeId}/conditions/${payload.conditionId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to update condition')
  }

  return response.json()
}

async function deleteTestTypeCondition(payload: DeleteConditionPayload): Promise<ConditionMutationResponse> {
  const response = await fetch(
    `/api/admin/test-types/${payload.testTypeId}/conditions/${payload.conditionId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'Failed to delete condition')
  }

  return response.json()
}

export function useTestType(id: string, enabled = true) {
  return useQuery({
    queryKey: ['test-type', id],
    queryFn: () => fetchTestTypeDetail(id),
    enabled: Boolean(id) && enabled,
    staleTime: 10_000,
  })
}

export function useCreateTestTypeCondition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTestTypeCondition,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-types'] })
      queryClient.invalidateQueries({ queryKey: ['test-type', variables.testTypeId] })
    },
  })
}

export function useUpdateTestTypeCondition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTestTypeCondition,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-types'] })
      queryClient.invalidateQueries({ queryKey: ['test-type', variables.testTypeId] })
    },
  })
}

export function useDeleteTestTypeCondition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTestTypeCondition,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['test-types'] })
      queryClient.invalidateQueries({ queryKey: ['test-type', variables.testTypeId] })
    },
  })
}
