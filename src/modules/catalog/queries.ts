import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { normalizeCatalogParams, type CatalogParams } from '@/shared/contracts'

import { getFacets, getHighlights, getNfts } from './api'

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
  /** Contagens sob os filtros ativos; página e ordenação não mudam as contagens. */
  facets: (params: CatalogParams) => {
    const filters = normalizeCatalogParams({
      ...params,
      page: undefined,
      sort: undefined,
      pageSize: undefined,
    })
    return queryOptions({
      queryKey: ['nfts', 'facets', filters],
      queryFn: ({ signal }) => getFacets(filters, signal),
      staleTime: FIVE_MINUTES,
      // Mantém os números anteriores enquanto recalcula: a barra não pisca a cada filtro.
      placeholderData: keepPreviousData,
    })
  },
  highlights: () =>
    queryOptions({
      queryKey: ['highlights'],
      queryFn: ({ signal }) => getHighlights(signal),
      staleTime: FIVE_MINUTES,
    }),
}
