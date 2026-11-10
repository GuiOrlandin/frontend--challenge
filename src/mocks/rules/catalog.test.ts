import { describe, expect, it } from 'vitest'

import type { Nft } from '@/shared/contracts'

import { computeFacets, parseCatalogQuery, queryCatalog } from './catalog'

const NOW = '2026-07-29T12:00:00.000Z'

function nft(id: string, overrides: Partial<Nft> & { price?: string } = {}): Nft {
  const { price = '1', ...rest } = overrides
  return {
    id,
    tokenId: id,
    title: `Nft ${id}`,
    description: '',
    category: { id: 'arte-digital', label: 'Arte digital' },
    collection: { id: 'kurio-apes', label: 'Kurio Apes' },
    network: 'ethereum',
    creator: { name: 'Criador', avatarUrl: '' },
    images: [],
    attributes: [],
    rating: { average: 4, count: 10 },
    rare: false,
    editions: [
      { id: `ed_${id}`, label: 'Padrão', supply: null, available: 10, price, maxPerOrder: 5 },
    ],
    defaultEditionId: `ed_${id}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    ...rest,
  }
}

const day = (n: number) => `2026-07-${String(n).padStart(2, '0')}T00:00:00.000Z`
const ids = (page: { items: Nft[] }) => page.items.map((item) => item.id)

describe('queryCatalog', () => {
  it('lists the most recent first, 9 per page, with page metadata', () => {
    const nfts = Array.from({ length: 14 }, (_, i) => nft(`n${i + 1}`, { createdAt: day(i + 1) }))

    const first = queryCatalog(nfts, {}, { now: NOW })

    expect(first.items).toHaveLength(9)
    expect(first.items[0]?.id).toBe('n14')
    expect(first.items[8]?.id).toBe('n6')
    expect(first).toMatchObject({ page: 1, pageSize: 9, total: 14, totalPages: 2 })

    const second = queryCatalog(nfts, { page: 2 }, { now: NOW })
    expect(ids(second)).toEqual(['n5', 'n4', 'n3', 'n2', 'n1'])
  })

  it('searches title, collection and creator ignoring case and accents', () => {
    const nfts = [
      nft('a', { title: 'Emerald Ape #042' }),
      nft('b', { collection: { id: 'cosmic', label: 'Jardim Cósmico' } }),
      nft('c', { creator: { name: 'Ana Émile', avatarUrl: '' } }),
      nft('d', { title: 'Golden Beat #207' }),
    ]

    expect(ids(queryCatalog(nfts, { q: 'emerald' }, { now: NOW }))).toEqual(['a'])
    expect(ids(queryCatalog(nfts, { q: 'cosmico' }, { now: NOW }))).toEqual(['b'])
    expect(ids(queryCatalog(nfts, { q: '  EMILE ' }, { now: NOW }))).toEqual(['c'])
    expect(ids(queryCatalog(nfts, { q: '#207' }, { now: NOW }))).toEqual(['d'])
  })

  it('combines filters: any of the categories, any of the networks, and the price range', () => {
    const music = { id: 'musica', label: 'Música' }
    const photo = { id: 'fotografia', label: 'Fotografia' }
    const nfts = [
      nft('a', { category: music, network: 'polygon', price: '0.5' }),
      nft('b', { category: photo, network: 'solana', price: '0.5' }),
      nft('c', { category: music, network: 'ethereum', price: '0.5' }),
      nft('d', { network: 'polygon', price: '0.5' }),
      nft('e', { category: photo, network: 'polygon', price: '2' }),
    ]

    const result = queryCatalog(
      nfts,
      { category: ['musica', 'fotografia'], network: ['polygon', 'solana'], priceMax: '1' },
      { now: NOW },
    )

    expect(ids(result).sort()).toEqual(['a', 'b'])
  })

  it('compares prices as decimals on the default edition, bounds inclusive', () => {
    const nfts = [
      nft('cheap', { price: '0.09' }),
      nft('low', { price: '0.1' }),
      nft('high', { price: '12.3' }),
      nft('over', { price: '12.30000001' }),
      nft('multi', {
        editions: [
          { id: 'x1', label: 'Padrão', supply: null, available: 1, price: '5', maxPerOrder: 1 },
          { id: 'x2', label: 'Rara', supply: 1, available: 1, price: '50', maxPerOrder: 1 },
        ],
        defaultEditionId: 'x1',
      }),
    ]

    const result = queryCatalog(nfts, { priceMin: '0.10', priceMax: '12.30' }, { now: NOW })

    expect(ids(result).sort()).toEqual(['high', 'low', 'multi'])
  })

  it('sorts by price both ways, breaking ties by id', () => {
    const nfts = [
      nft('b', { price: '1.5' }),
      nft('c', { price: '0.9' }),
      nft('a', { price: '1.5' }),
      nft('d', { price: '10' }),
    ]

    expect(ids(queryCatalog(nfts, { sort: 'price_asc' }, { now: NOW }))).toEqual([
      'c',
      'a',
      'b',
      'd',
    ])
    expect(ids(queryCatalog(nfts, { sort: 'price_desc' }, { now: NOW }))).toEqual([
      'd',
      'a',
      'b',
      'c',
    ])
  })

  it('"new" keeps the last 30 days before the seed clock; "trending" the most rated', () => {
    const nfts = [
      nft('fresh', { createdAt: '2026-07-20T00:00:00.000Z', rating: { average: 4, count: 3 } }),
      nft('edge', { createdAt: '2026-06-29T12:00:00.000Z', rating: { average: 4, count: 3 } }),
      nft('old', { createdAt: '2026-05-01T00:00:00.000Z', rating: { average: 5, count: 120 } }),
    ]

    expect(ids(queryCatalog(nfts, { tab: 'new' }, { now: NOW }))).toEqual(['fresh', 'edge'])
    expect(ids(queryCatalog(nfts, { tab: 'trending' }, { now: NOW }))).toEqual(['old'])
  })

  it('narrows to one collection', () => {
    const nfts = [nft('a'), nft('b', { collection: { id: 'nomads', label: 'Nomad Society' } })]

    expect(ids(queryCatalog(nfts, { collection: 'nomads' }, { now: NOW }))).toEqual(['b'])
  })

  it('returns an empty page past the end, keeping the totals', () => {
    const nfts = [nft('a'), nft('b')]

    expect(queryCatalog(nfts, { page: 3 }, { now: NOW })).toEqual({
      items: [],
      page: 3,
      pageSize: 9,
      total: 2,
      totalPages: 1,
    })
    expect(queryCatalog([], {}, { now: NOW })).toMatchObject({ total: 0, totalPages: 0 })
  })
})

describe('parseCatalogQuery', () => {
  it('reads arrays in both the Axios (`category[]`) and the repeated-key form', () => {
    const query = parseCatalogQuery(
      new URLSearchParams(
        'category[]=musica&category[]=arte-3d&network=polygon&network=solana&q=ape',
      ),
    )

    expect(query).toEqual({
      q: 'ape',
      category: ['arte-3d', 'musica'],
      network: ['polygon', 'solana'],
    })
  })

  it('ignores invalid values instead of failing', () => {
    const query = parseCatalogQuery(
      new URLSearchParams(
        'network[]=bitcoin&tab=hot&sort=cheap&page=0&pageSize=500&priceMin=abc&priceMax=1.5',
      ),
    )

    expect(query).toEqual({ pageSize: 48, priceMax: '1.5' })
  })

  it('reads paging, sort, tab and collection', () => {
    const query = parseCatalogQuery(
      new URLSearchParams('page=3&pageSize=8&sort=price_desc&tab=trending&collection=nomads'),
    )

    expect(query).toEqual({
      page: 3,
      pageSize: 8,
      sort: 'price_desc',
      tab: 'trending',
      collection: 'nomads',
    })
  })
})

describe('computeFacets', () => {
  const CATEGORIES = [
    { id: 'arte-digital', label: 'Arte digital' },
    { id: 'musica', label: 'Música' },
  ]
  const LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const
  const nfts = [
    nft('a', { price: '0.50' }),
    nft('b', { category: { id: 'musica', label: 'Música' }, network: 'solana', price: '2' }),
    nft('c', { network: 'solana', price: '9', title: 'Emerald Ape' }),
  ]
  const counts = (facets: ReturnType<typeof computeFacets>) => ({
    categories: Object.fromEntries(facets.categories.map((f) => [f.id, f.count])),
    networks: Object.fromEntries(facets.networks.map((f) => [f.id, f.count])),
  })

  it('counts the whole catalog without filters', () => {
    expect(counts(computeFacets(nfts, CATEGORIES, LABELS, {}, { now: NOW }))).toEqual({
      categories: { 'arte-digital': 2, musica: 1 },
      networks: { ethereum: 1, polygon: 0, solana: 2 },
    })
  })

  it('counts each group under the other active filters, ignoring its own selection', () => {
    const facets = computeFacets(
      nfts,
      CATEGORIES,
      LABELS,
      { category: ['musica'], network: ['ethereum'] },
      { now: NOW },
    )
    // Coleções contam só Ethereum; Rede conta só Música.
    expect(counts(facets)).toEqual({
      categories: { 'arte-digital': 1, musica: 0 },
      networks: { ethereum: 0, polygon: 0, solana: 1 },
    })
  })

  it('applies search, tab and price to both groups, but keeps the price range global', () => {
    const facets = computeFacets(nfts, CATEGORIES, LABELS, { q: 'emerald' }, { now: NOW })
    expect(counts(facets)).toEqual({
      categories: { 'arte-digital': 1, musica: 0 },
      networks: { ethereum: 0, polygon: 0, solana: 1 },
    })
    expect(facets.priceRange).toEqual({ min: '0.50', max: '9' })
  })
})
