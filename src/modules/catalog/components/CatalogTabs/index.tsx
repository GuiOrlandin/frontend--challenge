import { Link } from '@tanstack/react-router'

import type { CatalogTab } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'

import type { CatalogTabsProps } from './types'

const TABS: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

/** Abas como links: cada uma é uma URL (push no histórico) e zera a página. */
export function CatalogTabs({ active }: CatalogTabsProps) {
  return (
    <nav aria-label="Abas do catálogo" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-4 whitespace-nowrap">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <Link
              to="/"
              search={(prev) => ({ ...prev, tab: tab.id, page: 1 })}
              resetScroll={false}
              activeOptions={{ exact: true }}
              aria-current={tab.id === active ? 'page' : undefined}
              className={cn(
                'relative block py-1 text-sm transition lg:text-15-colors hover:text-primary',
                tab.id === active &&
                  'font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary',
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
