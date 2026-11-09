/** Regras puras do carrinho e da Cotação do mock (SPEC §7, §8.2). Valores em BigInt (wei). */
import type { CartAdjustment, CartLineStatus, Eth, IsoDate, Nft, Quote } from '@/shared/contracts'
import { fromWei, toWei } from '@/shared/lib/eth'

import type { CouponFixture } from '../fixtures/commerce'

export interface CartLineRef {
  nftId: string
  editionId: string
  quantity: number
}

const sameEdition = (a: CartLineRef, b: CartLineRef) =>
  a.nftId === b.nftId && a.editionId === b.editionId

/**
 * Merge ao autenticar: soma o carrinho do Visitante no do Colecionador com teto
 * `min(available, maxPerOrder)`. Só o que o Visitante trouxe é cortado: a quantidade do
 * Colecionador fica (mesmo esgotada, vira linha `unavailable`); teto zero sem ela remove a linha.
 */
export function mergeLines(
  userLines: readonly CartLineRef[],
  visitorLines: readonly CartLineRef[],
  capOf: (line: CartLineRef) => number,
): { lines: CartLineRef[]; adjustments: CartAdjustment[] } {
  const lines = userLines.map((line) => ({ ...line }))
  const adjustments: CartAdjustment[] = []

  for (const visitor of visitorLines) {
    const existing = lines.find((line) => sameEdition(line, visitor))
    const own = existing?.quantity ?? 0
    const from = own + visitor.quantity
    const to = Math.max(own, Math.min(from, capOf(visitor)))
    if (to < from)
      adjustments.push({ nftId: visitor.nftId, editionId: visitor.editionId, from, to })
    if (existing) existing.quantity = to
    else lines.push({ nftId: visitor.nftId, editionId: visitor.editionId, quantity: to })
  }

  return { lines: lines.filter((line) => line.quantity > 0), adjustments }
}

export interface Totals {
  subtotal: Eth
  discount: Eth
  networkFee: Eth
  total: Eth
}

/** Subtotal, desconto percentual (arredondado para baixo no wei), taxa e total. Vazio não paga taxa. */
export function priceLines(
  lines: readonly { unitPrice: Eth; quantity: number }[],
  percentOff: number | null,
  networkFee: Eth,
): Totals {
  const subtotal = lines.reduce(
    (sum, line) => sum + toWei(line.unitPrice) * BigInt(line.quantity),
    0n,
  )
  const discount = (subtotal * BigInt(percentOff ?? 0)) / 100n
  const fee = lines.length ? toWei(networkFee) : 0n
  return {
    subtotal: fromWei(subtotal),
    discount: fromWei(discount),
    networkFee: fromWei(fee),
    total: fromWei(subtotal - discount + fee),
  }
}

/** `RELAMPAGO` vale por este tempo depois de aplicado: expira no meio do checkout. */
export const FLASH_COUPON_TTL_MS = 5 * 60 * 1000

/** Validade do Cupom aplicado em `appliedAt`, no instante `now` (ms). */
export function couponState(
  coupon: Pick<CouponFixture, 'expired' | 'flash'>,
  appliedAt: IsoDate,
  now: number,
): 'valid' | 'expired' {
  if (coupon.expired) return 'expired'
  if (coupon.flash && now >= Date.parse(appliedAt) + FLASH_COUPON_TTL_MS) return 'expired'
  return 'valid'
}

/**
 * Cotação obsoleta (SPEC §8.2): o carrinho mudou (`cartVersion`), um Nft cotado tem `version`
 * maior que a cotada, ou passou de `expiresAt`.
 */
export function isQuoteStale(
  quote: Pick<Quote, 'cartVersion' | 'nftVersions' | 'expiresAt'>,
  current: { cartVersion: number; nfts: readonly Pick<Nft, 'id' | 'version'>[]; now: number },
): boolean {
  if (current.cartVersion !== quote.cartVersion) return true
  if (current.now >= Date.parse(quote.expiresAt)) return true
  return current.nfts.some((nft) => nft.version > (quote.nftVersions[nft.id] ?? Infinity))
}

/** Linha sem estoque fica `unavailable`; acima do disponível, `exceedsAvailable` (SPEC §7). */
export function lineStatus(quantity: number, available: number): CartLineStatus {
  if (available === 0) return 'unavailable'
  return quantity > available ? 'exceedsAvailable' : 'ok'
}
