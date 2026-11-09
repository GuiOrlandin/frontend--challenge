/** Parâmetros do catálogo (`GET /api/nfts`, search params da `/`; SPEC §4.2 e §11.1). */
import type { Eth, Network } from './entities'

export const CATALOG_TABS = ['all', 'new', 'trending'] as const
export type CatalogTab = (typeof CATALOG_TABS)[number]

export const CATALOG_SORTS = ['recent', 'price_asc', 'price_desc'] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

export interface CatalogParams {
  q?: string
  category?: string[]
  network?: Network[]
  priceMin?: Eth
  priceMax?: Eth
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
  /** Só a API conhece; a URL da `/` não expõe. */
  pageSize?: number
  collection?: string
}

export const CATALOG_DEFAULTS = {
  q: '',
  category: [],
  network: [],
  tab: 'all',
  sort: 'recent',
  page: 1,
  pageSize: 12,
} as const satisfies CatalogParams

const sortedUnique = <T extends string>(values: readonly T[] | undefined): T[] | undefined => {
  const result = [...new Set(values ?? [])].sort()
  return result.length > 0 ? result : undefined
}

const nonBlank = (value: string | undefined): string | undefined => value?.trim() || undefined

const unlessDefault = <T>(value: T | undefined, fallback: T): T | undefined =>
  value === fallback ? undefined : value

/**
 * Forma canônica dos parâmetros: arrays ordenados e sem repetição, padrões e vazios removidos,
 * chaves em ordem fixa. A mesma função gera a query key e os params do Axios, então entradas
 * equivalentes sempre caem no mesmo cache e na mesma URL.
 */
export function normalizeCatalogParams(params: CatalogParams): CatalogParams {
  const normalized: CatalogParams = {
    q: nonBlank(params.q),
    category: sortedUnique(params.category),
    network: sortedUnique(params.network),
    priceMin: nonBlank(params.priceMin),
    priceMax: nonBlank(params.priceMax),
    tab: unlessDefault(params.tab, CATALOG_DEFAULTS.tab),
    sort: unlessDefault(params.sort, CATALOG_DEFAULTS.sort),
    page: unlessDefault(params.page, CATALOG_DEFAULTS.page),
    pageSize: unlessDefault(params.pageSize, CATALOG_DEFAULTS.pageSize),
    collection: nonBlank(params.collection),
  }
  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined),
  ) as CatalogParams
}
