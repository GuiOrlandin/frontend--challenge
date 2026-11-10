import { useQuery } from '@tanstack/react-query'
import { Link, type LinkProps } from '@tanstack/react-router'

import ChevronLeftIcon from '@/assets/icons/chevron-left.svg?react'
import ChevronRightIcon from '@/assets/icons/chevron-right.svg?react'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { NftCard } from '@/shared/components/NftCard'
import { CATALOG_DEFAULTS, isApiError } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { catalogQueries } from '../../queries'

import type { CatalogGridProps } from './types'

const GRID =
  'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-10 lg:gap-x-[34px] lg:gap-y-18'

/**
 * Grade do catálogo. Sem `placeholderData`: cada busca nova mostra o skeleton (SPEC §11.5),
 * e a key vem da URL, então uma resposta atrasada nunca cobre a atual (SPEC §11.4).
 */
export function CatalogGrid({ search }: CatalogGridProps) {
  const query = useQuery(catalogQueries.list(search))

  if (query.isPending || (query.isError && query.isFetching)) {
    return (
      <div role="status">
        <span className="sr-only">Carregando NFTs…</span>
        <div className={GRID}>
          {Array.from({ length: CATALOG_DEFAULTS.pageSize }, (_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar os NFTs"
        description={isApiError(query.error) ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const { items, total, page, totalPages } = query.data
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum NFT encontrado"
        description="Tente outra busca ou ajuste os filtros."
        action={
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            Limpar filtros
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-10 lg:gap-22" aria-busy={query.isFetching}>
      <p role="status" className="sr-only">
        {total === 1 ? '1 NFT encontrado' : `${total} NFTs encontrados`}
      </p>
      {/* Refetch com dado em tela (ex.: foco na janela): indicador discreto, não skeleton (SPEC §13.4). */}
      {query.isFetching && (
        <p className="-mt-8 text-right text-xs text-muted-foreground">Atualizando…</p>
      )}
      <ul aria-label="NFTs" className={GRID}>
        {items.map((nft, index) => (
          <li key={nft.id}>
            <NftCard nft={nft} priority={index < 3} />
          </li>
        ))}
      </ul>
      <CatalogPagination page={page} totalPages={totalPages} />
    </div>
  )
}

const pageLinkClass = (active: boolean) =>
  cn(
    'flex size-8 items-center justify-center rounded-sm border text-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none',
    active
      ? 'border-primary bg-primary font-medium text-primary-foreground'
      : 'border-border bg-background hover:bg-accent',
  )

/** Paginação numerada (push no histórico), rolando até o topo do catálogo. */
function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  // shortcut: todas as páginas sem reticências; a seed tem no máximo 5. Com catálogo maior, recortar a janela.
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const linkTo = (target: number) =>
    ({
      to: '/',
      search: (prev) => ({ ...prev, page: target }),
      hash: 'catalogo',
      activeOptions: { exact: true },
      resetScroll: false,
    }) satisfies LinkProps

  return (
    <nav aria-label="Paginação" className="flex justify-end">
      <ul className="flex items-center gap-2.5">
        {page > 1 && (
          <li>
            <Link
              {...linkTo(page - 1)}
              aria-label="Página anterior"
              className={pageLinkClass(false)}
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
          </li>
        )}
        {pages.map((n) => (
          <li key={n}>
            <Link
              {...linkTo(n)}
              aria-label={`Página ${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={pageLinkClass(n === page)}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link
              {...linkTo(page + 1)}
              aria-label="Próxima página"
              className={pageLinkClass(false)}
            >
              <ChevronRightIcon className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
