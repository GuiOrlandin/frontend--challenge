/** Cupons e taxa de rede (SPEC §7, §12.5). As regras de aplicação ficam na task do carrinho. */
import type { Eth, Network } from '@/shared/contracts'

export interface CouponFixture {
  code: string
  percentOff: number
  /** `EXPIRADO`: sempre recusado com `COUPON_EXPIRED`. */
  expired: boolean
  /** `RELAMPAGO`: válido ao aplicar, mas expira no meio do checkout. */
  flash: boolean
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
