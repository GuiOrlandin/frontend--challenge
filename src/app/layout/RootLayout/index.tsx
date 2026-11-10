import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import CartIcon from '@/assets/icons/cart.svg?react'
import LogInIcon from '@/assets/icons/log-in.svg?react'
import { sessionQueries } from '@/modules/auth'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Toaster } from '@/shared/ui/sonner'

import { Footer } from '../Footer'
import { Header } from '../Header'
import { MobileBottomNav } from '../MobileBottomNav'

/** Provisório até o `CartBadge` (task do carrinho): só o link, sem contador. */
function CartSlot() {
  return (
    <Link to="/carrinho" aria-label="Carrinho" className="rounded-sm p-1 hover:text-primary">
      <CartIcon className="size-5" />
    </Link>
  )
}

/** "Entrar" para Visitante; menu do Colecionador provisório até a task de auth (29). */
function AccountSlot() {
  const session = useQuery(sessionQueries.current())

  // Skeleton no boot, sem flash de "Entrar" (SPEC §6).
  if (session.isPending) return <Skeleton className="h-8 w-20" />
  if (session.data) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/perfil">{session.data.user.displayName}</Link>
      </Button>
    )
  }
  return (
    <Button asChild size="sm">
      <Link to="." search={(prev) => ({ ...prev, auth: 'entrar' as const })}>
        <LogInIcon className="size-4" />
        Entrar
      </Link>
    </Button>
  )
}

/**
 * Moldura de todas as rotas (entra como `InnerWrap` do router, então o 404 também tem layout).
 * O Toaster é a região `aria-live` global (SPEC §13.5).
 */
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only rounded-sm bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Pular para o conteúdo
      </a>
      <Header cart={<CartSlot />} account={<AccountSlot />} />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <Toaster />
    </div>
  )
}
