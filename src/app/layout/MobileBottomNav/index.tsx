import { Link, useLocation } from '@tanstack/react-router'

import CartIcon from '@/assets/icons/cart-filled.svg?react'
import FiltersIcon from '@/assets/icons/filters.svg?react'
import HeartIcon from '@/assets/icons/heart-filled.svg?react'
import HomeIcon from '@/assets/icons/home-filled.svg?react'
import UserIcon from '@/assets/icons/user-filled.svg?react'
import { cn } from '@/shared/lib/utils'

const navItemClass = (active: boolean) =>
  cn(
    'flex size-11 items-center justify-center rounded-full transition-colors',
    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  )

/** Navegação abaixo de `md` (SPEC §4.4). Perfil sem sessão cai no login pelo guard. */
export function MobileBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-card px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
    >
      <ul className="flex items-center justify-between">
        <li>
          <Link to="/" aria-label="Início" className={navItemClass(pathname === '/')}>
            <HomeIcon className="size-5" />
          </Link>
        </li>
        <li>
          {/* Estático (SPEC §1): sem tela de favoritos. */}
          <button
            type="button"
            aria-label="Favoritos"
            aria-disabled="true"
            className={navItemClass(false)}
          >
            <HeartIcon className="size-5" />
          </button>
        </li>
        <li>
          {/* shortcut: leva ao catálogo; abrir o Sheet de filtros entra na task do catálogo (30). */}
          <Link
            to="/"
            hash="catalogo"
            aria-label="Filtros"
            className="-mt-10 flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground"
          >
            <FiltersIcon className="size-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className={navItemClass(pathname.startsWith('/carrinho'))}
          >
            <CartIcon className="size-5" />
          </Link>
        </li>
        <li>
          <Link
            to="/perfil"
            aria-label="Perfil"
            className={navItemClass(pathname.startsWith('/perfil'))}
          >
            <UserIcon className="size-5" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
