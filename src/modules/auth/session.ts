import type { QueryClient } from '@tanstack/react-query'

import type { Session } from '@/shared/contracts'
import { tokenStore } from '@/shared/lib/tokenStore'

import { sessionQueries } from './queries'

/**
 * `queryClient.clear()` da troca de identidade (SPEC §11.3), mas sem remover `['session']`:
 * quem assina a sessão (header, socket) ficaria preso à query removida e não veria a nova.
 */
export function clearPrivateData(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
  queryClient.getMutationCache().clear()
}

/** Grava a sessão no cache; o header e o `RealtimeProvider` (que recria o socket) reagem a ela. */
export function setSession(queryClient: QueryClient, session: Session | null) {
  queryClient.setQueryData(sessionQueries.current().queryKey, session)
}

export function hasSession(queryClient: QueryClient): boolean {
  return !!queryClient.getQueryData(sessionQueries.current().queryKey)
}

/** Rascunhos e tentativas do Colecionador em `sessionStorage` (SPEC §6), todos com prefixo `kurio-`. */
export function clearUserDrafts() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('kurio-')) sessionStorage.removeItem(key)
    }
  } catch {
    // Storage indisponível: nada a apagar.
  }
}

/**
 * Logout local (SPEC §6), comum ao logout, à expiração e ao logout em outra aba: token →
 * socket (cai com a sessão nula) → dados privados → rascunhos.
 */
export function endLocalSession(queryClient: QueryClient) {
  tokenStore.clearSessionToken()
  setSession(queryClient, null)
  clearPrivateData(queryClient)
  clearUserDrafts()
}
