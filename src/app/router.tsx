import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

import { NotFoundPage } from './layout/NotFoundPage'
import { RootLayout } from './layout/RootLayout'
import { RouteError } from './layout/RouteError'

/** Router do app (SPEC §4.1, §11.5): skeleton imediato e preload por intenção, cache decidido pelo Query. */
export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    // Cada tela troca pelo skeleton dela (`pendingComponent` na rota) na task da tela.
    defaultPendingComponent: PageSkeleton,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: RouteError,
    // Fica por fora das rotas: o layout aparece também no 404, no erro e durante o boot.
    InnerWrap: RootLayout,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
