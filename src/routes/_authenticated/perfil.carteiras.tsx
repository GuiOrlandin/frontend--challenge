import { createFileRoute } from '@tanstack/react-router'

import { accountQueries, WalletsPage, WalletsPageSkeleton } from '@/modules/account'

export const Route = createFileRoute('/_authenticated/perfil/carteiras')({
  loader: ({ context }) => {
    if (!context.session) return
    const { id } = context.session.user
    return Promise.all([
      context.queryClient.query(accountQueries.profile(id)),
      context.queryClient.query(accountQueries.wallets(id)),
    ])
  },
  pendingComponent: WalletsPageSkeleton,
  component: WalletsPage,
})
