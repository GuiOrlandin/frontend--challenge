/** Carrinho, cupom e merge ao autenticar (SPEC §5.3, §7). Toda resposta é o `Cart` inteiro. */
import { http } from 'msw'
import { z } from 'zod'

import {
  capOf,
  cartResponse,
  deleteCart,
  findCoupon,
  findEdition,
  isCouponValid,
  lineIdOf,
  resolveCart,
  saveCart,
  userCart,
} from '../cart'
import { db } from '../db'
import { api, apiError, readJson, validate } from '../respond'
import { couponState, mergeLines } from '../rules/cart'
import { requireUser } from '../session'

const quantity = z.number().int().min(1, 'Use ao menos 1')
const addItemSchema = z.object({ nftId: z.string().min(1), editionId: z.string().min(1), quantity })
const couponSchema = z.object({ code: z.string().trim().min(1, 'Informe o cupom') })
const mergeSchema = z.object({ cartToken: z.string().min(1) })

const availabilityConflict = (available: number) =>
  apiError(409, 'AVAILABILITY_CONFLICT', 'Quantidade maior que a disponível.', {
    details: { available },
  })

const lineNotFound = () => apiError(404, 'NOT_FOUND', 'Linha do carrinho não encontrada.')

export const cartHandlers = [
  http.get(api('/cart'), ({ request }) => {
    const resolved = resolveCart(request)
    return resolved instanceof Response ? resolved : cartResponse(resolved.cart, resolved)
  }),

  // Soma se a linha existe; não é otimista no cliente: o 409 volta antes de gravar.
  http.post(api('/cart/items'), async ({ request }) => {
    const resolved = resolveCart(request)
    if (resolved instanceof Response) return resolved
    const input = validate(addItemSchema, await readJson(request))
    if (input instanceof Response) return input
    if (!findEdition(input.nftId, input.editionId)) {
      return apiError(404, 'NOT_FOUND', 'Edição não encontrada.')
    }
    const { cart } = resolved
    const existing = cart.lines.find((line) => line.lineId === lineIdOf(input))
    const total = (existing?.quantity ?? 0) + input.quantity
    const cap = capOf(input)
    if (total > cap) return availabilityConflict(cap)
    const lines = existing
      ? cart.lines.map((line) => (line === existing ? { ...line, quantity: total } : line))
      : [...cart.lines, { lineId: lineIdOf(input), ...input }]
    return cartResponse(saveCart(cart, { lines }), resolved)
  }),

  http.patch<{ lineId: string }>(api('/cart/items/:lineId'), async ({ request, params }) => {
    const resolved = resolveCart(request)
    if (resolved instanceof Response) return resolved
    const input = validate(z.object({ quantity }), await readJson(request))
    if (input instanceof Response) return input
    const { cart } = resolved
    const line = cart.lines.find((l) => l.lineId === params.lineId)
    if (!line) return lineNotFound()
    const cap = capOf(line)
    if (input.quantity > cap) return availabilityConflict(cap)
    const lines = cart.lines.map((l) => (l === line ? { ...l, quantity: input.quantity } : l))
    return cartResponse(saveCart(cart, { lines }), resolved)
  }),

  http.delete<{ lineId: string }>(api('/cart/items/:lineId'), ({ request, params }) => {
    const resolved = resolveCart(request)
    if (resolved instanceof Response) return resolved
    const { cart } = resolved
    if (!cart.lines.some((l) => l.lineId === params.lineId)) return lineNotFound()
    const lines = cart.lines.filter((l) => l.lineId !== params.lineId)
    return cartResponse(saveCart(cart, { lines }), resolved)
  }),

  http.put(api('/cart/coupon'), async ({ request }) => {
    const resolved = resolveCart(request)
    if (resolved instanceof Response) return resolved
    const input = validate(couponSchema, await readJson(request))
    if (input instanceof Response) return input
    const code = input.code.toUpperCase()
    const fixture = findCoupon(code)
    if (!fixture) {
      const message = 'Cupom inválido.'
      return apiError(422, 'COUPON_INVALID', message, { fieldErrors: { code: message } })
    }
    // A janela do `RELAMPAGO` conta da primeira aplicação: reaplicar não a renova.
    const appliedAt = fixture.firstAppliedAt ?? new Date(Date.now()).toISOString()
    if (couponState(fixture, appliedAt, Date.now()) === 'expired') {
      const message = 'Este cupom expirou.'
      return apiError(422, 'COUPON_EXPIRED', message, { fieldErrors: { code: message } })
    }
    if (!fixture.firstAppliedAt) {
      db.mutate((data) => ({
        ...data,
        coupons: data.coupons.map((c) =>
          c.code === code ? { ...c, firstAppliedAt: appliedAt } : c,
        ),
      }))
    }
    return cartResponse(saveCart(resolved.cart, { coupon: { code, appliedAt } }), resolved)
  }),

  http.delete(api('/cart/coupon'), ({ request }) => {
    const resolved = resolveCart(request)
    if (resolved instanceof Response) return resolved
    return cartResponse(saveCart(resolved.cart, { coupon: null }), resolved)
  }),

  // Ao autenticar: soma o carrinho do Visitante com teto, decide o cupom e descarta o do Visitante.
  http.post(api('/cart/merge'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const input = validate(mergeSchema, await readJson(request))
    if (input instanceof Response) return input
    const cart = userCart(user.id)
    const visitor = db.data.carts.find((c) => c.token === input.cartToken)
    if (!visitor) return cartResponse(cart)
    const merged = mergeLines(cart.lines, visitor.lines, capOf)
    deleteCart(visitor.id)
    const saved = saveCart(cart, {
      lines: merged.lines.map((line) => ({ lineId: lineIdOf(line), ...line })),
      // Fica o do Colecionador; sem ele (ou vencido), herda o do Visitante.
      coupon: [cart.coupon, visitor.coupon].find(isCouponValid) ?? null,
    })
    return cartResponse(saved, { adjustments: merged.adjustments })
  }),
]
