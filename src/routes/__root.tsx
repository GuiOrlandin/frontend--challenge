import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'

import { sessionQueries } from '@/modules/auth'
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
  // Padrão da Início e das telas sem `head` próprio; as rotas filhas sobrescrevem (SPEC §15).
  head: () => ({
    meta: [
      { title: 'Kurio | Marketplace de NFTs' },
      {
        name: 'description',
        content: 'Kurio: compre NFTs de arte digital e colecionáveis, pagos em ETH.',
      },
    ],
  }),
  // O React 19 leva `<title>` e `<meta>` para o `<head>`.
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
})
