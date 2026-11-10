import { describe, expect, it } from 'vitest'

import type { Cart, CartLine, Nft } from '@/shared/contracts'

import { adjustmentMessages, describeNftChanges, removeLine, setLineQuantity } from './lines'

const line = (patch: Partial<CartLine> = {}): CartLine => ({
  lineId: 'line_nft_001_ed_001_a',
  nftId: 'nft_001',
  editionId: 'ed_001_a',
  quantity: 2,
  nft: { title: 'Emerald Ape #042', tokenId: '042', image: '', editionLabel: 'Padrão' },
  unitPrice: '1.19',
  lineTotal: '2.38',
  available: 4,
  maxPerOrder: 5,
  status: 'ok',
  ...patch,
})

const cart = (lines: CartLine[]): Cart => ({
  id: 'cart_1',
  version: 3,
  lines,
  coupon: null,
  summary: { subtotal: '0', discount: '0', networkFee: '0', total: '0', network: 'ethereum' },
})

const nftWith = (edition: { price: string; available: number }) =>
  ({
    id: 'nft_001',
    editions: [{ id: 'ed_001_a', label: 'Padrão', maxPerOrder: 5, supply: 100, ...edition }],
  }) as Nft

describe('setLineQuantity', () => {
  it('troca a quantidade e o total da linha', () => {
    const next = setLineQuantity(cart([line()]), 'line_nft_001_ed_001_a', 3)
    expect(next.lines[0]).toMatchObject({ quantity: 3, lineTotal: '3.57', status: 'ok' })
  })

  it('reduzir até o disponível tira o excesso', () => {
    const exceeding = line({ quantity: 6, available: 4, status: 'exceedsAvailable' })
    const next = setLineQuantity(cart([exceeding]), exceeding.lineId, 4)
    expect(next.lines[0]!.status).toBe('ok')
  })
})

describe('removeLine', () => {
  it('tira só a linha pedida', () => {
    const other = line({ lineId: 'line_x' })
    expect(removeLine(cart([line(), other]), 'line_nft_001_ed_001_a').lines).toEqual([other])
  })
})

describe('describeNftChanges', () => {
  it('anuncia a mudança de preço da linha', () => {
    expect(describeNftChanges([line()], nftWith({ price: '1.29', available: 4 }))).toEqual({
      lineIds: ['line_nft_001_ed_001_a'],
      messages: ['Emerald Ape #042: preço mudou de 1,19 para 1,29 ETH'],
    })
  })

  it('anuncia a Edição esgotada', () => {
    expect(describeNftChanges([line()], nftWith({ price: '1.19', available: 0 })).messages).toEqual(
      ['Emerald Ape #042: edição Padrão esgotada'],
    )
  })

  it('anuncia quando sobra menos que a quantidade da linha', () => {
    expect(describeNftChanges([line()], nftWith({ price: '1.19', available: 1 })).messages).toEqual(
      ['Emerald Ape #042: só resta 1 disponível'],
    )
  })

  it('ignora mudança que não afeta a linha', () => {
    expect(describeNftChanges([line()], nftWith({ price: '1.19', available: 3 }))).toEqual({
      lineIds: [],
      messages: [],
    })
  })
})

describe('adjustmentMessages', () => {
  it('nomeia o Nft cortado no merge', () => {
    const merged = {
      ...cart([line({ quantity: 4 })]),
      adjustments: [{ nftId: 'nft_001', editionId: 'ed_001_a', from: 6, to: 4 }],
    }
    expect(adjustmentMessages(merged)).toEqual([
      'Ajustamos a quantidade de Emerald Ape #042 para 4',
    ])
  })

  it('sem ajustes, nada a avisar', () => {
    expect(adjustmentMessages(cart([line()]))).toEqual([])
  })
})
