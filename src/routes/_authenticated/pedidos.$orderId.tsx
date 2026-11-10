import { createFileRoute, notFound } from '@tanstack/react-router'

import { checkoutQueries, OrderPage, OrderPageSkeleton } from '@/modules/checkout'
import { isApiError } from '@/shared/contracts'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  loader: ({ context: { queryClient, session }, params: { orderId } }) =>
    session &&
    queryClient.query(checkoutQueries.order(session.user.id, orderId)).catch((error: unknown) => {
      throw isApiError(error, 'NOT_FOUND') ? notFound() : error
    }),
  pendingComponent: OrderPageSkeleton,
  component: OrderPage,
})
