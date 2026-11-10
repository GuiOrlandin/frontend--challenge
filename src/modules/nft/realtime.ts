import type { QueryClient } from '@tanstack/react-query'

import type { Highlights, Nft, Page, RealtimeEvent } from '@/shared/contracts'

/**
 * Aplica `nft.updated` no cache (SPEC §10.3): detalhe, listas e destaques onde o Nft aparece,
 * sempre só se a versão do evento for maior que a do cache. As listas tocadas ficam stale sem
 * refetch (o card não reordena) e o carrinho é invalidado.
 */
export function applyNftUpdated(queryClient: QueryClient, event: RealtimeEvent<'nft.updated'>) {
  const next = event.data
  const isStale = (cached: Nft) => cached.id === next.id && cached.version < next.version
  const swap = (cached: Nft): Nft => (isStale(cached) ? next : cached)

  const detail = queryClient.getQueryData<Nft>(['nfts', 'detail', next.id])
  // Evento igual ou mais velho que o detalhe em cache: nada a aplicar nem invalidar.
  if (detail && !isStale(detail)) return
  if (detail) queryClient.setQueryData(['nfts', 'detail', next.id], next)

  for (const [key, list] of queryClient.getQueriesData<Page<Nft>>({ queryKey: ['nfts', 'list'] })) {
    if (!list?.items.some(isStale)) continue
    queryClient.setQueryData<Page<Nft>>(key, { ...list, items: list.items.map(swap) })
    void queryClient.invalidateQueries({ queryKey: key, exact: true, refetchType: 'none' })
  }

  queryClient.setQueryData<Highlights>(
    ['highlights'],
    (cached) =>
      cached && {
        hero: cached.hero.map(swap),
        spotlight: cached.spotlight && swap(cached.spotlight),
      },
  )

  void queryClient.invalidateQueries({ queryKey: ['cart'] })
}
