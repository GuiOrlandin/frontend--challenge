import { describe, expect, it } from 'vitest'

import { buildReceipt, idempotencyOutcome, subtractPurchased, transactionHashOf } from './orders'

describe('subtractPurchased', () => {
  it('subtracts only what was bought and keeps what was added after the quote', () => {
    const cart = [
      { lineId: 'l1', nftId: 'n1', editionId: 'e1', quantity: 3 },
      { lineId: 'l2', nftId: 'n2', editionId: 'e2', quantity: 1 },
    ]
    const bought = [{ nftId: 'n1', editionId: 'e1', quantity: 2 }]
    expect(subtractPurchased(cart, bought)).toEqual([
      { lineId: 'l1', nftId: 'n1', editionId: 'e1', quantity: 1 },
      { lineId: 'l2', nftId: 'n2', editionId: 'e2', quantity: 1 },
    ])
  })

  it('floors at zero and drops the emptied line', () => {
    const cart = [{ lineId: 'l1', nftId: 'n1', editionId: 'e1', quantity: 1 }]
    const bought = [{ nftId: 'n1', editionId: 'e1', quantity: 2 }]
    expect(subtractPurchased(cart, bought)).toEqual([])
  })
})

describe('idempotencyOutcome', () => {
  const body = { quoteId: 'qt_0001', walletId: 'wal_ana_1', buyer: { username: 'ana', note: 'oi' } }

  it('creates when the key was never used', () => {
    expect(idempotencyOutcome(undefined, body)).toBe('create')
  })

  it('replays the same key with the same body, whatever the key order', () => {
    const reordered = {
      buyer: { note: 'oi', username: 'ana' },
      walletId: 'wal_ana_1',
      quoteId: 'qt_0001',
    }
    expect(idempotencyOutcome({ body }, reordered)).toBe('replay')
  })

  it('refuses the same key with a different body', () => {
    expect(idempotencyOutcome({ body }, { ...body, walletId: 'wal_ana_2' })).toBe('reused')
    expect(idempotencyOutcome({ body }, { ...body, buyer: { username: 'ana' } })).toBe('reused')
  })
})

describe('buildReceipt', () => {
  const quote = {
    network: 'ethereum' as const,
    lines: [
      {
        nftId: 'n1',
        editionId: 'e1',
        title: 'Emerald Ape #042',
        editionLabel: 'Edição 1/10',
        quantity: 2,
        unitPrice: '1.19',
        lineTotal: '2.38',
      },
    ],
    subtotal: '2.38',
    discount: '0',
    networkFee: '0.0042',
    total: '2.3842',
  }
  const buyer = {
    displayName: 'Ana Ribeiro',
    username: 'ana',
    email: 'ana@kurio.dev',
    ensName: 'ana-ribeiro.eth',
    profileName: 'Ana Ribeiro',
    referralCode: 'ANA2026',
  }
  const wallet = { label: 'Principal', address: '0x8f3a21c4b6d7e9f0a1b2c3d4e5f60718293a4b5c' }

  it('snapshots the quoted values, not the current catalog price, and never follows later changes', () => {
    const nft = {
      id: 'n1',
      tokenId: '#042',
      images: [{ src: '/ape.webp', alt: '' }],
      price: '1.29',
    }
    const receipt = buildReceipt({
      quote,
      buyer,
      wallet,
      provider: 'metamask',
      nftOf: () => nft,
      transactionHash: '0xabc',
      confirmedAt: '2026-07-29T12:00:03.000Z',
    })
    nft.price = '9.99'
    quote.lines[0]!.unitPrice = '9.99'

    expect(receipt).toEqual({
      transactionHash: '0xabc',
      confirmedAt: '2026-07-29T12:00:03.000Z',
      wallet: { label: 'Principal', shortAddress: '0x8f3a…4b5c', provider: 'metamask' },
      network: 'ethereum',
      buyer,
      lines: [
        {
          title: 'Emerald Ape #042',
          tokenId: '#042',
          image: '/ape.webp',
          editionLabel: 'Edição 1/10',
          quantity: 2,
          unitPrice: '1.19',
          lineTotal: '2.38',
        },
      ],
      subtotal: '2.38',
      discount: '0',
      networkFee: '0.0042',
      total: '2.3842',
    })
  })
})

describe('transactionHashOf', () => {
  it('is a deterministic 32-byte hex per order number', () => {
    expect(transactionHashOf(1)).toMatch(/^0x[0-9a-f]{64}$/)
    expect(transactionHashOf(1)).toBe(transactionHashOf(1))
    expect(transactionHashOf(2)).not.toBe(transactionHashOf(1))
  })
})
