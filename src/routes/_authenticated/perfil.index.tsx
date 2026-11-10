import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/modules/account'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/_authenticated/perfil/')({
  pendingComponent: PageSkeleton,
  component: ProfilePage,
})
