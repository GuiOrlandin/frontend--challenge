import type { QueryClient } from '@tanstack/react-query'

import type { Order, RealtimeEvent } from '@/shared/contracts'

/**
 * Aplica `order.updated` em `['order', userId, id]` (SPEC §10.3) só se a versão for maior. Pedido
 * confirmado baixou o carrinho no servidor (SPEC §8.7): invalida o carrinho.
 */
export function applyOrderUpdated(queryClient: QueryClient, event: RealtimeEvent<'order.updated'>) {
  let applied = false
  // O evento não traz o `userId`: o pedido só está em cache sob a key do dono atual.
  queryClient.setQueriesData<Order>({ queryKey: ['order'] }, (cached) => {
    if (cached?.id !== event.resourceId || cached.version >= event.version) return cached
    applied = true
    return event.data
  })
  if (applied && event.data.status === 'confirmed') {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }
}
