/** Regras puras do Pedido no mock (SPEC §8.4, §8.7). */
import type { Buyer, Nft, Quote, Receipt, Wallet, WalletProvider } from '@/shared/contracts'

import { createRandom } from '../random'
import type { CartLineRef } from './cart'

/**
 * Na confirmação, tira do carrinho só o que foi comprado (piso zero); o que foi adicionado
 * depois da Cotação fica. Linha zerada sai.
 */
export function subtractPurchased<T extends CartLineRef>(
  lines: readonly T[],
  purchased: readonly CartLineRef[],
): T[] {
  return lines
    .map((line) => {
      const bought = purchased
        .filter((p) => p.nftId === line.nftId && p.editionId === line.editionId)
        .reduce((sum, p) => sum + p.quantity, 0)
      return { ...line, quantity: Math.max(0, line.quantity - bought) }
    })
    .filter((line) => line.quantity > 0)
}

/** JSON com chaves ordenadas: o mesmo corpo em outra ordem compara igual. */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )

/**
 * `Idempotency-Key` (SPEC §8.4): chave nova cria; mesma chave e mesmo corpo repete o Pedido
 * (200); mesma chave e corpo diferente é 409 `IDEMPOTENCY_KEY_REUSED`.
 */
export function idempotencyOutcome(
  existing: { body: unknown } | undefined,
  body: unknown,
): 'create' | 'replay' | 'reused' {
  if (!existing) return 'create'
  return canonical(existing.body) === canonical(body) ? 'replay' : 'reused'
}

/** Hash simulado e determinístico: o mesmo número de Pedido dá sempre o mesmo hash. */
export function transactionHashOf(orderNumber: number): string {
  const random = createRandom(orderNumber)
  return `0x${Array.from({ length: 64 }, () => random.int(0, 15).toString(16)).join('')}`
}

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

/**
 * Recibo (SPEC §8.7): snapshot dos valores cotados, gravado ao confirmar e nunca recalculado.
 * Do catálogo vêm só `tokenId` e imagem; preços e totais são os da Cotação.
 */
export function buildReceipt(input: {
  quote: Pick<Quote, 'network' | 'lines' | 'subtotal' | 'discount' | 'networkFee' | 'total'>
  buyer: Buyer
  wallet: Pick<Wallet, 'label' | 'address'>
  provider: WalletProvider
  nftOf: (nftId: string) => Pick<Nft, 'tokenId' | 'images'> | undefined
  transactionHash: string
  confirmedAt: string
}): Receipt {
  const { quote, wallet } = input
  // Cópia profunda: o Recibo não compartilha referências com a Cotação nem com o comprador.
  return structuredClone({
    transactionHash: input.transactionHash,
    confirmedAt: input.confirmedAt,
    wallet: {
      label: wallet.label,
      shortAddress: shortAddress(wallet.address),
      provider: input.provider,
    },
    network: quote.network,
    buyer: input.buyer,
    lines: quote.lines.map((line) => {
      const nft = input.nftOf(line.nftId)
      return {
        title: line.title,
        tokenId: nft?.tokenId ?? '',
        image: nft?.images[0]?.src ?? '',
        editionLabel: line.editionLabel,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      }
    }),
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
  })
}
