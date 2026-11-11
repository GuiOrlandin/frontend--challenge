import { Link } from '@tanstack/react-router'

import { EthPrice } from '@/shared/components/EthPrice'
import { cn } from '@/shared/lib/utils'

import type { NftCardProps } from './types'

/** Card do catálogo e das vitrines: preço da Edição padrão, link para o detalhe. */
export function NftCard({ nft, actions, priority = false, size = 'md' }: NftCardProps) {
  const edition = nft.editions.find((e) => e.id === nft.defaultEditionId) ?? nft.editions[0]
  const image = nft.images[0]

  return (
    <article className="group relative flex flex-col gap-3 rounded-lg bg-card p-2 lg:bg-transparent lg:p-0">
      <div className="relative overflow-hidden rounded-lg bg-card lg:rounded-sm lg:px-1 lg:py-6">
        {image && (
          <img
            src={image.src}
            alt={image.alt}
            width={640}
            height={640}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            className="aspect-square w-full rounded-lg object-cover"
          />
        )}
        {nft.rare && (
          <span className="absolute top-0 left-0 z-10 bg-primary lg:top-4 px-3 py-1 text-13 font-medium lg:text-base text-primary-foreground">
            RARO
          </span>
        )}
        {/* Com mouse, só aparecem no hover/foco do card; no toque ficam sempre visíveis. Mobile: canto superior direito (frame). */}
        {actions && (
          <div className="absolute top-2 right-2 z-10 flex justify-center gap-2 transition-opacity lg:inset-x-0 lg:top-auto lg:bottom-2.5 pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100">
            {actions}
          </div>
        )}
      </div>
      {/* Grade no desktop (Figma): nome e preço com linha de 16 px e 12 px entre eles. */}
      <div
        className={cn('flex flex-col gap-1 px-1 pb-1 lg:px-0', size === 'lg' && 'lg:gap-3 lg:pb-0')}
      >
        <h3 className={size === 'lg' ? 'text-15 lg:text-base lg:leading-4' : 'text-15'}>
          {/* O link cobre o card inteiro (after:inset-0); as ações ficam acima dele. */}
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring"
          >
            {nft.title}
          </Link>
        </h3>
        {edition && (
          <p
            className={cn(
              'flex flex-wrap items-baseline gap-x-2 font-bold',
              size === 'lg' ? 'text-base lg:text-lg lg:leading-4' : 'text-base',
            )}
          >
            <EthPrice value={edition.price} className="text-primary" />
            {edition.compareAtPrice && (
              <s className="font-normal text-[#B0916A] no-underline">
                <span className="sr-only">Preço anterior: </span>
                <EthPrice value={edition.compareAtPrice} />
              </s>
            )}
          </p>
        )}
      </div>
    </article>
  )
}
