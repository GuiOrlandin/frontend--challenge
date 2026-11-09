/** Favoritos do Colecionador, idempotentes (SPEC §5.3). */
import { http, HttpResponse } from 'msw'

import type { FavoriteIds } from '@/shared/contracts'

import { db } from '../db'
import { api, apiError } from '../respond'
import { requireUser, updateUser } from '../session'

const favorites = (nftIds: string[]) => HttpResponse.json<FavoriteIds>({ nftIds })

export const favoriteHandlers = [
  http.get(api('/me/favorites'), ({ request }) => {
    const user = requireUser(request)
    return user instanceof Response ? user : favorites(user.favoriteNftIds)
  }),

  http.put<{ nftId: string }>(api('/me/favorites/:nftId'), ({ request, params }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    if (!db.findNft(params.nftId)) return apiError(404, 'NOT_FOUND', 'Nft não encontrado.')
    if (user.favoriteNftIds.includes(params.nftId)) return favorites(user.favoriteNftIds)
    const updated = updateUser(user.id, (u) => ({
      ...u,
      favoriteNftIds: [...u.favoriteNftIds, params.nftId],
    }))
    return favorites(updated.favoriteNftIds)
  }),

  http.delete<{ nftId: string }>(api('/me/favorites/:nftId'), ({ request, params }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const updated = updateUser(user.id, (u) => ({
      ...u,
      favoriteNftIds: u.favoriteNftIds.filter((id) => id !== params.nftId),
    }))
    return favorites(updated.favoriteNftIds)
  }),
]
