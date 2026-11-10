import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import ArrowExploreIcon from '@/assets/icons/arrow-explore.svg?react'
import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/shared/ui/carousel'
import { Skeleton } from '@/shared/ui/skeleton'

import { catalogQueries } from '../../queries'

/** Arte do hero: 140 px no card mobile, 450 px no desktop (frame 1160×450). */
const ART = 'size-35 rounded-xl lg:size-[450px] lg:rounded-2xl'

/**
 * Hero da Início (SPEC §13.6): textos fixos e as artes de `highlights.hero` num carrossel
 * sem autoplay. Setas do teclado trocam a arte com o foco em qualquer ponto do hero.
 */
export function HeroCarousel() {
  const highlights = useQuery(catalogQueries.highlights())
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on('select', onSelect).on('reInit', onSelect)
    return () => {
      api.off('select', onSelect).off('reInit', onSelect)
    }
  }, [api])

  const hero = highlights.data?.hero ?? []

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      aria-label="Destaques"
      className="min-h-[190px] rounded-2xl bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklch,var(--primary)_30%,var(--card)),var(--card)_70%)] p-4 lg:rounded-none lg:bg-none lg:p-0 lg:pl-10"
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 lg:gap-10">
        <div className="flex h-full flex-col justify-center gap-1.5 lg:gap-4">
          <p className="text-xs lg:text-sm">Bem-vindo à Kurio</p>
          {/* O frame mobile tem um título mais curto que o do desktop. */}
          <h1 className="text-lg leading-snug font-medium uppercase lg:text-43 lg:leading-[1.5]">
            <span className="lg:hidden">Seja dono da cultura digital</span>
            <span className="hidden lg:inline">
              Seja dono do futuro
              <br />
              da arte digital
            </span>
          </h1>
          <p className="text-xs leading-snug text-option lg:max-w-[33rem] lg:text-sm lg:leading-relaxed">
            <span className="lg:hidden">
              Descubra NFTs selecionados de criadores do mundo todo.
            </span>
            <span className="hidden lg:inline">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </span>
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="flex items-center gap-2 self-start text-xs font-medium text-primary uppercase lg:hidden"
          >
            Explorar <ArrowExploreIcon className="h-2.5 w-3" />
          </Link>
          <Button
            asChild
            size="lg"
            className="mt-4 hidden self-start px-9 text-base uppercase lg:inline-flex"
          >
            <Link to="/" hash="catalogo">
              Explorar
            </Link>
          </Button>
          {hero.length > 1 && (
            <Dots count={hero.length} selected={selected} onSelect={(i) => api?.scrollTo(i)} />
          )}
        </div>

        <HeroArt
          hero={hero}
          selected={selected}
          state={
            highlights.isPending || (highlights.isError && highlights.isFetching)
              ? 'loading'
              : highlights.isError
                ? 'error'
                : 'ready'
          }
          onRetry={() => void highlights.refetch()}
        />
      </div>
    </Carousel>
  )
}

function HeroArt(props: {
  hero: Nft[]
  selected: number
  state: 'loading' | 'error' | 'ready'
  onRetry: () => void
}) {
  if (props.state === 'loading') {
    return (
      <div role="status">
        <span className="sr-only">Carregando destaques…</span>
        <Skeleton className={ART} />
      </div>
    )
  }
  if (props.state === 'error') {
    // Compacto: o card mobile tem 140 px de arte.
    return (
      <div
        role="alert"
        className={cn(
          ART,
          'flex flex-col items-center justify-center gap-2 bg-card p-2 text-center',
        )}
      >
        <p className="text-xs">Não foi possível carregar os destaques</p>
        <Button size="xs" onClick={props.onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }
  if (props.hero.length === 0) return <div className={ART} />

  const next = props.hero[(props.selected + 1) % props.hero.length]
  return (
    <div className="relative">
      <CarouselContent className={cn(ART, 'ml-0')}>
        {props.hero.map((nft, index) => (
          <CarouselItem
            key={nft.id}
            aria-label={`${index + 1} de ${props.hero.length}`}
            // Fora da tela: sem foco nem leitura até virar o atual.
            inert={index !== props.selected}
            className="pl-0"
          >
            <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block">
              <img
                src={nft.images[0]?.src}
                alt={nft.title}
                width={640}
                height={640}
                // A primeira arte é o LCP da página (SPEC §15).
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : undefined}
                className={cn(ART, 'object-cover')}
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Só no card mobile: miniatura da próxima arte sobre o canto (frame mobile). */}
      {next && next !== props.hero[props.selected] && (
        <img
          src={next.images[0]?.src}
          alt=""
          width={640}
          height={640}
          loading="lazy"
          className="absolute bottom-1 left-1 size-14 rounded-lg border-2 border-card object-cover lg:hidden"
        />
      )}
    </div>
  )
}

function Dots(props: { count: number; selected: number; onSelect: (index: number) => void }) {
  return (
    <div className="flex max-lg:absolute max-lg:bottom-1 max-lg:left-1/2 max-lg:-translate-x-1/2 lg:mt-10 lg:mr-[70px] lg:self-end">
      {Array.from({ length: props.count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Mostrar destaque ${index + 1}`}
          aria-current={index === props.selected ? 'true' : undefined}
          onClick={() => props.onSelect(index)}
          className="flex size-6 items-center justify-center rounded-full -mx-1 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            className={cn(
              'size-1.5 rounded-full bg-primary transition-opacity lg:size-2.5',
              index !== props.selected && 'opacity-50',
            )}
          />
        </button>
      ))}
    </div>
  )
}
