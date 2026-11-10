import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import type { Highlights, Nft, Page, RealtimeEvent } from '@/shared/contracts'

import { applyNftUpdated } from './realtime'

const nft = (id: string, version: number, title = `${id} v${version}`) =>
  ({ id, version, title }) as Nft

const page = (items: Nft[]): Page<Nft> => ({
  items,
  page: 1,
  pageSize: 9,
  total: items.length,
  totalPages: 1,
})

const updated = (data: Nft): RealtimeEvent<'nft.updated'> => ({
  eventId: `e-${data.id}-${data.version}`,
  type: 'nft.updated',
  resourceId: data.id,
  version: data.version,
  occurredAt: '2026-07-29T12:00:00Z',
  data,
})

const LIST_A = ['nfts', 'list', {}]
const LIST_B = ['nfts', 'list', { collection: 'apes' }]

function seeded() {
  const client = new QueryClient()
  client.setQueryData(['nfts', 'detail', 'nft_1'], nft('nft_1', 1))
  client.setQueryData(LIST_A, page([nft('nft_1', 1), nft('nft_2', 1)]))
  client.setQueryData(LIST_B, page([nft('nft_2', 1)]))
  client.setQueryData<Highlights>(['highlights'], {
    hero: [nft('nft_1', 1)],
    spotlight: nft('nft_1', 1),
  })
  client.setQueryData(['cart', 'u1'], { id: 'cart' })
  return client
}

describe('applyNftUpdated (SPEC §10.3)', () => {
  it('troca o Nft no detalhe, nas listas e nos destaques', () => {
    const client = seeded()
    applyNftUpdated(client, updated(nft('nft_1', 2, 'novo')))

    expect(client.getQueryData<Nft>(['nfts', 'detail', 'nft_1'])?.title).toBe('novo')
    expect(client.getQueryData<Page<Nft>>(LIST_A)?.items.map((n) => n.title)).toEqual([
      'novo',
      'nft_2 v1',
    ])
    const highlights = client.getQueryData<Highlights>(['highlights'])
    expect(highlights?.hero[0]?.title).toBe('novo')
    expect(highlights?.spotlight?.title).toBe('novo')
  })

  it('marca as listas como stale sem refetch e invalida o carrinho', () => {
    const client = seeded()
    applyNftUpdated(client, updated(nft('nft_1', 2)))

    expect(client.getQueryState(LIST_A)?.isInvalidated).toBe(true)
    expect(client.getQueryState(['cart', 'u1'])?.isInvalidated).toBe(true)
    // Lista onde o Nft não aparece não muda.
    expect(client.getQueryState(LIST_B)?.isInvalidated).toBe(false)
  })

  it('não regride quando o cache já tem versão igual ou maior', () => {
    const client = seeded()
    applyNftUpdated(client, updated(nft('nft_1', 3, 'v3')))
    applyNftUpdated(client, updated(nft('nft_1', 2, 'v2 atrasado')))

    expect(client.getQueryData<Nft>(['nfts', 'detail', 'nft_1'])?.title).toBe('v3')
    expect(client.getQueryData<Page<Nft>>(LIST_A)?.items[0]?.title).toBe('v3')
  })

  it('evento antigo não invalida listas nem carrinho', () => {
    const client = seeded()
    applyNftUpdated(client, updated(nft('nft_1', 1)))

    expect(client.getQueryState(LIST_A)?.isInvalidated).toBe(false)
    expect(client.getQueryState(['cart', 'u1'])?.isInvalidated).toBe(false)
  })
})
