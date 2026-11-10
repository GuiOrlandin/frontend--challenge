import { queryOptions } from '@tanstack/react-query'

import { getSession } from './api'

export const sessionQueries = {
  /** Lido no `beforeLoad` da raiz; só muda por login, logout ou expiração (SPEC §11.2). */
  current: () =>
    queryOptions({
      queryKey: ['session'],
      // Sem `signal`: o boot (`beforeLoad`) espera esta busca, e um observer que desmonta
      // (ex.: o header no StrictMode) a cancelaria, derrubando a rota raiz com CancelledError.
      queryFn: () => getSession(),
      staleTime: Infinity,
    }),
}
