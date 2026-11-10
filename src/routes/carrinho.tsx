import { createFileRoute } from '@tanstack/react-router'

import { CartPage, CartPageSkeleton, cartQueries } from '@/modules/cart'

export const Route = createFileRoute('/carrinho')({
  loader: ({ context }) => context.queryClient.query(cartQueries.current(context.session?.user.id)),
  pendingComponent: CartPageSkeleton,
  component: CartPage,
})
