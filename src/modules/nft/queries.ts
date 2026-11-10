import { queryOptions } from '@tanstack/react-query'

import { getFavorites, getNft } from './api'

export const nftQueries = {
  detail: (id: string) =>
    queryOptions({
      queryKey: ['nfts', 'detail', id],
      queryFn: ({ signal }) => getNft(id, signal),
    }),
}

export const favoritesQueries = {
  /** Só muda pelo próprio toggle (SPEC §11.2). */
  ids: (userId: string) =>
    queryOptions({
      queryKey: ['favorites', userId],
      queryFn: ({ signal }) => getFavorites(signal),
      staleTime: Infinity,
    }),
}
