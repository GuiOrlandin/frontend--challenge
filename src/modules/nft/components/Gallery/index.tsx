import { useState } from 'react'

import SearchIcon from '@/assets/icons/search.svg?react'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'

/** Arte principal, miniaturas e zoom em `Dialog` pela lupa (SPEC §13.6). */
export function Gallery({ images, rare }: Pick<Nft, 'images' | 'rare'>) {
  const [selected, setSelected] = useState(0)
  const image = images[selected] ?? images[0]
  if (!image) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-card">
        <img
          src={image.src}
          alt={image.alt}
          width={640}
          height={640}
          // Arte do detalhe é o LCP da página (SPEC §15).
          fetchPriority="high"
          className="aspect-square w-full object-cover"
        />
        {rare && (
          <span className="absolute top-0 left-0 rounded-br-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            RARO
          </span>
        )}
        <Dialog>
          <DialogTrigger
            aria-label="Ampliar imagem"
            className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-background/80 text-primary hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
          >
            <SearchIcon className="size-5" aria-hidden />
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

      {images.length > 1 && (
        <ul aria-label="Imagens" className="flex gap-3">
          {images.map((img, index) => (
            <li key={img.src + index}>
              <button
                type="button"
                aria-label={`Mostrar imagem ${index + 1}`}
                aria-current={index === selected ? 'true' : undefined}
                onClick={() => setSelected(index)}
                className={cn(
                  'size-16 overflow-hidden rounded-lg border-2 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none lg:size-20',
                  index === selected ? 'border-primary' : 'border-transparent opacity-70',
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
      )}
    </div>
  )
}
