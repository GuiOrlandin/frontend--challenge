import { createFileRoute } from '@tanstack/react-router'

import { CheckoutPage } from '@/modules/checkout'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/_authenticated/pagamento')({
  pendingComponent: PageSkeleton,
  component: CheckoutPage,
})
