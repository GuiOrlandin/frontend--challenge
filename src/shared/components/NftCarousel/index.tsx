import { useEffect, useId, useState } from 'react'

import { NftCard } from '@/shared/components/NftCard'
import { cn } from '@/shared/lib/utils'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/shared/ui/carousel'

import type { NftCarouselProps } from './types'

/** Vitrine horizontal de cards (Detalhe): 2 por vez no mobile, 5 no desktop, bolinhas embaixo. */
export function NftCarousel({ title, nfts, actions }: NftCarouselProps) {
  const titleId = useId()
  const [api, setApi] = useState<CarouselApi>()
  const [snaps, setSnaps] = useState(0)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const sync = () => {
      setSnaps(api.scrollSnapList().length)
      setSelected(api.selectedScrollSnap())
    }
    sync()
    api.on('select', sync).on('reInit', sync)
    return () => {
      api.off('select', sync).off('reInit', sync)
    }
  }, [api])

  return (
    <Carousel setApi={setApi} opts={{ align: 'start' }} aria-labelledby={titleId}>
      <h2 id={titleId} className="mb-6 border-b pb-2 text-sm font-bold text-primary">
        {title}
      </h2>
      <CarouselContent>
        {nfts.map((nft, index) => (
          <CarouselItem
            key={nft.id}
            aria-label={`${index + 1} de ${nfts.length}`}
            className="basis-1/2 md:basis-1/3 lg:basis-1/5"
          >
            <NftCard nft={nft} actions={actions?.(nft)} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {snaps > 1 && (
        <div className="mt-4 flex justify-center">
          {Array.from({ length: snaps }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Mostrar grupo ${index + 1} de ${snaps}`}
              aria-current={index === selected ? 'true' : undefined}
              onClick={() => api?.scrollTo(index)}
              className="flex size-6 items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
            >
              <span
                className={cn(
                  'size-2.5 rounded-full border border-primary',
                  index === selected && 'bg-primary',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </Carousel>
  )
}
