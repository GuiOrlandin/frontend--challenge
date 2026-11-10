import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { sessionQueries } from '@/modules/auth'
import type { Profile, Wallet } from '@/shared/contracts'

import { getProfile, getWallets } from './api'

export const accountQueries = {
  profile: (userId: string) =>
    queryOptions({
      queryKey: ['profile', userId],
      queryFn: ({ signal }) => getProfile(signal),
      staleTime: Infinity,
    }),
  wallets: (userId: string) =>
    queryOptions({
      queryKey: ['wallets', userId],
      queryFn: ({ signal }) => getWallets(signal),
      staleTime: Infinity,
    }),
}

/** A Carteira salva entra na lista sem refetch (SPEC §11): troca a de mesmo id ou é acrescentada. */
export function saveWallet(queryClient: QueryClient, userId: string, wallet: Wallet) {
  queryClient.setQueryData(accountQueries.wallets(userId).queryKey, (wallets = []) =>
    wallets.some((w) => w.id === wallet.id)
      ? wallets.map((w) => (w.id === wallet.id ? wallet : w))
      : [...wallets, wallet],
  )
}

/** A resposta do Perfil vai para `['profile']` e para `['session']` (nome e avatar no header, SPEC §9). */
export function saveProfile(queryClient: QueryClient, userId: string, profile: Profile) {
  queryClient.setQueryData(accountQueries.profile(userId).queryKey, profile)
  queryClient.setQueryData(sessionQueries.current().queryKey, (session) => {
    if (!session) return session
    const { displayName, username, email, avatarUrl } = profile
    return { ...session, user: { ...session.user, displayName, username, email, avatarUrl } }
  })
}
