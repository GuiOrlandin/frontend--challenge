import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { mergeGuestCart } from '@/modules/cart'
import type { AuthResponse } from '@/shared/contracts'
import { tokenStore } from '@/shared/lib/tokenStore'

import { clearPrivateData, setSession } from '../session'

/** Sequência ao autenticar (SPEC §6), comum ao login e ao cadastro. */
export function useSignIn() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return async ({ token, session }: AuthResponse) => {
    const { redirect } = router.state.location.search
    clearPrivateData(queryClient)
    tokenStore.setSessionToken(token)
    // Falha no merge não desfaz o login: o `cartToken` fica e o carrinho de Visitante continua lá.
    await mergeGuestCart().catch(() => undefined)
    setSession(queryClient, session)
    await (redirect
      ? router.navigate({ href: redirect })
      : router.navigate({
          to: '.',
          search: (prev) => ({ ...prev, auth: undefined, redirect: undefined }),
        }))
    await router.invalidate()
  }
}
