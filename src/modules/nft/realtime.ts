import type { QueryClient } from '@tanstack/react-query'

import type { Nft, RealtimeEvent } from '@/shared/contracts'

/**
 * Aplica `nft.updated` no cache (SPEC §10.3), só se a versão do evento for maior que a do cache.
 * Esqueleto: só o detalhe; listas, destaques e carrinho entram na task do detalhe do Nft.
 */
export function applyNftUpdated(queryClient: QueryClient, event: RealtimeEvent<'nft.updated'>) {
  queryClient.setQueryData<Nft>(['nfts', 'detail', event.resourceId], (cached) =>
    cached && cached.version < event.version ? event.data : cached,
  )
}
