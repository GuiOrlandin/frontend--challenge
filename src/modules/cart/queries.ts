import { queryOptions } from '@tanstack/react-query'

import { tokenStore } from '@/shared/lib/tokenStore'

import { getCart } from './api'

/** Dono do carrinho na key (SPEC §11.1): o Colecionador ou o `cartToken` do Visitante. */
export const cartOwner = (userId?: string) =>
  userId ?? `guest:${tokenStore.getCartToken() ?? 'new'}`

export const cartQueries = {
  /** Sempre stale (SPEC §11.2): preço e disponibilidade mudam no servidor. */
  current: (userId?: string) =>
    queryOptions({
      queryKey: ['cart', cartOwner(userId)],
      queryFn: async ({ signal, client }) => {
        const cart = await getCart(signal)
        // Visitante novo: o token chegou agora; o carrinho já fica na key definitiva.
        if (!userId) client.setQueryData(['cart', cartOwner()], cart)
        return cart
      },
      staleTime: 0,
    }),
}
