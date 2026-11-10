import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { sessionQueries } from '@/modules/auth'
import type { Profile } from '@/shared/contracts'

import { getProfile } from './api'

export const accountQueries = {
  profile: (userId: string) =>
    queryOptions({
      queryKey: ['profile', userId],
      queryFn: ({ signal }) => getProfile(signal),
      staleTime: Infinity,
    }),
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
