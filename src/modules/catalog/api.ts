import type { CatalogParams, Facets, Nft, Page } from '@/shared/contracts'
import { http } from '@/shared/lib/http'

/** `params` já normalizados (a mesma forma da query key). */
export async function getNfts(params: CatalogParams, signal?: AbortSignal): Promise<Page<Nft>> {
  const { data } = await http.get<Page<Nft>>('/nfts', { params, signal })
  return data
}

export async function getFacets(signal?: AbortSignal): Promise<Facets> {
  const { data } = await http.get<Facets>('/nfts/facets', { signal })
  return data
}
