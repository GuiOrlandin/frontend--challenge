import { toast } from 'sonner'

import CartIcon from '@/assets/icons/cart.svg?react'
import { cn } from '@/shared/lib/utils'

import { useAddToCart } from '../../hooks/useCart'

import type { AddToCartButtonProps } from './types'

/** Ícone de carrinho: só adiciona e avisa (SPEC §13.6). Espera o servidor, sem otimismo. */
export function AddToCartButton({
  nftId,
  editionId,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const addToCart = useAddToCart()
  return (
    <button
      type="button"
      aria-label="Adicionar ao carrinho"
      aria-busy={addToCart.isPending}
      disabled={addToCart.isPending}
      onClick={() =>
        addToCart.mutate(
          { nftId, editionId, quantity },
          { onSuccess: () => toast('Adicionado ao carrinho') },
        )
      }
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-background/80 text-primary transition-colors hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60',
        className,
      )}
    >
      <CartIcon className="size-5" aria-hidden />
    </button>
  )
}
