import { describe, expect, it } from 'vitest'

import { normalizeCatalogParams } from './catalog'

describe('normalizeCatalogParams', () => {
  it('reduces the defaults to an empty object', () => {
    expect(
      normalizeCatalogParams({
        q: '',
        category: [],
        network: [],
        tab: 'all',
        sort: 'recent',
        page: 1,
      }),
    ).toEqual({})
  })

  it('sorts and deduplicates array filters', () => {
    expect(
      normalizeCatalogParams({
        category: ['music', 'art', 'music'],
        network: ['solana', 'ethereum'],
      }),
    ).toEqual({ category: ['art', 'music'], network: ['ethereum', 'solana'] })
  })

  it('keeps non-default values and trims the search text', () => {
    expect(
      normalizeCatalogParams({
        q: '  ape ',
        priceMin: '0.5',
        priceMax: '2',
        tab: 'trending',
        sort: 'price_desc',
        page: 3,
        collection: 'col_01',
      }),
    ).toEqual({
      q: 'ape',
      priceMin: '0.5',
      priceMax: '2',
      tab: 'trending',
      sort: 'price_desc',
      page: 3,
      collection: 'col_01',
    })
  })

  it('keeps a non-default page size and drops the default of 12', () => {
    expect(normalizeCatalogParams({ collection: 'col_01', pageSize: 8 })).toEqual({
      pageSize: 8,
      collection: 'col_01',
    })
    expect(normalizeCatalogParams({ pageSize: 12 })).toEqual({})
  })

  it('drops blank price bounds and a whitespace-only search', () => {
    expect(normalizeCatalogParams({ q: '   ', priceMin: '', priceMax: '' })).toEqual({})
  })

  it('gives the same result for equivalent inputs, regardless of order', () => {
    const a = normalizeCatalogParams({ network: ['polygon', 'ethereum'], category: ['b', 'a'] })
    const b = normalizeCatalogParams({ category: ['a', 'b'], network: ['ethereum', 'polygon'] })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('does not mutate the input arrays', () => {
    const category = ['b', 'a']
    normalizeCatalogParams({ category })
    expect(category).toEqual(['b', 'a'])
  })
})
