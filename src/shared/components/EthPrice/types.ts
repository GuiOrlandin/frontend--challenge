import type { Eth } from '@/shared/lib/eth'

export interface EthPriceProps {
  /** Valor como string decimal, como vem da API. */
  value: Eth
  className?: string
}
