import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext } from '@tanstack/react-router'

import { sessionQueries } from '@/modules/auth'
import { PageSkeleton } from '@/shared/components/PageSkeleton'
import { rootSearchSchema } from '@/shared/contracts'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: rootSearchSchema,
  // Boot da sessão (SPEC §6): em cache com staleTime Infinity, só bate na API na 1ª vez e após `clear()`.
  beforeLoad: async ({ context }) => ({
    session: await context.queryClient.query(sessionQueries.current()),
  }),
  pendingComponent: PageSkeleton,
})
