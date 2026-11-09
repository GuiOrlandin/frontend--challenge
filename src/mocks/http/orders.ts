/** Pedido com `Idempotency-Key`, revalidação da Cotação e leitura (SPEC §5.3, §8.4, §8.5). */
import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'

import { buyerSchema, type Order } from '@/shared/contracts'

import { dropExpiredCoupon, userCart } from '../cart'
import { db } from '../db'
import type { OrderRecord } from '../fixtures'
import { scheduleDecision, settleIfDue, toOrder } from '../orders'
import { api, apiError, readJson, validate } from '../respond'
import { isQuoteStale } from '../rules/cart'
import { idempotencyOutcome } from '../rules/orders'
import { getActiveScenario } from '../scenarios'
import { requireUser } from '../session'
import { createQuote } from './quotes'

/** `order-timeout`: passa do timeout de 10 s do Axios, com o pedido já criado. */
const ORDER_TIMEOUT_HOLD_MS = 15_000

const orderSchema = z.object({
  quoteId: z.string().min(1),
  walletId: z.string().min(1),
  connectionId: z.string().min(1),
  buyer: buyerSchema,
})

/** O que define o pedido no replay: sem `connectionId`, que muda se o cliente reconectar. */
const intentOf = ({
  quoteId,
  walletId,
  buyer,
}: Pick<OrderRecord, 'quoteId' | 'walletId' | 'buyer'>) => ({
  quoteId,
  walletId,
  buyer,
})

const walletDisconnected = () =>
  apiError(409, 'WALLET_DISCONNECTED', 'A carteira desconectou. Conecte de novo para continuar.')

const orderNotFound = () => apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')

export const orderHandlers = [
  http.post(api('/orders'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const key = request.headers.get('Idempotency-Key')
    if (!key) {
      const message = 'Envie o header Idempotency-Key.'
      return apiError(422, 'VALIDATION_FAILED', message, { fieldErrors: { form: message } })
    }
    const input = validate(orderSchema, await readJson(request))
    if (input instanceof Response) return input

    // Idempotência antes de tudo: o replay devolve o pedido mesmo se a conexão caiu depois.
    const existing = db.data.orders.find((o) => o.userId === user.id && o.idempotencyKey === key)
    const outcome = idempotencyOutcome(existing && { body: intentOf(existing) }, intentOf(input))
    if (existing && outcome === 'replay') {
      return HttpResponse.json<Order>(toOrder(settleIfDue(existing)))
    }
    if (outcome === 'reused') {
      return apiError(409, 'IDEMPOTENCY_KEY_REUSED', 'Esta chave já foi usada em outro pedido.')
    }

    const quote = db.data.quotes.find((q) => q.quoteId === input.quoteId && q.userId === user.id)
    if (!quote) return apiError(404, 'NOT_FOUND', 'Cotação não encontrada.')
    const wallet = user.wallets.find((w) => w.id === input.walletId)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const connection = db.data.connections.find(
      (c) =>
        c.connectionId === input.connectionId && c.userId === user.id && c.walletId === wallet.id,
    )
    if (!connection) return walletDisconnected()
    // Uma vez por reset: senão a reconexão também cairia.
    if (
      getActiveScenario().scenario.behavior?.kind === 'wallet-disconnected' &&
      !db.data.scenarioWalletDropped
    ) {
      db.mutate((data) => ({
        ...data,
        connections: data.connections.filter((c) => c.userId !== user.id),
        scenarioWalletDropped: true,
      }))
      return walletDisconnected()
    }

    // Revalida: carrinho, preços, estoque, cupom e validade (SPEC §8.2). A Rede vem da Carteira.
    const { cart } = dropExpiredCoupon(userCart(user.id))
    const stale =
      quote.network !== wallet.network ||
      isQuoteStale(quote, {
        cartVersion: cart.version,
        nfts: quote.lines.flatMap((line) => db.findNft(line.nftId) ?? []),
        now: Date.now(),
      })
    if (stale) {
      const fresh = createQuote(user.id, wallet.network)
      if (fresh instanceof Response) return fresh
      return apiError(409, 'QUOTE_STALE', 'A cotação mudou. Revise os valores.', {
        details: { quote: fresh },
      })
    }

    const order = db.saveOrder({
      // Sequencial: Pedidos nunca são apagados (determinismo da SPEC §12.5).
      id: `ord_${String(db.data.orders.length + 1).padStart(4, '0')}`,
      status: 'pending',
      quoteId: quote.quoteId,
      walletId: wallet.id,
      network: quote.network,
      createdAt: new Date(Date.now()).toISOString(),
      lines: quote.lines,
      total: quote.total,
      userId: user.id,
      idempotencyKey: key,
      buyer: input.buyer,
      provider: connection.provider,
    })
    scheduleDecision(order)

    if (getActiveScenario().scenario.behavior?.kind === 'order-timeout') {
      await delay(ORDER_TIMEOUT_HOLD_MS)
    }
    const current = db.data.orders.find((o) => o.id === order.id) ?? order
    return HttpResponse.json<Order>(toOrder(current), { status: 201 })
  }),

  http.get<{ id: string }>(api('/orders/:id'), ({ request, params }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    // Pedido de outro Colecionador é indistinguível de inexistente.
    const order = db.data.orders.find((o) => o.id === params.id && o.userId === user.id)
    return order ? HttpResponse.json<Order>(toOrder(settleIfDue(order))) : orderNotFound()
  }),
]
