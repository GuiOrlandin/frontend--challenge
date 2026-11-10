import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/modules/catalog'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/')({
  pendingComponent: PageSkeleton,
  component: HomePage,
})
