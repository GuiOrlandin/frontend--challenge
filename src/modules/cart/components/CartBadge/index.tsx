import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { cn } from '@/shared/lib/utils'

import { useUserId } from '../../hooks/useCart'
import { cartQueries } from '../../queries'

import type { CartBadgeProps } from './types'

/** Link do carrinho com a quantidade de itens (header e barra inferior). */
export function CartBadge({ children, className }: CartBadgeProps) {
  const cart = useQuery(cartQueries.current(useUserId()))
  const count = cart.data?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0

  return (
    <Link
      to="/carrinho"
      aria-label={count ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'}
      className={cn('relative', className)}
    >
      {children}
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-10 leading-none font-bold text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
