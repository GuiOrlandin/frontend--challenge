import CartIcon from '@/assets/icons/cart-add.svg?react'
import { AccountMenu, AuthDialog, useSessionSync } from '@/modules/auth'
import { CartBadge } from '@/modules/cart'
import { Toaster } from '@/shared/ui/sonner'

import { Footer } from '../Footer'
import { Header } from '../Header'
import { MobileBottomNav } from '../MobileBottomNav'

/**
 * Moldura de todas as rotas (entra como `InnerWrap` do router, então o 404 também tem layout).
 * O Toaster é a região `aria-live` global (SPEC §13.5).
 */
export function RootLayout({ children }: { children: React.ReactNode }) {
  useSessionSync()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only rounded-sm bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Pular para o conteúdo
      </a>
      <Header
        cart={
          <CartBadge className="rounded-sm p-1 hover:text-primary">
            <CartIcon className="size-6" />
          </CartBadge>
        }
        account={<AccountMenu />}
      />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <AuthDialog />
      <Toaster />
    </div>
  )
}
