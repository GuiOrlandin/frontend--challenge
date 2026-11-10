import { createFileRoute } from '@tanstack/react-router'

import { accountQueries, ProfilePage, ProfilePageSkeleton } from '@/modules/account'
import { pageHead } from '@/shared/lib/pageHead'

export const Route = createFileRoute('/_authenticated/perfil/')({
  head: () => pageHead('Perfil', 'Edite seu perfil de colecionador, avatar e senha.'),
  loader: ({ context }) =>
    context.session && context.queryClient.query(accountQueries.profile(context.session.user.id)),
  pendingComponent: ProfilePageSkeleton,
  component: ProfilePage,
})
