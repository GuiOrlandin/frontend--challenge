/** Cupons, taxa de rede, carrinhos e Cotações (SPEC §7, §12.5). Regras em `rules/cart.ts`. */
import type {
  Buyer,
  CheckoutConnection,
  Eth,
  IsoDate,
  Network,
  Order,
  Quote,
  WalletProvider,
} from '@/shared/contracts'

export interface CouponFixture {
  code: string
  percentOff: number
  /** `EXPIRADO`: sempre recusado com `COUPON_EXPIRED`. */
  expired: boolean
  /** `RELAMPAGO`: válido ao aplicar, mas expira no meio do checkout. */
  flash: boolean
  /** Primeira aplicação em qualquer carrinho: início da janela do `RELAMPAGO`. */
  firstAppliedAt?: IsoDate
}

export const COUPONS: CouponFixture[] = [
  { code: 'KURIO10', percentOff: 10, expired: false, flash: false },
  { code: 'EXPIRADO', percentOff: 15, expired: true, flash: false },
  { code: 'RELAMPAGO', percentOff: 20, expired: false, flash: true },
]

/** Taxa fixa por Rede, sempre em ETH. */
export const NETWORK_FEES: Record<Network, Eth> = {
  ethereum: '0.0042',
  polygon: '0.0006',
  solana: '0.0003',
}

/** Carrinho no banco: só as quantidades; preço e disponibilidade vêm do Nft atual (SPEC §7). */
export interface CartRecord {
  id: string
  /** Dono do carrinho da conta; ausente no carrinho de Visitante. */
  userId?: string
  /** `X-Cart-Token` do Visitante. */
  token?: string
  version: number
  lines: { lineId: string; nftId: string; editionId: string; quantity: number }[]
  coupon: { code: string; appliedAt: IsoDate } | null
}

/** Cotação emitida, guardada para o pedido revalidar (SPEC §8.4). */
export interface QuoteRecord extends Quote {
  userId: string
}

/** Conexão de carteira ativa: uma por Colecionador; conectar de novo derruba a anterior. */
export interface ConnectionRecord extends CheckoutConnection {
  userId: string
}

/** Pedido no banco: o `Order` público mais o que o mock precisa para replay e Recibo. */
export interface OrderRecord extends Order {
  userId: string
  idempotencyKey: string
  buyer: Buyer
  provider: WalletProvider
}
