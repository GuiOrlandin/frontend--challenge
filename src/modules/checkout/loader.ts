import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { toast } from 'sonner'

import { accountQueries } from '@/modules/account'
import { cartQueries } from '@/modules/cart'

/**
 * Loader de `/pagamento` (SPEC §8.1): carrinho, Perfil e Carteiras em cache; carrinho vazio ou
 * com linha bloqueada volta ao `/carrinho` com aviso.
 */
export async function loadCheckout(queryClient: QueryClient, userId: string, preload: boolean) {
  const [cart] = await Promise.all([
    queryClient.query(cartQueries.current(userId)),
    queryClient.query(accountQueries.profile(userId)),
    queryClient.query(accountQueries.wallets(userId)),
  ])
  const empty = cart.lines.length === 0
  if (empty || cart.lines.some((line) => line.status !== 'ok')) {
    // O preload (hover no link) também passa aqui: o aviso só sai na navegação de verdade.
    if (!preload) {
      toast(
        empty
          ? 'Seu carrinho está vazio.'
          : 'Ajuste ou remova os itens indisponíveis para continuar.',
      )
    }
    throw redirect({ to: '/carrinho' })
  }
}
