import { createFileRoute } from '@tanstack/react-router'

import { CartPage, CartPageSkeleton, cartQueries } from '@/modules/cart'
import { pageHead } from '@/shared/lib/pageHead'

export const Route = createFileRoute('/carrinho')({
  head: () =>
    pageHead('Carrinho', 'Revise os NFTs do carrinho, aplique cupons e siga para o pagamento.'),
  loader: ({ context }) => context.queryClient.query(cartQueries.current(context.session?.user.id)),
  pendingComponent: CartPageSkeleton,
  component: CartPage,
})
