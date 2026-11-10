import { queryOptions } from '@tanstack/react-query'

import { normalizeCatalogParams, type CatalogParams } from '@/shared/contracts'

import { getFacets, getNfts } from './api'

const FIVE_MINUTES = 5 * 60_000

export const catalogQueries = {
  list: (params: CatalogParams) => {
    const normalized = normalizeCatalogParams(params)
    return queryOptions({
      queryKey: ['nfts', 'list', normalized],
      // O `signal` cancela a busca que ficou para trás (SPEC §11.4).
      queryFn: ({ signal }) => getNfts(normalized, signal),
    })
  },
  facets: () =>
    queryOptions({
      queryKey: ['nfts', 'facets'],
      queryFn: ({ signal }) => getFacets(signal),
      staleTime: FIVE_MINUTES,
    }),
}
