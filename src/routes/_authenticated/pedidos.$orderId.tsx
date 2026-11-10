import { createFileRoute, notFound } from '@tanstack/react-router'

import { checkoutQueries, OrderPage, OrderPageSkeleton } from '@/modules/checkout'
import { isApiError } from '@/shared/contracts'
import { pageHead } from '@/shared/lib/pageHead'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  head: () => pageHead('Pedido', 'Acompanhe o status do pedido e veja o recibo da compra.'),
  loader: ({ context: { queryClient, session }, params: { orderId } }) =>
    session &&
    queryClient.query(checkoutQueries.order(session.user.id, orderId)).catch((error: unknown) => {
      throw isApiError(error, 'NOT_FOUND') ? notFound() : error
    }),
  pendingComponent: OrderPageSkeleton,
  component: OrderPage,
})
