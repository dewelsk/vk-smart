import { useQuery } from '@tanstack/react-query'

export type VK = {
  id: string
  identifier: string
  position: string
  selectionType: string
  organizationalUnit: string
  serviceField: string
  serviceType: string
  startDateTime: string
  numberOfPositions: number
  status: string
  createdAt: string
  gestor: {
    id: string
    name: string
    surname: string
  } | null
  candidatesCount: number
  testsCount: number
  validation: {
    status: 'ready' | 'warning' | 'error'
    count: number
    label: string
    errors: string[]
    warnings: string[]
  }
}

type UseVKsParams = {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export function useVKs(params: UseVKsParams = {}) {
  return useQuery({
    queryKey: ['vks', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.search) searchParams.set('search', params.search)
      if (params.status) searchParams.set('status', params.status)
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const res = await fetch(`/api/admin/vk?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch VKs')

      const data = await res.json()
      return {
        vks: data.vks as VK[],
        pagination: data.pagination as {
          page: number
          limit: number
          total: number
          totalPages: number
        },
      }
    },
  })
}
