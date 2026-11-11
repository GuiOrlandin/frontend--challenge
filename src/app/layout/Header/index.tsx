import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import SearchIcon from '@/assets/icons/search.svg?react'
import { PageContainer } from '@/shared/components/PageContainer'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'

import type { HeaderProps } from './types'

/** "Mercado" fica ativo no fluxo de compra (SPEC §4.4). */
const MARKET_PATHS = ['/nft/', '/carrinho', '/pagamento']

const navLinkClass = (active: boolean) =>
  cn(
    'relative py-5 text-base transition-colors hover:text-primary',
    active &&
      'font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary',
  )

/** Header de `md` para cima (abaixo disso, a navegação fica na `MobileBottomNav`). */
export function Header({ cart, account }: HeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [searching, setSearching] = useState(false)
  const isMarket = MARKET_PATHS.some((path) => pathname.startsWith(path))

  return (
    <header className="hidden md:block">
      <PageContainer>
        <div className="flex h-16 items-center justify-between gap-6 border-b border-primary/40">
          <Link to="/" className="text-sm font-bold tracking-widest">
            KURIO
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-8 self-stretch">
            <Link
              to="/"
              className={navLinkClass(pathname === '/')}
              aria-current={pathname === '/' ? 'page' : undefined}
            >
              Início
            </Link>
            <Link
              to="/"
              hash="catalogo"
              // O router ignora navegar para o mesmo hash; já na Início, rola na mão.
              onClick={() => document.getElementById('catalogo')?.scrollIntoView()}
              className={navLinkClass(isMarket)}
              aria-current={isMarket ? 'page' : undefined}
            >
              Mercado
            </Link>
            {/* Estáticos (SPEC §1): só texto. */}
            <span className="py-5 text-base">Criadores</span>
            <span className="py-5 text-base">Aprenda</span>
          </nav>

          <div className="flex items-center gap-4">
            {searching ? (
              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
                  setSearching(false)
                  void navigate({ href: q ? `/?q=${encodeURIComponent(q)}` : '/' })
                }}
              >
                <Input
                  name="q"
                  type="search"
                  autoFocus
                  aria-label="Buscar NFTs"
                  placeholder="Buscar NFTs"
                  className="h-8 w-48"
                  onKeyDown={(event) => event.key === 'Escape' && setSearching(false)}
                  onBlur={(event) => !event.currentTarget.value && setSearching(false)}
                />
              </form>
            ) : (
              <button
                type="button"
                aria-label="Buscar"
                className="rounded-sm p-1 hover:text-primary"
                onClick={() => setSearching(true)}
              >
                <SearchIcon className="size-5" />
              </button>
            )}
            {cart}
            {account}
          </div>
        </div>
      </PageContainer>
    </header>
  )
}
