import { describe, expect, it } from 'vitest'

import { couponState, isQuoteStale, lineStatus, mergeLines, priceLines } from './cart'

const caps: Record<string, number> = { e1: 5, e2: 3, e3: 2 }
const capOf = (line: { editionId: string }) => caps[line.editionId] ?? 0

describe('mergeLines', () => {
  it('sums the same edition and keeps lines that exist on one side only', () => {
    const merged = mergeLines(
      [{ nftId: 'n1', editionId: 'e1', quantity: 1 }],
      [
        { nftId: 'n1', editionId: 'e1', quantity: 2 },
        { nftId: 'n2', editionId: 'e2', quantity: 1 },
      ],
      capOf,
    )
    expect(merged.lines).toEqual([
      { nftId: 'n1', editionId: 'e1', quantity: 3 },
      { nftId: 'n2', editionId: 'e2', quantity: 1 },
    ])
    expect(merged.adjustments).toEqual([])
  })

  it('caps the sum at min(available, maxPerOrder) and reports the cut', () => {
    const merged = mergeLines(
      [{ nftId: 'n2', editionId: 'e2', quantity: 2 }],
      [
        { nftId: 'n2', editionId: 'e2', quantity: 2 },
        { nftId: 'n3', editionId: 'e3', quantity: 4 },
      ],
      capOf,
    )
    expect(merged.lines).toEqual([
      { nftId: 'n2', editionId: 'e2', quantity: 3 },
      { nftId: 'n3', editionId: 'e3', quantity: 2 },
    ])
    expect(merged.adjustments).toEqual([
      { nftId: 'n2', editionId: 'e2', from: 4, to: 3 },
      { nftId: 'n3', editionId: 'e3', from: 4, to: 2 },
    ])
  })

  it('drops a line whose edition sold out, reporting it as cut to zero', () => {
    const merged = mergeLines([], [{ nftId: 'n9', editionId: 'gone', quantity: 1 }], capOf)
    expect(merged.lines).toEqual([])
    expect(merged.adjustments).toEqual([{ nftId: 'n9', editionId: 'gone', from: 1, to: 0 }])
  })
})

describe('priceLines', () => {
  it('computes subtotal, percent discount, network fee and total', () => {
    const lines = [
      { unitPrice: '1.19', quantity: 2 },
      { unitPrice: '0.5', quantity: 1 },
    ]
    expect(priceLines(lines, 10, '0.0042')).toEqual({
      subtotal: '2.88',
      discount: '0.288',
      networkFee: '0.0042',
      total: '2.5962',
    })
  })

  it('has no discount without coupon and rounds the discount down to the wei', () => {
    expect(priceLines([{ unitPrice: '0.000000000000000015', quantity: 1 }], 10, '0')).toEqual({
      subtotal: '0.000000000000000015',
      discount: '0.000000000000000001',
      networkFee: '0',
      total: '0.000000000000000014',
    })
    expect(priceLines([{ unitPrice: '2', quantity: 1 }], null, '0.0006').discount).toBe('0')
  })

  it('charges no network fee for an empty cart', () => {
    expect(priceLines([], 10, '0.0042')).toEqual({
      subtotal: '0',
      discount: '0',
      networkFee: '0',
      total: '0',
    })
  })
})

describe('couponState', () => {
  const APPLIED = '2026-07-29T12:00:00.000Z'
  const at = (minutes: number, seconds = 0) => Date.parse(APPLIED) + (minutes * 60 + seconds) * 1000
  const coupon = (code: string, expired = false, flash = false) => ({
    code,
    percentOff: 10,
    expired,
    flash,
  })

  it('keeps a regular coupon valid and an expired one always expired', () => {
    expect(couponState(coupon('KURIO10'), APPLIED, at(600))).toBe('valid')
    expect(couponState(coupon('EXPIRADO', true), APPLIED, at(0))).toBe('expired')
  })

  it('expires the flash coupon 5 minutes after it was applied', () => {
    const flash = coupon('RELAMPAGO', false, true)
    expect(couponState(flash, APPLIED, at(4, 59))).toBe('valid')
    expect(couponState(flash, APPLIED, at(5))).toBe('expired')
  })
})

describe('isQuoteStale', () => {
  const quote = {
    cartVersion: 4,
    nftVersions: { n1: 2, n2: 7 },
    expiresAt: '2026-07-29T12:10:00.000Z',
  }
  const nfts = [
    { id: 'n1', version: 2 },
    { id: 'n2', version: 7 },
    { id: 'n3', version: 1 },
  ]
  const before = Date.parse('2026-07-29T12:05:00.000Z')

  it('is fresh while cart, Nfts and clock match the quote', () => {
    expect(isQuoteStale(quote, { cartVersion: 4, nfts, now: before })).toBe(false)
  })

  it('goes stale when a quoted Nft has a newer version', () => {
    const changed = nfts.map((nft) => (nft.id === 'n2' ? { ...nft, version: 8 } : nft))
    expect(isQuoteStale(quote, { cartVersion: 4, nfts: changed, now: before })).toBe(true)
  })

  it('ignores Nfts that are not in the quote', () => {
    const changed = nfts.map((nft) => (nft.id === 'n3' ? { ...nft, version: 9 } : nft))
    expect(isQuoteStale(quote, { cartVersion: 4, nfts: changed, now: before })).toBe(false)
  })

  it('goes stale when the cart version changed', () => {
    expect(isQuoteStale(quote, { cartVersion: 5, nfts, now: before })).toBe(true)
  })

  it('goes stale at expiresAt', () => {
    const expiry = Date.parse(quote.expiresAt)
    expect(isQuoteStale(quote, { cartVersion: 4, nfts, now: expiry })).toBe(true)
  })
})

describe('lineStatus', () => {
  it('flags sold out and short editions', () => {
    expect(lineStatus(2, 5)).toBe('ok')
    expect(lineStatus(2, 2)).toBe('ok')
    expect(lineStatus(3, 2)).toBe('exceedsAvailable')
    expect(lineStatus(1, 0)).toBe('unavailable')
  })
})

describe('mergeLines on a sold out edition the collector already had', () => {
  it('keeps the collector line and only drops what the visitor brought', () => {
    const merged = mergeLines(
      [{ nftId: 'n9', editionId: 'gone', quantity: 2 }],
      [{ nftId: 'n9', editionId: 'gone', quantity: 1 }],
      capOf,
    )
    expect(merged.lines).toEqual([{ nftId: 'n9', editionId: 'gone', quantity: 2 }])
    expect(merged.adjustments).toEqual([{ nftId: 'n9', editionId: 'gone', from: 3, to: 2 }])
  })
})
