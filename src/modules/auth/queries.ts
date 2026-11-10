import { queryOptions } from '@tanstack/react-query'

import { getSession } from './api'

export const sessionQueries = {
  /** Lido no `beforeLoad` da raiz; só muda por login, logout ou expiração (SPEC §11.2). */
  current: () =>
    queryOptions({
      queryKey: ['session'],
      queryFn: ({ signal }) => getSession(signal),
      staleTime: Infinity,
    }),
}
