'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { reportBackendError } from '@/components/BackendErrorMonitor'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            console.error('React Query error:', error)
            reportBackendError(error)
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            console.error('React Query mutation error:', error)
            reportBackendError(error)
          },
        }),
        defaultOptions: {
          queries: {
            // Caching config pre optimálny performance
            staleTime: 60 * 1000, // 1 minúta - data sú fresh
            gcTime: 5 * 60 * 1000, // 5 minút - garbage collection
            refetchOnWindowFocus: false, // Nerefetchovať pri focus okna
            retry: 1, // Len 1 retry pri chybe
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
