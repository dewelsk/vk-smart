import { useQuery } from '@tanstack/react-query'

export type PracticeTest = {
  id: string
  name: string
  type: string
  description: string | null
  category: {
    id: string
    name: string
  } | null
  difficulty: number | null
  questionCount: number
  recommendedQuestionCount: number | null
  recommendedDuration: number | null
  recommendedScore: number | null
  totalAttempts: number
  userLastAttempt: {
    completedAt: Date | null
    successRate: number
    passed: boolean
  } | null
}

export type PracticeTestsParams = {
  search?: string
  type?: string
  categoryId?: string
}

export function usePracticeTests(params: PracticeTestsParams = {}) {
  return useQuery({
    queryKey: ['practice-tests', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params.search) {
        searchParams.set('search', params.search)
      }
      if (params.type) {
        searchParams.set('type', params.type)
      }
      if (params.categoryId) {
        searchParams.set('categoryId', params.categoryId)
      }

      const url = `/api/practice/tests${searchParams.toString() ? '?' + searchParams.toString() : ''}`

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to fetch practice tests')
      }

      const data = await res.json()
      return data as { tests: PracticeTest[]; total: number }
    },
  })
}

export type PracticeHistoryResult = {
  id: string
  test: {
    id: string
    name: string
    type: string
    category: {
      id: string
      name: string
    } | null
  }
  score: number
  maxScore: number
  successRate: number
  passed: boolean
  startedAt: Date
  completedAt: Date | null
  durationSeconds: number | null
  createdAt: Date
}

export type PracticeHistoryParams = {
  testId?: string
  limit?: number
  offset?: number
}

export function usePracticeHistory(params: PracticeHistoryParams = {}) {
  return useQuery({
    queryKey: ['practice-history', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params.testId) {
        searchParams.set('testId', params.testId)
      }
      if (params.limit) {
        searchParams.set('limit', String(params.limit))
      }
      if (params.offset) {
        searchParams.set('offset', String(params.offset))
      }

      const url = `/api/practice/history${searchParams.toString() ? '?' + searchParams.toString() : ''}`

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to fetch practice history')
      }

      const data = await res.json()
      return data as {
        results: PracticeHistoryResult[]
        total: number
        limit: number
        offset: number
        hasMore: boolean
      }
    },
  })
}
