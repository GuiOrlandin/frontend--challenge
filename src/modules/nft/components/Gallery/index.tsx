import { useState } from 'react'

import SearchIcon from '@/assets/icons/search.svg?react'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'

const THUMBS = 5

/** Arte principal, miniaturas (coluna à esquerda no desktop) e zoom em `Dialog` pela lupa (SPEC §13.6). */
export function Gallery({ images, rare }: Pick<Nft, 'images' | 'rare'>) {
  const [selected, setSelected] = useState(0)
  const image = images[selected] ?? images[0]
  if (!image) return null
  const thumbs = Array.from({ length: THUMBS }, (_, i) => images[i] ?? images[0] ?? image)

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-start lg:gap-5">
      <div className="relative flex-1 overflow-hidden rounded-sm bg-card p-3 lg:p-4">
        <img
          src={image.src}
          alt={image.alt}
          width={640}
          height={640}
          // Arte do detalhe é o LCP da página (SPEC §15).
          fetchPriority="high"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        {rare && (
          <span className="absolute top-0 left-0 rounded-br-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            RARO
          </span>
        )}
        <Dialog>
          <DialogTrigger
            aria-label="Ampliar imagem"
            className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-background text-foreground hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
          >
            <SearchIcon className="size-4" aria-hidden />
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] p-2 sm:max-w-3xl">
            <DialogTitle className="sr-only">{image.alt}</DialogTitle>
            <img
              src={image.src}
              alt={image.alt}
              width={960}
              height={960}
              className="max-h-[85dvh] w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Figma: sempre 5 miniaturas; faltando imagens, repete a principal. */}
      <ul aria-label="Imagens" className="flex gap-3 lg:flex-col">
        {thumbs.map((img, index) => (
          <li key={index} className="min-w-0 flex-1 lg:flex-none">
            <button
              type="button"
              aria-label={`Mostrar imagem ${index + 1}`}
              aria-current={index === selected ? 'true' : undefined}
              onClick={() => setSelected(index)}
              className={cn(
                'aspect-square w-full overflow-hidden rounded-sm border-2 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none lg:size-[74px]',
                index === selected ? 'border-primary' : 'border-transparent',
              )}
            >
              <img
                src={img.src}
                alt=""
                width={160}
                height={160}
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
