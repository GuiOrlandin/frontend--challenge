import { Link, useLocation } from '@tanstack/react-router'

import CartIcon from '@/assets/icons/cart-filled.svg?react'
import FiltersIcon from '@/assets/icons/filters.svg?react'
import HeartIcon from '@/assets/icons/heart-bold.svg?react'
import HomeIcon from '@/assets/icons/home-filled.svg?react'
import NotchShape from '@/assets/icons/tab-bar-notch.svg?react'
import ButtonShape from '@/assets/icons/tab-button.svg?react'
import UserIcon from '@/assets/icons/user-filled.svg?react'
import { CartBadge } from '@/modules/cart'
import { cn } from '@/shared/lib/utils'

const navItemClass = (active: boolean) =>
  cn(
    'flex size-11 items-center justify-center rounded-full transition-colors',
    active ? 'text-option-active' : 'text-option hover:text-foreground',
  )

/** Navegação abaixo de `md` (SPEC §4.4), frame "Tab Bar" do Mobile / Início. Perfil sem sessão cai no login pelo guard. */
export function MobileBottomNav() {
  const { pathname } = useLocation()
  // Detalhe, carrinho e pagamento têm a própria barra de ação no pé da tela (frames mobile).
  if (/^\/(nft\/|carrinho|pagamento)/.test(pathname)) return null

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 pt-[25px] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {/* Barra do Figma partida em três para esticar sem deformar o recorte central. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[25px] bottom-0 flex text-card drop-shadow-[0_-10px_15px_rgb(10_6_4/0.45)]"
      >
        <div className="flex-1 rounded-tl-[29px] bg-card" />
        {/* -mx-px: o recorte tem 151,7 px e deixaria uma emenda de subpixel nas junções. */}
        <div className="-mx-px flex flex-col">
          <NotchShape className="block shrink-0" />
          <div className="flex-1 bg-card" />
        </div>
        <div className="flex-1 rounded-tr-[29px] bg-card" />
      </div>

      <ul className="relative flex h-[104px] items-start pt-[38px] pr-[30px] pl-[25px]">
        <li>
          <Link to="/" aria-label="Início" className={navItemClass(pathname === '/')}>
            <HomeIcon className="size-5" />
          </Link>
        </li>
        <li className="ml-8">
          {/* Estático (SPEC §1): sem tela de favoritos. */}
          <button
            type="button"
            aria-label="Favoritos"
            aria-disabled="true"
            className={navItemClass(false)}
          >
            <HeartIcon className="w-5" />
          </button>
        </li>
        <li className="absolute -top-[25px] left-1/2 -translate-x-1/2">
          {/* A Início abre o Sheet de filtros pelo hash; na própria Início, mantém a busca atual. */}
          <Link
            to="/"
            search={pathname === '/' ? true : {}}
            hash="filtros"
            aria-label="Filtros"
            className="relative flex size-[65px] items-center justify-center rounded-full text-foreground"
          >
            <ButtonShape className="absolute inset-0" />
            <FiltersIcon className="relative" />
          </Link>
        </li>
        <li className="ml-auto">
          <CartBadge className={navItemClass(pathname.startsWith('/carrinho'))}>
            <CartIcon className="size-5" />
          </CartBadge>
        </li>
        <li className="ml-4.5">
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
