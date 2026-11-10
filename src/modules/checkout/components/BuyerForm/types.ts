import type { Cart, Profile, Wallet } from '@/shared/contracts'

export interface BuyerFormProps {
  userId: string
  profile: Profile
  /** Ao menos uma Carteira cadastrada. */
  wallets: Wallet[]
  cart: Cart
}
