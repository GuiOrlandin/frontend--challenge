import { describe, expect, it } from 'vitest'

import type { Quote } from '@/shared/contracts'

import { describeQuoteChanges } from './quoteChanges'

const line = {
  nftId: 'nft_1',
  editionId: 'ed_1',
  title: 'Emerald Ape #042',
  editionLabel: 'Ouro',
  quantity: 2,
  unitPrice: '1.19',
  lineTotal: '2.38',
}

const quote: Quote = {
  quoteId: 'qt_0001',
  expiresAt: '2026-07-29T12:10:00Z',
  cartVersion: 1,
  network: 'ethereum',
  nftVersions: { nft_1: 1 },
  lines: [line],
  coupon: { code: 'KURIO10', percentOff: 10 },
  subtotal: '2.38',
  discount: '0.238',
  networkFee: '0.016',
  total: '2.158',
}

describe('describeQuoteChanges', () => {
  it('sem mudanças, nenhuma mensagem', () => {
    expect(describeQuoteChanges(quote, quote)).toEqual([])
  })

  it('aponta preço, cupom removido e taxa', () => {
    const next = {
      ...quote,
      lines: [{ ...line, unitPrice: '1.309' }],
      coupon: null,
      networkFee: '0.02',
    }
    expect(describeQuoteChanges(quote, next)).toEqual([
      'Emerald Ape #042: preço mudou de 1.19 ETH para 1.309 ETH',
      'Cupom KURIO10 removido',
      'Taxa de rede mudou de 0.016 ETH para 0.02 ETH',
    ])
  })

  it('aponta edição esgotada, estoque menor e linhas que entraram ou saíram', () => {
    const other = { ...line, nftId: 'nft_2', title: 'Violet Nomad #314' }
    const target = {
      lines: [{ ...line, status: 'unavailable' as const }, other],
      coupon: quote.coupon,
    }
    expect(describeQuoteChanges(quote, target)).toEqual([
      'Emerald Ape #042: esgotado',
      'Violet Nomad #314: entrou no carrinho',
    ])
    const low = {
      lines: [{ ...line, status: 'exceedsAvailable' as const, available: 1 }],
      coupon: quote.coupon,
    }
    expect(describeQuoteChanges(quote, low)).toEqual(['Emerald Ape #042: só resta 1 disponível'])
    expect(describeQuoteChanges(quote, { lines: [], coupon: quote.coupon })).toEqual([
      'Emerald Ape #042: saiu do carrinho',
    ])
  })
})
