import { useQuery } from '@tanstack/react-query'

export type User = {
  id: string
  name: string
  surname: string
  email: string | null
  username: string
  role: string
  active: boolean
  note: string | null
  createdAt: string
  lastLoginAt: string | null
  passwordSetToken: string | null
  institutions: Array<{ id: string; code: string; name: string }>
  roles: Array<{
    id: string
    role: string
    institutionId: string | null
    institutionName: string | null
    assignedAt: string
  }>
  vkCount: number
}

type UseUsersParams = {
  search?: string
  roles?: string[]
  status?: string
  page?: number
  limit?: number
}

export function useUsers(params: UseUsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.search) searchParams.set('search', params.search)
      if (params.roles && params.roles.length > 0) {
        searchParams.set('roles', params.roles.join(','))
      }
      if (params.status && params.status !== 'all') {
        searchParams.set('status', params.status)
      }
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const res = await fetch(`/api/admin/users?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch users')

      const data = await res.json()
      return {
        users: data.users as User[],
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
