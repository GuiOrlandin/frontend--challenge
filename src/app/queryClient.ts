/** QueryClient do app com os padrões da SPEC §11.2. */
import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/shared/contracts'

/** Queries: 1 retry, só para falha de rede ou 5xx retryable; nunca em 4xx. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1 || !isApiError(error)) return false
  return error.code === 'NETWORK_ERROR' || (error.status >= 500 && error.retryable)
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: shouldRetryQuery,
        retryDelay: 1_000,
      },
      mutations: { retry: false },
    },
  })
}
