import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { toast } from 'sonner'

import { isApiError } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import { applyCoupon, removeCoupon } from '../../api'
import { CART_MUTATION, useUserId, writeCart } from '../../hooks/useCart'

import type { CouponFormProps } from './types'

/** Cupom com o erro da API no campo (SPEC §5.5: `COUPON_INVALID`/`COUPON_EXPIRED`). */
export function CouponForm({ coupon }: CouponFormProps) {
  const queryClient = useQueryClient()
  const userId = useUserId()
  const id = useId()
  const errorId = `${id}-erro`

  const apply = useMutation({
    mutationKey: CART_MUTATION,
    mutationFn: applyCoupon,
    onSuccess: (cart) => {
      writeCart(queryClient, userId, cart)
      toast(`Cupom ${cart.coupon?.code ?? ''} aplicado`)
    },
  })
  const remove = useMutation({
    mutationKey: CART_MUTATION,
    mutationFn: removeCoupon,
    onSuccess: (cart) => writeCart(queryClient, userId, cart),
    onError: () => toast.error('Não foi possível remover o cupom. Tente novamente.'),
  })

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p>
          Cupom <strong className="text-primary">{coupon.code}</strong> ({coupon.percentOff}% de
          desconto)
        </p>
        <Button
          variant="link"
          className="h-auto p-0 text-xs"
          aria-busy={remove.isPending}
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          Remover
        </Button>
      </div>
    )
  }

  // A UI decide pelo `code`, nunca pelo texto da API (SPEC §5.5).
  const error = !apply.error
    ? undefined
    : isApiError(apply.error, 'COUPON_EXPIRED')
      ? 'Este cupom expirou.'
      : isApiError(apply.error, 'COUPON_INVALID')
        ? 'Cupom inválido.'
        : 'Não foi possível aplicar o cupom. Tente novamente.'

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const code = String(new FormData(event.currentTarget).get('code') ?? '').trim()
        if (code) apply.mutate(code)
      }}
    >
      <Label htmlFor={id} className="text-xs font-bold max-md:sr-only">
        Código promocional
      </Label>
      {/* Mobile: pílula escura com o botão dentro (frame mobile). */}
      <div className="flex max-md:rounded-full max-md:bg-background max-md:p-0.5">
        <Input
          id={id}
          name="code"
          autoComplete="off"
          placeholder="Digite o código promocional..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={() => apply.error && apply.reset()}
          className="h-10 rounded-r-none border-primary bg-transparent text-xs dark:bg-transparent max-md:rounded-l-full max-md:border-0 max-md:pl-4"
        />
        <Button
          type="submit"
          aria-busy={apply.isPending}
          disabled={apply.isPending}
          className="h-10 rounded-l-none px-5 text-sm font-bold max-md:rounded-full"
        >
          Aplicar
        </Button>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
