import { createFileRoute } from '@tanstack/react-router'

import { WalletsPage } from '@/modules/account'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/_authenticated/perfil/carteiras')({
  pendingComponent: PageSkeleton,
  component: WalletsPage,
})
