import { useQuery } from '@tanstack/react-query'

export type Applicant = {
  id: string
  cisIdentifier: string
  email: string | null
  isArchived: boolean
  registeredAt: string
  user: {
    id: string
    name: string
    surname: string
    email: string | null
  }
  vk: {
    id: string
    identifier: string
    position: string
    status: string
    institution: {
      id: string
      code: string
      name: string
    }
  }
  testResultsCount: number
  evaluationsCount: number
}

type UseApplicantsParams = {
  search?: string
  archived?: string
}

export function useApplicants(params: UseApplicantsParams = {}) {
  return useQuery({
    queryKey: ['applicants', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.search) searchParams.set('search', params.search)
      if (params.archived && params.archived !== 'all') {
        searchParams.set('archived', params.archived)
      }

      const res = await fetch(`/api/admin/applicants?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch applicants')

      const data = await res.json()
      return data.applicants as Applicant[]
    },
  })
}
