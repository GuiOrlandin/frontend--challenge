import type { QueryClient } from '@tanstack/react-query'

import type { Order, RealtimeEvent } from '@/shared/contracts'

/**
 * Aplica `order.updated` em `['order', userId, id]` (SPEC §10.3) só se a versão for maior.
 * Esqueleto: a invalidação do carrinho no `confirmed` entra na task do pedido.
 */
export function applyOrderUpdated(queryClient: QueryClient, event: RealtimeEvent<'order.updated'>) {
  // O evento não traz o `userId`: o pedido só está em cache sob a key do dono atual.
  queryClient.setQueriesData<Order>({ queryKey: ['order'] }, (cached) =>
    cached?.id === event.resourceId && cached.version < event.version ? event.data : cached,
  )
}
