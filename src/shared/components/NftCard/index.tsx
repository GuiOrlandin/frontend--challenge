import { Link } from '@tanstack/react-router'

import { EthPrice } from '@/shared/components/EthPrice'

import type { NftCardProps } from './types'

/** Card do catálogo e das vitrines: preço da Edição padrão, link para o detalhe. */
export function NftCard({ nft, actions, priority = false }: NftCardProps) {
  const edition = nft.editions.find((e) => e.id === nft.defaultEditionId) ?? nft.editions[0]
  const image = nft.images[0]

  return (
    <article className="relative flex flex-col gap-3 rounded-lg bg-card p-2 lg:bg-transparent lg:p-0">
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
          <span className="absolute top-0 left-0 rounded-br-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            RARO
          </span>
        )}
        {actions && <div className="absolute top-3 right-3 z-10 flex gap-2">{actions}</div>}
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1 lg:px-0">
        <h3 className="text-sm">
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
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold">
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
