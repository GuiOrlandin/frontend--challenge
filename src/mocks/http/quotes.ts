/** Cotação firme do carrinho do Colecionador numa Rede (SPEC §5.3, §7, §8.2). */
import { http, HttpResponse } from 'msw'
import { z } from 'zod'

import { networkField, type Network, type Quote } from '@/shared/contracts'

import { couponOf, dropExpiredCoupon, toCartLines, userCart } from '../cart'
import { db } from '../db'
import { api, apiError, readJson, validate } from '../respond'
import { priceLines } from '../rules/cart'
import { onScreenOpened } from '../scenarioEvents'
import { requireUser } from '../session'

const QUOTE_TTL_MS = 10 * 60 * 1000

const quoteSchema = z.object({ network: networkField })

/**
 * Cota o carrinho atual e grava a Cotação; carrinho vazio é 422 e linha bloqueada é 409
 * `AVAILABILITY_CONFLICT`. Também gera a Cotação nova do `QUOTE_STALE` no pedido.
 */
export function createQuote(userId: string, network: Network): Quote | Response {
  const { cart, notices } = dropExpiredCoupon(userCart(userId))
  const lines = toCartLines(cart)
  if (!lines.length) {
    const message = 'O carrinho está vazio.'
    return apiError(422, 'VALIDATION_FAILED', message, { fieldErrors: { form: message } })
  }
  const blocked = lines.filter((line) => line.status !== 'ok')
  if (blocked.length) {
    return apiError(409, 'AVAILABILITY_CONFLICT', 'Há itens indisponíveis no carrinho.', {
      details: {
        lines: blocked.map(({ lineId, nftId, editionId, available, status }) => ({
          lineId,
          nftId,
          editionId,
          available,
          status,
        })),
        // O cupom vencido já saiu do carrinho: o aviso vai junto.
        ...(notices.length ? { notices } : {}),
      },
    })
  }

  const coupon = couponOf(cart)
  const quote: Quote = {
    // Sequencial: Cotações nunca são apagadas (determinismo da SPEC §12.5).
    quoteId: `qt_${String(db.data.quotes.length + 1).padStart(4, '0')}`,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    cartVersion: cart.version,
    network,
    nftVersions: Object.fromEntries(
      lines.map((line) => [line.nftId, db.findNft(line.nftId)!.version]),
    ),
    lines: lines.map(({ nftId, editionId, nft, quantity, unitPrice, lineTotal }) => ({
      nftId,
      editionId,
      title: nft.title,
      editionLabel: nft.editionLabel,
      quantity,
      unitPrice,
      lineTotal,
    })),
    coupon,
    ...priceLines(lines, coupon?.percentOff ?? null, db.data.networkFees[network]),
    ...(notices.length ? { notices } : {}),
  }
  db.mutate((data) => ({ ...data, quotes: [...data.quotes, { ...quote, userId }] }))
  return quote
}

export const quoteHandlers = [
  http.post(api('/quotes'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const input = validate(quoteSchema, await readJson(request))
    if (input instanceof Response) return input
    const quote = createQuote(user.id, input.network)
    if (quote instanceof Response) return quote
    // Entrar na revisão: a tela não tem `GET`, então o `POST /quotes` é o gatilho.
    onScreenOpened('review', userCart(user.id))
    return HttpResponse.json<Quote>(quote)
  }),
]
