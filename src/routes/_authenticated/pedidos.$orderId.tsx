import { createFileRoute } from '@tanstack/react-router'

import { OrderPage } from '@/modules/checkout'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  pendingComponent: PageSkeleton,
  component: OrderPage,
})
