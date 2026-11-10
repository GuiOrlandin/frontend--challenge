import type { FavoriteIds, Nft } from '@/shared/contracts'
import { http } from '@/shared/lib/http'

export async function getNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await http.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return data
}

export async function getFavorites(signal?: AbortSignal): Promise<FavoriteIds> {
  const { data } = await http.get<FavoriteIds>('/me/favorites', { signal })
  return data
}

/** PUT favorita, DELETE desfavorita; os dois são idempotentes e devolvem a lista inteira. */
export async function setFavorite(nftId: string, favorite: boolean): Promise<FavoriteIds> {
  const url = `/me/favorites/${encodeURIComponent(nftId)}`
  const { data } = favorite ? await http.put<FavoriteIds>(url) : await http.delete<FavoriteIds>(url)
  return data
}
