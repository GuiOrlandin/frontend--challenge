/**
 * Carrinho do mock (SPEC §7): o do Colecionador (Bearer) ou o do Visitante (`X-Cart-Token`),
 * guardado no banco só com quantidades. Preço e disponibilidade vêm sempre do Nft atual.
 */
import { HttpResponse } from 'msw'

import type { Cart, CartAdjustment, CartLine, CartNotice } from '@/shared/contracts'
import { mulQty } from '@/shared/lib/eth'

import { db } from './db'
import type { CartRecord } from './fixtures'
import { couponState, lineStatus, priceLines, type CartLineRef } from './rules/cart'
import { requireUser } from './session'

export const CART_TOKEN_HEADER = 'X-Cart-Token'

export const lineIdOf = (line: CartLineRef) => `line_${line.nftId}_${line.editionId}`

export function findEdition(nftId: string, editionId: string) {
  const nft = db.findNft(nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : undefined
}

/** Teto da linha: `min(available, maxPerOrder)`; Edição inexistente não aceita nada. */
export function capOf(line: CartLineRef): number {
  const found = findEdition(line.nftId, line.editionId)
  return found ? Math.min(found.edition.available, found.edition.maxPerOrder) : 0
}

function insertCart(cart: CartRecord): CartRecord {
  db.mutate((data) => ({ ...data, carts: [...data.carts, cart] }))
  return cart
}

export function userCart(userId: string): CartRecord {
  return (
    db.data.carts.find((cart) => cart.userId === userId) ??
    insertCart({ id: `cart_${userId}`, userId, version: 1, lines: [], coupon: null })
  )
}

/**
 * Carrinho da requisição. Com Bearer, exige sessão válida (401 senão). Sem Bearer, usa o do
 * `X-Cart-Token` ou cria um de Visitante novo, cujo token volta no header da resposta.
 */
export function resolveCart(request: Request): { cart: CartRecord; newToken?: string } | Response {
  if (request.headers.has('Authorization')) {
    const user = requireUser(request)
    return user instanceof Response ? user : { cart: userCart(user.id) }
  }
  const token = request.headers.get(CART_TOKEN_HEADER)
  const visitor = token ? db.data.carts.find((cart) => cart.token === token) : undefined
  if (visitor) return { cart: visitor }
  const newToken = crypto.randomUUID()
  const cart = insertCart({
    id: `cart_${newToken.slice(0, 8)}`,
    token: newToken,
    version: 1,
    lines: [],
    coupon: null,
  })
  return { cart, newToken }
}

/** Grava uma mudança do carrinho incrementando `version`. */
export function saveCart(
  cart: CartRecord,
  patch: Partial<Pick<CartRecord, 'lines' | 'coupon'>>,
): CartRecord {
  const updated: CartRecord = { ...cart, ...patch, version: cart.version + 1 }
  db.mutate((data) => ({
    ...data,
    carts: data.carts.map((c) => (c.id === cart.id ? updated : c)),
  }))
  return updated
}

export function deleteCart(id: string) {
  db.mutate((data) => ({ ...data, carts: data.carts.filter((cart) => cart.id !== id) }))
}

export const findCoupon = (code: string) => db.data.coupons.find((c) => c.code === code)

/** Cupom aplicado ainda vale agora? Código que sumiu das fixtures não vale. */
export function isCouponValid(applied: CartRecord['coupon']): boolean {
  const fixture = applied && findCoupon(applied.code)
  return !!fixture && couponState(fixture, applied.appliedAt, Date.now()) === 'valid'
}

/** Cupom vencido depois de aplicado (`RELAMPAGO`) sai na próxima leitura, com aviso. */
export function dropExpiredCoupon(cart: CartRecord): { cart: CartRecord; notices: CartNotice[] } {
  if (!cart.coupon || isCouponValid(cart.coupon)) return { cart, notices: [] }
  const message = `O cupom ${cart.coupon.code} expirou e foi removido.`
  return { cart: saveCart(cart, { coupon: null }), notices: [{ code: 'COUPON_REMOVED', message }] }
}

export function couponOf(cart: CartRecord) {
  const fixture = cart.coupon && findCoupon(cart.coupon.code)
  return fixture ? { code: fixture.code, percentOff: fixture.percentOff } : null
}

export function toCartLines(cart: CartRecord): CartLine[] {
  // shortcut: linha de Nft que sumiu do catálogo é omitida; Nfts não são excluídos no mock.
  return cart.lines.flatMap((line) => {
    const found = findEdition(line.nftId, line.editionId)
    if (!found) return []
    const { nft, edition } = found
    return {
      ...line,
      nft: {
        title: nft.title,
        tokenId: nft.tokenId,
        image: nft.images[0]?.src ?? '',
        editionLabel: edition.label,
      },
      unitPrice: edition.price,
      lineTotal: mulQty(edition.price, line.quantity),
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
      status: lineStatus(line.quantity, edition.available),
    }
  })
}

/** Resposta `Cart`: tira cupom vencido e estima o resumo na Rede padrão (Ethereum). */
export function cartResponse(
  record: CartRecord,
  extra: { newToken?: string; adjustments?: CartAdjustment[] } = {},
) {
  const { cart, notices } = dropExpiredCoupon(record)
  const lines = toCartLines(cart)
  const coupon = couponOf(cart)
  const totals = priceLines(
    lines.filter((line) => line.status === 'ok'),
    coupon?.percentOff ?? null,
    db.data.networkFees.ethereum,
  )
  const body: Cart = {
    id: cart.id,
    version: cart.version,
    lines,
    coupon,
    summary: { ...totals, network: 'ethereum' },
    ...(extra.adjustments?.length ? { adjustments: extra.adjustments } : {}),
    ...(notices.length ? { notices } : {}),
  }
  const headers = extra.newToken ? { [CART_TOKEN_HEADER]: extra.newToken } : undefined
  return HttpResponse.json<Cart>(body, { headers })
}
