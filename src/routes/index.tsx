import { createFileRoute, stripSearchParams } from '@tanstack/react-router'

import { catalogQueries, HomePage } from '@/modules/catalog'
import { CATALOG_SEARCH_DEFAULTS, catalogSearchSchema } from '@/shared/contracts'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search: { q, category, network, priceMin, priceMax, tab, sort, page } }) => ({
    q,
    category,
    network,
    priceMin,
    priceMax,
    tab,
    sort,
    page,
  }),
  // Só adianta as buscas: hero, grade e filtros usam `useQuery` e mostram o próprio skeleton,
  // erro e retry (SPEC §11.4), sem trocar a página inteira a cada filtro.
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(catalogQueries.list(deps))
    void queryClient.prefetchQuery(catalogQueries.facets(deps))
    void queryClient.prefetchQuery(catalogQueries.highlights())
  },
  component: HomePage,
})
