import { useQuery } from '@tanstack/react-query'

export type Test = {
  id: string
  name: string
  type: 'ODBORNY' | 'VSEOBECNY' | 'STATNY_JAZYK' | 'CUDZI_JAZYK' | 'IT_ZRUCNOSTI' | 'SCHOPNOSTI_VLASTNOSTI'
  description: string | null
  questionCount: number
  recommendedDuration: number | null
  recommendedQuestionCount: number | null
  recommendedScore: number | null
  difficulty: number | null
  approved: boolean
  approvedAt: Date | null
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
  type?: string
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
  if (params.type) queryParams.set('type', params.type)
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
