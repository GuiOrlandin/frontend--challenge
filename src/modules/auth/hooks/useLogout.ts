import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { logout } from '../api'
import { endLocalSession } from '../session'

/** Logout na ordem da SPEC §6. `switchUser` é a troca de usuário: logout e o login já aberto. */
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return async ({ switchUser = false } = {}) => {
    // Sem rede o logout local ainda acontece; o token vence sozinho no servidor.
    await logout().catch(() => undefined)
    endLocalSession(queryClient)
    // Navega antes de invalidar: invalidar numa rota privada faria o guard abrir o login (SPEC §17).
    await router.navigate({ to: '/', search: switchUser ? { auth: 'entrar' } : {} })
    await router.invalidate()
  }
}
