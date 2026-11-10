import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { onSessionExpired } from '@/shared/lib/http'
import { tokenStore } from '@/shared/lib/tokenStore'

import { getSession } from '../api'
import {
  clearPrivateData,
  clearUserDrafts,
  endLocalSession,
  hasSession,
  setSession,
} from '../session'

/** Expiração em uso e sincronização entre abas (SPEC §6). Montado uma vez, no layout raiz. */
export function useSessionSync() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(
    () =>
      onSessionExpired(() => {
        // Sem sessão no cache: é o boot (o `getSession` já trata o 401 como Visitante, sem aviso)
        // ou outra chamada que venceu junto e já foi tratada.
        if (!hasSession(queryClient)) return
        endLocalSession(queryClient)
        toast('Sua sessão expirou, entre novamente')

        // `latestLocation` inclui a navegação em andamento (a chamada que expirou pode ser do loader).
        const location = router.latestLocation
        const isPrivate = router
          .matchRoutes(location)
          .some((match) => match.routeId.startsWith('/_authenticated'))
        void router.navigate(
          isPrivate
            ? { to: '/', search: { auth: 'entrar', redirect: location.href } }
            : { to: '.', search: (prev) => ({ ...prev, auth: 'entrar' }) },
        )
      }),
    [queryClient, router],
  )

  useEffect(() => {
    async function onStorage(event: StorageEvent) {
      // `key` nulo = `localStorage.clear()` em outra aba.
      if (event.key !== null && event.key !== tokenStore.sessionKey) return
      if (!tokenStore.getSessionToken()) {
        endLocalSession(queryClient)
        await router.navigate({ to: '/' })
        await router.invalidate()
        return
      }
      // Outro Colecionador (ou o mesmo de novo) entrou na outra aba.
      let session
      try {
        session = await getSession()
      } catch {
        return // Falha de rede: mantém o estado atual; o próximo 401 resolve.
      }
      clearPrivateData(queryClient)
      clearUserDrafts()
      setSession(queryClient, session)
      await router.invalidate()
    }
    const listener = (event: StorageEvent) => void onStorage(event)
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [queryClient, router])
}
