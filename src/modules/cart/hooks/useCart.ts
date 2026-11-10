import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { sessionQueries } from '@/modules/auth'
import { type Cart, isApiError } from '@/shared/contracts'
import { tokenStore } from '@/shared/lib/tokenStore'

import { addCartItem, removeCartLine, updateCartLine } from '../api'
import { removeLine, setLineQuantity } from '../lines'
import { cartQueries } from '../queries'

/** Toda mutation do carrinho: o resumo vira skeleton enquanto alguma está em voo. */
export const CART_MUTATION = ['cart']

/**
 * `undefined` para o Visitante (a sessão já está em cache desde o boot da rota raiz). Também
 * re-renderiza quando nasce o `cartToken`, para a key de quem usa `cartQueries` seguir a nova.
 */
export function useUserId() {
  useSyncExternalStore(tokenStore.subscribeCartToken, tokenStore.getCartToken)
  return useQuery(sessionQueries.current()).data?.user.id
}

export function useCart() {
  return useSuspenseQuery(cartQueries.current(useUserId()))
}

/**
 * Grava a resposta (SPEC §11.3) na key calculada agora, depois de um possível `cartToken` novo.
 * Resposta mais velha que o cache (cliques rápidos) não regride o carrinho.
 */
export function writeCart(queryClient: QueryClient, userId: string | undefined, cart: Cart) {
  queryClient.setQueryData(cartQueries.current(userId).queryKey, (cached) =>
    cached && cached.version > cart.version ? cached : cart,
  )
}

/** Texto do 409 `AVAILABILITY_CONFLICT`: `details.available` é o teto da linha (SPEC §5.5). */
function availabilityMessage(error: unknown): string | null {
  if (!isApiError(error, 'AVAILABILITY_CONFLICT')) return null
  const { available } = (error.details ?? {}) as { available?: number }
  if (available === undefined) return 'Quantidade maior que a disponível.'
  return available === 0
    ? 'Esta edição esgotou.'
    : `Você pode ter no máximo ${available} desta edição no carrinho.`
}

/** Não otimista (SPEC §7): espera o servidor validar a disponibilidade. */
export function useAddToCart() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationKey: CART_MUTATION,
    mutationFn: addCartItem,
    onSuccess: (cart) => writeCart(queryClient, userId, cart),
    onError: (error) =>
      toast.error(
        availabilityMessage(error) ?? 'Não foi possível adicionar ao carrinho. Tente novamente.',
      ),
  })
}

interface LineChange {
  lineId: string
  quantity: number
}

/** Quantidade e remoção otimistas com rollback e toast (SPEC §11.3). `quantity: 0` remove. */
export function useChangeLine() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationKey: CART_MUTATION,
    mutationFn: ({ lineId, quantity }: LineChange) =>
      quantity === 0 ? removeCartLine(lineId) : updateCartLine(lineId, quantity),
    onMutate: async ({ lineId, quantity }) => {
      const { queryKey } = cartQueries.current(userId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Cart>(queryKey)
      if (previous) {
        queryClient.setQueryData<Cart>(
          queryKey,
          quantity === 0
            ? removeLine(previous, lineId)
            : setLineQuantity(previous, lineId, quantity),
        )
      }
      return { queryKey, previous }
    },
    onError: (error, { quantity }, context) => {
      if (context?.previous) {
        // Outra mudança já gravou uma versão mais nova: restaurar regrediria; busca a do servidor.
        const current = queryClient.getQueryData<Cart>(context.queryKey)
        if (current && current.version > context.previous.version) {
          void queryClient.invalidateQueries({ queryKey: context.queryKey })
        } else {
          queryClient.setQueryData(context.queryKey, context.previous)
        }
      }
      toast.error(
        availabilityMessage(error) ??
          (quantity === 0
            ? 'Não foi possível remover o item. Tente novamente.'
            : 'Não foi possível alterar a quantidade. Tente novamente.'),
      )
    },
    onSuccess: (cart) => writeCart(queryClient, userId, cart),
  })
}
