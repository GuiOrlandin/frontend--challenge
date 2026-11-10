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
    // Mobile: painel arredondado colado às bordas e preso ao pé da tela (sem título visível nem "Continuar explorando").
    <section
      aria-labelledby="resumo"
      className="flex flex-col gap-4 max-md:-mx-4 max-md:rounded-t-3xl max-md:bg-card max-md:px-4 max-md:pt-5 max-md:pb-[max(2rem,env(safe-area-inset-bottom))] max-md:sticky max-md:bottom-0 max-md:z-10"
    >
      <h2 id="resumo" className="border-b pb-3 text-lg font-bold max-md:sr-only">
        Resumo da carteira
      </h2>
      <CouponForm coupon={cart.coupon} />
      <dl aria-busy={updating} className="flex flex-col gap-3 text-15">
        <div className="flex items-center justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="text-base md:text-lg">{value(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Desconto do lançamento</dt>
          <dd className="text-15">
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
          <dd className="text-base md:text-lg">{value(networkFee)}</dd>
          <dd className="col-span-2 text-right text-xs text-primary">Taxa estimada</dd>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 text-base font-bold">
          <dt>Total</dt>
          <dd className="text-lg">{value(total, 'text-primary')}</dd>
        </div>
      </dl>
      <Button
        className="h-10 rounded-sm text-15 font-bold max-md:mt-2 max-md:text-base max-md:h-12 max-md:rounded-full max-md:bg-linear-to-r max-md:from-primary max-md:to-[#A86D3D]"
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
      <Link
        to="/"
        hash="catalogo"
        className="self-center text-15 text-primary hover:underline max-md:hidden"
      >
        Continuar explorando
      </Link>
    </section>
  )
}
