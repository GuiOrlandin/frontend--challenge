/**
 * Ciclo de vida do Pedido no mock (SPEC §8.5, §8.7): nasce `pending` e, ~3 s depois, vira
 * `confirmed` (baixa estoque, tira do carrinho o comprado, grava o Recibo) ou `refused`.
 */
import type { Order, RefusalReason } from '@/shared/contracts'

import { findEdition, saveCart, userCart } from './cart'
import { db } from './db'
import type { OrderRecord } from './fixtures'
import { buildReceipt, subtractPurchased, transactionHashOf } from './rules/orders'
import { getActiveScenario } from './scenarios'

/** Tempo até a "rede" decidir. É `setTimeout`: `page.clock` controla. */
export const DECISION_DELAY_MS = 3000

/** O `Order` público, sem os campos internos do mock. */
export const toOrder = (record: OrderRecord): Order => {
  const { id, status, refusalReason, quoteId, walletId, network, createdAt, version } = record
  const { lines, total, receipt } = record
  return {
    id,
    status,
    ...(refusalReason ? { refusalReason } : {}),
    quoteId,
    walletId,
    network,
    createdAt,
    version,
    lines,
    total,
    ...(receipt ? { receipt } : {}),
  }
}

const decisionDue = (order: OrderRecord) => Date.parse(order.createdAt) + DECISION_DELAY_MS

export function scheduleDecision(order: OrderRecord) {
  setTimeout(() => decideOrder(order.id), Math.max(0, decisionDue(order) - Date.now()))
}

/** Leitura do Pedido: o timer se perde no refresh, então decide aqui se já passou da hora. */
export function settleIfDue(order: OrderRecord): OrderRecord {
  return order.status === 'pending' && Date.now() >= decisionDue(order)
    ? (decideOrder(order.id) ?? order)
    : order
}

/** Decide um Pedido pendente; terminal (ou apagado por reset) fica como está. */
export function decideOrder(id: string): OrderRecord | undefined {
  const order = db.data.orders.find((o) => o.id === id)
  if (!order || order.status !== 'pending') return order
  const refuse = (refusalReason: RefusalReason) =>
    db.saveOrder({ ...order, status: 'refused', refusalReason })

  if (getActiveScenario().scenario.behavior?.kind === 'payment-refused') {
    return refuse('payment_declined')
  }
  const soldOut = order.lines.some(
    (line) => (findEdition(line.nftId, line.editionId)?.edition.available ?? 0) < line.quantity,
  )
  if (soldOut) return refuse('sold_out')

  // Baixa o estoque: um `nft.updated` por Nft comprado.
  for (const nftId of new Set(order.lines.map((line) => line.nftId))) {
    const nft = db.findNft(nftId)!
    db.updateNft(nftId, {
      editions: nft.editions.map((edition) => {
        const bought = order.lines
          .filter((line) => line.nftId === nftId && line.editionId === edition.id)
          .reduce((sum, line) => sum + line.quantity, 0)
        return bought ? { ...edition, available: edition.available - bought } : edition
      }),
    })
  }

  const cart = userCart(order.userId)
  saveCart(cart, { lines: subtractPurchased(cart.lines, order.lines) })

  // Quotes e Carteiras nunca são apagadas no mock.
  const quote = db.data.quotes.find((q) => q.quoteId === order.quoteId)!
  const wallet = db.data.users
    .find((u) => u.id === order.userId)!
    .wallets.find((w) => w.id === order.walletId)!
  return db.saveOrder({
    ...order,
    status: 'confirmed',
    receipt: buildReceipt({
      quote,
      buyer: order.buyer,
      wallet,
      provider: order.provider,
      nftOf: (nftId) => db.findNft(nftId),
      transactionHash: transactionHashOf(Number(order.id.replace('ord_', ''))),
      confirmedAt: new Date(Date.now()).toISOString(),
    }),
  })
}
