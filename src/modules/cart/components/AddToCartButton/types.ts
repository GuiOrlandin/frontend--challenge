export interface AddToCartButtonProps {
  nftId: string
  editionId: string
  /** Padrão: 1. */
  quantity?: number
  className?: string
  /** Padrão: carrinho de contorno. */
  icon?: React.ReactNode
}
