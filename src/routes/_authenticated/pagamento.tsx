import { createFileRoute } from '@tanstack/react-router'

import { CheckoutPage, CheckoutPageSkeleton, loadCheckout } from '@/modules/checkout'
import { checkoutSearchSchema } from '@/shared/contracts'
import { pageHead } from '@/shared/lib/pageHead'

export const Route = createFileRoute('/_authenticated/pagamento')({
  head: () => pageHead('Pagamento', 'Confirme seus dados e a carteira e finalize a compra em ETH.'),
  validateSearch: checkoutSearchSchema,
  loader: ({ context, preload }) =>
    context.session && loadCheckout(context.queryClient, context.session.user.id, preload),
  pendingComponent: CheckoutPageSkeleton,
  component: CheckoutPage,
})
