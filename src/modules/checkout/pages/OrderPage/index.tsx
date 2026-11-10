import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

import { sessionQueries } from '@/modules/auth'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageContainer } from '@/shared/components/PageContainer'
import type { Order, RefusalReason } from '@/shared/contracts'
import { useRealtimeStatus } from '@/shared/lib/realtime'
import { Button } from '@/shared/ui/button'

import { clearAttempt, readAttempt } from '../../attempt'
import { Receipt } from '../../components/Receipt'
import { clearDraft } from '../../draft'
import { checkoutQueries } from '../../queries'
import { ReceiptSkeleton } from './OrderPageSkeleton'

/** Polling só com o socket fora e o pedido `pending` (SPEC §8.6, §11.2). */
const POLL_MS = 5_000

const REFUSAL_MESSAGES: Record<RefusalReason, string> = {
  payment_declined: 'O pagamento foi recusado pela carteira.',
  sold_out: 'Um dos itens esgotou antes da confirmação.',
}

const STATUS_ANNOUNCEMENTS: Record<Order['status'], string> = {
  pending: 'Aguardando confirmação da rede…',
  confirmed: 'Pedido confirmado.',
  refused: 'Pedido recusado.',
}

/** `/pedidos/$orderId` por estado (SPEC §8.5). O pedido já vem do loader (404 lá). */
export function OrderPage() {
  const { orderId } = useParams({ from: '/_authenticated/pedidos/$orderId' })
  const { data: session } = useSuspenseQuery(sessionQueries.current())
  const userId = session!.user.id
  const socket = useRealtimeStatus()
  const queryClient = useQueryClient()
  const { data: order } = useSuspenseQuery({
    ...checkoutQueries.order(userId, orderId),
    refetchInterval: (query) =>
      socket === 'disconnected' && query.state.data?.status === 'pending' ? POLL_MS : false,
  })

  // Estado terminal encerra o checkout desta compra. A invalidação do carrinho também cobre o
  // `confirmed` que chegou por polling ou refetch, sem passar pelo `applyOrderUpdated`.
  useEffect(() => {
    if (order.status === 'pending') return
    if (readAttempt(userId)?.orderId === order.id) {
      clearAttempt()
      clearDraft()
    }
    if (order.status === 'confirmed') void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }, [order.status, order.id, userId, queryClient])

  return (
    <PageContainer className="flex flex-col gap-4 py-6 md:py-10">
      <p
        role="status"
        aria-live="polite"
        className={order.status === 'pending' ? 'text-center font-bold' : 'sr-only'}
      >
        {STATUS_ANNOUNCEMENTS[order.status]}
      </p>
      {order.status === 'pending' && <ReceiptSkeleton />}
      {order.status === 'confirmed' && order.receipt && <Receipt receipt={order.receipt} />}
      {order.status === 'refused' && (
        <>
          <h1 className="sr-only">Pedido recusado</h1>
          <EmptyState
            title="Pedido recusado"
            description={`${order.refusalReason ? REFUSAL_MESSAGES[order.refusalReason] : ''} Seu carrinho continua como estava.`.trim()}
            action={
              <Button asChild>
                <Link to="/pagamento">Voltar ao pagamento</Link>
              </Button>
            }
          />
        </>
      )}
    </PageContainer>
  )
}
