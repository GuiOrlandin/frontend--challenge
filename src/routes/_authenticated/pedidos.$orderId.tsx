import { createFileRoute } from '@tanstack/react-router'

import { OrderPage } from '@/modules/checkout'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  component: OrderPage,
})
