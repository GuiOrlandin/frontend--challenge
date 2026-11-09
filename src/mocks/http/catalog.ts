/** Catálogo público (SPEC §5.3): lista, facets, detalhe e destaques. */
import { http, HttpResponse } from 'msw'

import type { Facets, Highlights, Nft, Page } from '@/shared/contracts'

import { db } from '../db'
import { CATEGORIES, NETWORK_LABELS } from '../fixtures'
import { computeFacets, parseCatalogQuery, queryCatalog } from '../rules/catalog'
import { api, apiError } from '../respond'

export const catalogHandlers = [
  http.get(api('/nfts'), ({ request }) => {
    const params = parseCatalogQuery(new URL(request.url).searchParams)
    return HttpResponse.json<Page<Nft>>(queryCatalog(db.data.nfts, params, { now: db.data.now }))
  }),

  // Antes de `/nfts/:id`, senão "facets" vira um id.
  http.get(api('/nfts/facets'), () =>
    HttpResponse.json<Facets>(computeFacets(db.data.nfts, CATEGORIES, NETWORK_LABELS)),
  ),

  http.get<{ id: string }>(api('/nfts/:id'), ({ params }) => {
    const nft = db.findNft(params.id)
    return nft ? HttpResponse.json<Nft>(nft) : apiError(404, 'NOT_FOUND', 'Nft não encontrado.')
  }),

  http.get(api('/highlights'), () => {
    const { heroIds, spotlightId } = db.data.highlights
    const hero = heroIds.flatMap((id) => db.findNft(id) ?? [])
    return HttpResponse.json<Highlights>({ hero, spotlight: db.findNft(spotlightId) ?? null })
  }),
]
