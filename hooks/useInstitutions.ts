import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Institution = {
  id: string
  name: string
  code: string
  description: string | null
  active: boolean
  allowedQuestionTypes: string[]
  createdAt: Date
  updatedAt: Date
  users?: Array<{
    id: string
    userId: string
    institutionId: string
    user: {
      id: string
      username: string
      name: string
      surname: string
      role: string
    }
  }>
}

type UseInstitutionsParams = {
  search?: string
  page?: number
  limit?: number
}

type InstitutionsResponse = {
  institutions: Institution[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function fetchInstitutions(params: UseInstitutionsParams): Promise<InstitutionsResponse> {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.set('search', params.search)
  if (params.page) queryParams.set('page', String(params.page))
  if (params.limit) queryParams.set('limit', String(params.limit))

  const response = await fetch(`/api/admin/institutions?${queryParams.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch institutions')
  }

  return response.json()
}

export function useInstitutions(params: UseInstitutionsParams = {}) {
  return useQuery({
    queryKey: ['institutions', params],
    queryFn: () => fetchInstitutions(params),
    staleTime: 30000,
  })
}

// Fetch single institution detail
async function fetchInstitution(id: string): Promise<{ institution: Institution }> {
  const response = await fetch(`/api/admin/institutions/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Inštitúcia nenájdená')
    }
    if (response.status === 403) {
      throw new Error('Nemáte oprávnenie zobraziť túto inštitúciu')
    }
    throw new Error('Failed to fetch institution')
  }

  return response.json()
}

export function useInstitution(id: string | null) {
  return useQuery({
    queryKey: ['institutions', id],
    queryFn: () => fetchInstitution(id!),
    enabled: !!id,
    staleTime: 30000,
  })
}

type UpdateInstitutionData = {
  id: string
  name?: string
  code?: string
  description?: string | null
  active?: boolean
  allowedQuestionTypes?: string[]
}

async function updateInstitution({ id, ...data }: UpdateInstitutionData): Promise<{ institution: Institution }> {
  const response = await fetch(`/api/admin/institutions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update institution')
  }

  return response.json()
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateInstitution,
    onSuccess: (data) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['institutions'] })
      // Update the specific institution in cache
      queryClient.setQueryData(['institutions', data.institution.id], data)
    },
  })
}
