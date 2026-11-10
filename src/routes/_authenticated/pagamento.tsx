import { createFileRoute } from '@tanstack/react-router'

import { CheckoutPage, CheckoutPageSkeleton, loadCheckout } from '@/modules/checkout'
import { checkoutSearchSchema } from '@/shared/contracts'

export const Route = createFileRoute('/_authenticated/pagamento')({
  validateSearch: checkoutSearchSchema,
  loader: ({ context, preload }) =>
    context.session && loadCheckout(context.queryClient, context.session.user.id, preload),
  pendingComponent: CheckoutPageSkeleton,
  component: CheckoutPage,
})
