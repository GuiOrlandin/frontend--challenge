import { Link, useNavigate } from '@tanstack/react-router'

import { EthPrice } from '@/shared/components/EthPrice'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { useUserId } from '../../hooks/useCart'
import { CouponForm } from '../CouponForm'

import type { CartSummaryProps } from './types'

/** Resumo sempre da API (SPEC §5.4): enquanto uma mudança está em voo, os valores viram skeleton. */
export function CartSummary({ cart, updating }: CartSummaryProps) {
  const navigate = useNavigate()
  const userId = useUserId()
  const { subtotal, discount, networkFee, total } = cart.summary
  const blocked = cart.lines.length === 0 || cart.lines.some((line) => line.status !== 'ok')

  const value = (eth: string, className?: string) =>
    updating ? <Skeleton className="h-5 w-24" /> : <EthPrice value={eth} className={className} />

  function checkout() {
    // Visitante entra antes; o login volta para o pagamento (SPEC §7).
    if (!userId) {
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, auth: 'entrar' as const, redirect: '/pagamento' }),
      })
      return
    }
    void navigate({ to: '/pagamento' })
  }

  return (
    <section aria-labelledby="resumo" className="flex flex-col gap-4">
      <h2 id="resumo" className="border-b pb-3 text-base font-bold">
        Resumo da carteira
      </h2>
      <CouponForm coupon={cart.coupon} />
      <dl aria-busy={updating} className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="text-base">{value(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Desconto do lançamento</dt>
          <dd className="text-xs">
            {updating ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <>
                (-) <EthPrice value={discount} />
              </>
            )}
          </dd>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4">
          <dt>Taxa de rede</dt>
          <dd className="text-base">{value(networkFee)}</dd>
          <dd className="col-span-2 text-right text-[10px] text-primary">Taxa estimada</dd>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 font-bold">
          <dt>Total</dt>
          <dd className="text-lg">{value(total, 'text-primary')}</dd>
        </div>
      </dl>
      <Button
        className="h-10 rounded-sm text-sm font-bold"
        aria-disabled={blocked || updating || undefined}
        aria-describedby={blocked && cart.lines.length > 0 ? 'checkout-bloqueado' : undefined}
        onClick={() => !blocked && !updating && checkout()}
      >
        Conectar e finalizar
      </Button>
      {blocked && cart.lines.length > 0 && (
        <p id="checkout-bloqueado" className="text-xs text-destructive">
          Ajuste ou remova os itens indisponíveis para continuar.
        </p>
      )}
      <Link to="/" hash="catalogo" className="self-center text-sm text-primary hover:underline">
        Continuar explorando
      </Link>
    </section>
  )
}
