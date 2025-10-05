'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}
