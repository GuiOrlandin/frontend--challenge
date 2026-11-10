/** Diferenças entre a Cotação na tela e o estado atual, para o `QuoteChangesNotice` (SPEC §8.2). */
import type { Cart, CartLineStatus, Coupon, Eth, Quote } from '@/shared/contracts'
import { compare, formatEth } from '@/shared/lib/eth'

interface ComparableLine {
  nftId: string
  editionId: string
  title: string
  quantity: number
  unitPrice: Eth
  available?: number
  status?: CartLineStatus
}

/** O que a Cotação é comparada contra: o carrinho atual ou a Cotação nova. */
export interface QuoteTarget {
  lines: ComparableLine[]
  coupon: Coupon | null
  /** Só a Cotação nova traz a taxa da Rede; a do carrinho é estimada em Ethereum. */
  networkFee?: Eth
}

export const cartTarget = (cart: Cart): QuoteTarget => ({
  lines: cart.lines.map((line) => ({ ...line, title: line.nft.title })),
  coupon: cart.coupon,
})

const sameLine = (a: ComparableLine) => (b: ComparableLine) =>
  a.nftId === b.nftId && a.editionId === b.editionId

const eth = (value: Eth) => `${formatEth(value)} ETH`

export function describeQuoteChanges(quote: Quote, next: QuoteTarget): string[] {
  const messages: string[] = []
  for (const line of quote.lines) {
    const now = next.lines.find(sameLine(line))
    if (!now) {
      messages.push(`${line.title}: saiu do carrinho`)
      continue
    }
    const parts: string[] = []
    if (compare(line.unitPrice, now.unitPrice) !== 0) {
      parts.push(`preço mudou de ${eth(line.unitPrice)} para ${eth(now.unitPrice)}`)
    }
    if (now.status === 'unavailable') parts.push('esgotado')
    else if (now.status === 'exceedsAvailable' && now.available !== undefined) {
      parts.push(
        now.available === 1 ? 'só resta 1 disponível' : `só restam ${now.available} disponíveis`,
      )
    }
    if (now.quantity !== line.quantity) {
      parts.push(`quantidade mudou de ${line.quantity} para ${now.quantity}`)
    }
    if (parts.length) messages.push(`${line.title}: ${parts.join(', ')}`)
  }
  for (const line of next.lines) {
    if (!quote.lines.some(sameLine(line))) messages.push(`${line.title}: entrou no carrinho`)
  }
  if (quote.coupon && quote.coupon.code !== next.coupon?.code) {
    messages.push(`Cupom ${quote.coupon.code} removido`)
  }
  if (next.networkFee && compare(quote.networkFee, next.networkFee) !== 0) {
    messages.push(`Taxa de rede mudou de ${eth(quote.networkFee)} para ${eth(next.networkFee)}`)
  }
  return messages
}
