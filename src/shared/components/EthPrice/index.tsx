import { formatEth } from '@/shared/lib/eth'

import type { EthPriceProps } from './types'

/** Valor em ETH no formato pt-BR: `"1.19"` → "1,19 ETH". */
export function EthPrice({ value, className }: EthPriceProps) {
  return <span className={className}>{formatEth(value)}&nbsp;ETH</span>
}
