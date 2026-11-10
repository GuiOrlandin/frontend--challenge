import { Link } from '@tanstack/react-router'

import LogOutIcon from '@/assets/icons/log-in.svg?react'
import ActivityIcon from '@/assets/icons/nav-activity.svg?react'
import DownloadsIcon from '@/assets/icons/nav-downloads.svg?react'
import OffersIcon from '@/assets/icons/nav-offers.svg?react'
import ProfileIcon from '@/assets/icons/nav-profile.svg?react'
import SupportIcon from '@/assets/icons/nav-support.svg?react'
import WalletIcon from '@/assets/icons/nav-wallet.svg?react'
import WishlistIcon from '@/assets/icons/nav-wishlist.svg?react'
import { useLogout } from '@/modules/auth'

// Inativos em `option` (#CFB28C): o laranja a 75% do Figma não dá 4,5:1 sobre o `card`.
const itemClass =
  'flex shrink-0 items-center gap-3 whitespace-nowrap border-transparent px-4 py-3 text-sm lg:text-15 max-lg:border-b-2 lg:border-l-2'
// O `Link` marca `data-status="active"`; o `activeProps` só concatenaria classes em conflito.
const linkClass = `${itemClass} text-option hover:text-primary data-[status=active]:border-primary data-[status=active]:text-primary`

/** Itens sem tela (SPEC §1): aparecem, sem ação. */
const STATIC_ITEMS = [
  { label: 'Atividade', Icon: ActivityIcon },
  { label: 'Lista de interesse', Icon: WishlistIcon },
  { label: 'Ofertas', Icon: OffersIcon },
  { label: 'Arquivos baixados', Icon: DownloadsIcon },
  { label: 'Suporte', Icon: SupportIcon },
]

/** Menu do perfil (SPEC §4.4): lateral a partir de `lg`, lista horizontal com rolagem abaixo. */
export function ProfileNav() {
  const logout = useLogout()

  return (
    <nav aria-label="Meu perfil" className="bg-card lg:self-start">
      <h2 className="hidden px-4 pt-5 pb-3 text-lg font-bold lg:block">Meu perfil</h2>
      <ul className="flex overflow-x-auto lg:flex-col lg:overflow-visible">
        <li>
          <Link to="/perfil" activeOptions={{ exact: true }} className={linkClass}>
            <ProfileIcon className="size-4" />
            Dados do perfil
          </Link>
        </li>
        <li>
          <Link to="/perfil/carteiras" className={linkClass}>
            <WalletIcon className="size-4" />
            Carteiras
          </Link>
        </li>
        {STATIC_ITEMS.map(({ label, Icon }) => (
          <li key={label}>
            <span className={`${itemClass} text-option`}>
              <Icon className="size-4" />
              {label}
            </span>
          </li>
        ))}
        <li className="lg:border-t lg:border-border">
          <button
            type="button"
            onClick={() => void logout()}
            className={`${itemClass} w-full font-bold text-primary hover:text-primary/80`}
          >
            <LogOutIcon className="size-4" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
