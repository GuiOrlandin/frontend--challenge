import { createFileRoute } from '@tanstack/react-router'

import { accountQueries, ProfilePage, ProfilePageSkeleton } from '@/modules/account'

export const Route = createFileRoute('/_authenticated/perfil/')({
  loader: ({ context }) =>
    context.session && context.queryClient.query(accountQueries.profile(context.session.user.id)),
  pendingComponent: ProfilePageSkeleton,
  component: ProfilePage,
})
