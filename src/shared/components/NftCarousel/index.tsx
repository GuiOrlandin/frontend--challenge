import { useId } from 'react'

import { NftCard } from '@/shared/components/NftCard'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel'

import type { NftCarouselProps } from './types'

/** Vitrine horizontal de cards (Detalhe): 2 por vez no mobile, 4 no desktop. */
export function NftCarousel({ title, nfts, actions }: NftCarouselProps) {
  const titleId = useId()

  return (
    <Carousel opts={{ align: 'start' }} aria-labelledby={titleId}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-xl font-medium uppercase lg:text-2xl">
          {title}
        </h2>
        <div className="flex gap-2">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </div>
      <CarouselContent>
        {nfts.map((nft, index) => (
          <CarouselItem
            key={nft.id}
            aria-label={`${index + 1} de ${nfts.length}`}
            className="basis-1/2 md:basis-1/3 lg:basis-1/4"
          >
            <NftCard nft={nft} actions={actions?.(nft)} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
