/** Regras puras do catálogo simulado: filtro, ordenação e paginação de `GET /api/nfts`. */
import {
  CATALOG_DEFAULTS,
  CATALOG_SORTS,
  CATALOG_TABS,
  NETWORKS,
  normalizeCatalogParams,
  type CatalogParams,
  type CatalogSort,
  type CatalogTab,
  type Eth,
  type Facets,
  type Network,
  type Nft,
  type Page,
} from '@/shared/contracts'
import { compare as compareEth, toWei } from '@/shared/lib/eth'

export interface CatalogContext {
  /** Relógio de referência da seed (a aba "Novos" é relativa a ele, não ao relógio real). */
  now: string
}

/** Aba "Novos": criados nos últimos 30 dias antes do relógio da seed. */
const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
/** Aba "Em alta": Nfts com pelo menos esta quantidade de avaliações. */
const TRENDING_MIN_RATINGS = 80

export function queryCatalog(
  nfts: readonly Nft[],
  params: CatalogParams,
  context: CatalogContext,
): Page<Nft> {
  const page = params.page ?? CATALOG_DEFAULTS.page
  const pageSize = params.pageSize ?? CATALOG_DEFAULTS.pageSize
  const matches = nfts
    .filter(catalogFilter(params, context))
    .sort(comparators[params.sort ?? CATALOG_DEFAULTS.sort])

  const start = (page - 1) * pageSize
  return {
    items: matches.slice(start, start + pageSize),
    page,
    pageSize,
    total: matches.length,
    totalPages: Math.ceil(matches.length / pageSize),
  }
}

/** Predicado com todos os filtros do catálogo (busca, Categoria, Rede, Coleção, aba e preço). */
function catalogFilter(params: CatalogParams, context: CatalogContext): (nft: Nft) => boolean {
  const term = fold(params.q ?? '')
  const categories = new Set(params.category ?? [])
  const networks = new Set<string>(params.network ?? [])
  const min = params.priceMin === undefined ? undefined : toWei(params.priceMin)
  const max = params.priceMax === undefined ? undefined : toWei(params.priceMax)
  const inTab = tabFilter(params.tab ?? CATALOG_DEFAULTS.tab, context)

  return (nft) => {
    if (term && !searchText(nft).includes(term)) return false
    if (categories.size > 0 && !categories.has(nft.category.id)) return false
    if (networks.size > 0 && !networks.has(nft.network)) return false
    if (params.collection !== undefined && nft.collection.id !== params.collection) return false
    if (!inTab(nft)) return false
    const price = toWei(displayPrice(nft))
    if (min !== undefined && price < min) return false
    if (max !== undefined && price > max) return false
    return true
  }
}

const MAX_PAGE_SIZE = 48

/**
 * Lê a query de `GET /api/nfts`. Aceita arrays no formato do Axios (`category[]=a`) e com
 * chave repetida (`category=a`). Valores inválidos são ignorados (caem no padrão), e o
 * resultado sai na forma canônica de `normalizeCatalogParams`.
 */
export function parseCatalogQuery(search: URLSearchParams): CatalogParams {
  const list = (key: string) => [...search.getAll(key), ...search.getAll(`${key}[]`)]
  const text = (key: string) => search.get(key) ?? undefined
  const oneOf = <T extends string>(values: readonly T[], value: string | undefined) =>
    values.find((v) => v === value)

  return normalizeCatalogParams({
    q: text('q'),
    category: list('category'),
    network: list('network').filter((n): n is Network => oneOf(NETWORKS, n) !== undefined),
    priceMin: ethOrUndefined(text('priceMin')),
    priceMax: ethOrUndefined(text('priceMax')),
    tab: oneOf(CATALOG_TABS, text('tab')),
    sort: oneOf(CATALOG_SORTS, text('sort')),
    page: positiveInt(text('page')),
    pageSize: clampPageSize(positiveInt(text('pageSize'))),
    collection: text('collection'),
  })
}

function ethOrUndefined(value: string | undefined): Eth | undefined {
  if (value === undefined) return undefined
  try {
    toWei(value)
    return value
  } catch {
    return undefined
  }
}

function positiveInt(value: string | undefined): number | undefined {
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= 1 ? n : undefined
}

const clampPageSize = (n: number | undefined) =>
  n === undefined ? undefined : Math.min(n, MAX_PAGE_SIZE)

/**
 * Contagens da barra lateral sob os filtros ativos. Cada grupo ignora a própria seleção (senão
 * só a opção marcada teria itens): Coleções contam com a Rede escolhida, e vice-versa. Todas as
 * Categorias e Redes aparecem, mesmo com zero. A faixa de preço é do catálogo inteiro, para os
 * limites do Slider não mudarem a cada filtro.
 */
export function computeFacets(
  nfts: readonly Nft[],
  categories: readonly { id: string; label: string }[],
  networkLabels: Record<Network, string>,
  params: CatalogParams,
  context: CatalogContext,
): Facets {
  const byCategory = nfts.filter(catalogFilter({ ...params, category: undefined }, context))
  const byNetwork = nfts.filter(catalogFilter({ ...params, network: undefined }, context))
  const prices = nfts.map(displayPrice).sort(compareEth)
  return {
    categories: categories.map(({ id, label }) => ({
      id,
      label,
      count: byCategory.filter((nft) => nft.category.id === id).length,
    })),
    networks: NETWORKS.map((id) => ({
      id,
      label: networkLabels[id],
      count: byNetwork.filter((nft) => nft.network === id).length,
    })),
    priceRange: { min: prices[0] ?? '0', max: prices.at(-1) ?? '0' },
  }
}

/** Preço exibido no card e usado em filtro, ordenação e faixa: o da Edição padrão. */
function displayPrice(nft: Nft): Eth {
  const edition = nft.editions.find((e) => e.id === nft.defaultEditionId) ?? nft.editions[0]
  if (!edition) throw new Error(`Nft ${nft.id} sem Edições`)
  return edition.price
}

function tabFilter(tab: CatalogTab, { now }: CatalogContext): (nft: Nft) => boolean {
  switch (tab) {
    case 'all':
      return () => true
    case 'new': {
      const since = Date.parse(now) - NEW_WINDOW_MS
      return (nft) => Date.parse(nft.createdAt) >= since
    }
    case 'trending':
      return (nft) => nft.rating.count >= TRENDING_MIN_RATINGS
  }
}

const byId = (a: Nft, b: Nft) => a.id.localeCompare(b.id)
const byPrice = (a: Nft, b: Nft) => compareEth(displayPrice(a), displayPrice(b))

const comparators: Record<CatalogSort, (a: Nft, b: Nft) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || byId(a, b),
  price_asc: (a, b) => byPrice(a, b) || byId(a, b),
  price_desc: (a, b) => byPrice(b, a) || byId(a, b),
}

/** Minúsculas, sem acentos e sem espaços nas pontas. */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const searchText = (nft: Nft) =>
  fold([nft.title, nft.collection.label, nft.category.label, nft.creator.name].join(' '))
