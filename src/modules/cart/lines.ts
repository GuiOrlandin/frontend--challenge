/** Regras puras do carrinho no cliente: patch otimista e textos de aviso (SPEC §7). */
import type { Cart, CartLine, CartLineStatus, Nft } from '@/shared/contracts'
import { compare, formatEth, mulQty } from '@/shared/lib/eth'

// Mesma regra do servidor; a resposta da API sobrescreve o patch otimista.
const statusOf = (quantity: number, available: number): CartLineStatus =>
  available === 0 ? 'unavailable' : quantity > available ? 'exceedsAvailable' : 'ok'

/** Patch otimista da quantidade; o total da linha é só pré-visualização (o resumo vem da API). */
export function setLineQuantity(cart: Cart, lineId: string, quantity: number): Cart {
  return {
    ...cart,
    lines: cart.lines.map((line) =>
      line.lineId === lineId
        ? {
            ...line,
            quantity,
            lineTotal: mulQty(line.unitPrice, quantity),
            status: statusOf(quantity, line.available),
          }
        : line,
    ),
  }
}

export function removeLine(cart: Cart, lineId: string): Cart {
  return { ...cart, lines: cart.lines.filter((line) => line.lineId !== lineId) }
}

/**
 * O que um `nft.updated` muda nas linhas abertas (preço, esgotada, menos que a quantidade),
 * comparando as linhas de antes do refetch com o Nft novo.
 */
export function describeNftChanges(lines: CartLine[], nft: Nft) {
  const lineIds: string[] = []
  const messages: string[] = []
  for (const line of lines) {
    const edition = line.nftId === nft.id && nft.editions.find((e) => e.id === line.editionId)
    if (!edition) continue
    const parts: string[] = []
    if (compare(line.unitPrice, edition.price) !== 0) {
      parts.push(`preço mudou de ${formatEth(line.unitPrice)} para ${formatEth(edition.price)} ETH`)
    }
    if (edition.available === 0 && line.available > 0) {
      parts.push(`edição ${line.nft.editionLabel} esgotada`)
    } else if (
      edition.available > 0 &&
      edition.available < line.quantity &&
      edition.available !== line.available
    ) {
      parts.push(
        edition.available === 1
          ? 'só resta 1 disponível'
          : `só restam ${edition.available} disponíveis`,
      )
    }
    if (parts.length === 0) continue
    lineIds.push(line.lineId)
    messages.push(`${line.nft.title}: ${parts.join(', ')}`)
  }
  return { lineIds, messages }
}

/** Aviso das linhas cortadas pelo teto no merge do login. */
export function adjustmentMessages(cart: Cart): string[] {
  return (cart.adjustments ?? []).map((adjustment) => {
    const line = cart.lines.find(
      (l) => l.nftId === adjustment.nftId && l.editionId === adjustment.editionId,
    )
    return `Ajustamos a quantidade de ${line?.nft.title ?? 'um item'} para ${adjustment.to}`
  })
}
