import type { Cart, Quote } from '@/shared/contracts'

export interface CheckoutSummaryProps {
  cart: Cart
  /** Revisão: linhas e valores firmes da Cotação no lugar dos estimados do carrinho. */
  quote?: Quote
}
