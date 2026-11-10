import type { CartLine } from '@/shared/contracts'

export interface CartLineProps {
  line: CartLine
  /** Destaque da linha mudada por `nft.updated`. */
  highlighted?: boolean
}
