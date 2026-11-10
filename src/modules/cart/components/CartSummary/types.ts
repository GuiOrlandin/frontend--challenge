import type { Cart } from '@/shared/contracts'

export interface CartSummaryProps {
  cart: Cart
  /** Alguma mutation ou refetch do carrinho em voo: os valores ainda vão mudar. */
  updating: boolean
}
