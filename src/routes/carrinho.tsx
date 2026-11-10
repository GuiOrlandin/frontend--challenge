import { createFileRoute } from '@tanstack/react-router'

import { CartPage } from '@/modules/cart'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/carrinho')({
  pendingComponent: PageSkeleton,
  component: CartPage,
})
