import type { Cart, Wallet } from '@/shared/contracts'

export interface ReviewStepProps {
  userId: string
  wallets: Wallet[]
  /** Carrinho atual (refetch e `nft.updated`): base da obsolescência e das diferenças. */
  cart: Cart
}
