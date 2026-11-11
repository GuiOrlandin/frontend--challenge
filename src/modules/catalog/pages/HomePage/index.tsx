import { useLocation, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import SlidersIcon from '@/assets/icons/sliders.svg?react'
import { PageContainer } from '@/shared/components/PageContainer'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

import { CatalogGrid } from '../../components/CatalogGrid'
import { CatalogSearch } from '../../components/CatalogSearch'
import { CatalogTabs } from '../../components/CatalogTabs'
import { FiltersPanel } from '../../components/FiltersPanel'
import { HeroCarousel } from '../../components/HeroCarousel'
import { MintJournal, PromoBanners } from '../../components/HomeMarketing'
import { SortSelect } from '../../components/SortSelect'
import { Spotlight } from '../../components/Spotlight'
import { useCatalogSearch } from '../../hooks/useCatalogSearch'

/** Hash usado pela barra inferior para abrir o Sheet de filtros (SPEC §4.4). */
const FILTERS_HASH = 'filtros'

export function HomePage() {
  const { search, update } = useCatalogSearch()
  const { hash } = useLocation()
  const navigate = useNavigate({ from: '/' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Abre só quando o hash *chega* (as navegações dos filtros o derrubam, então o estado fica
  // local). No desktop os filtros já estão na barra lateral: o hash não abre o Sheet.
  const [lastHash, setLastHash] = useState(hash)
  if (hash !== lastHash) {
    setLastHash(hash)
    if (hash === FILTERS_HASH && !window.matchMedia('(min-width: 1024px)').matches) {
      setFiltersOpen(true)
    }
  }

  // Estável: o debounce da busca não recomeça a cada render da página.
  const onSearch = useCallback((q: string) => void update({ q }, { replace: true }), [update])

  function onFiltersOpenChange(open: boolean) {
    setFiltersOpen(open)
    if (!open && hash === FILTERS_HASH) {
      void navigate({ search: (prev) => prev, hash: '', replace: true, resetScroll: false })
    }
  }

  return (
    // pb-8 + mt-16 do footer = 96 px até o rodapé (Figma).
    // Mobile (Figma): busca a 40 px do topo e 16 px entre busca, hero e abas.
    <PageContainer className="flex flex-col gap-4 pt-10 pb-4 lg:gap-6 lg:pt-8 lg:pb-8">
      {/* Abaixo de `lg`: busca e filtros no topo (frame mobile). No desktop, a busca é a do header. */}
      <div className="flex items-center gap-2 lg:hidden">
        <CatalogSearch q={search.q} onSearch={onSearch} />
        <Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange}>
          <button
            type="button"
            aria-label="Abrir filtros"
            onClick={() => onFiltersOpenChange(true)}
            className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(137deg,rgb(210_138_76/0.45)_24.6%,#D28A4C_100%)] text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
          >
            <SlidersIcon />
          </button>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription className="sr-only">
                Os filtros se aplicam ao catálogo assim que são escolhidos.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-8">
              {/* Abaixo de `lg` a ordenação fica aqui: o frame mobile não tem a linha "Ordenar por". */}
              <SortSelect value={search.sort} onChange={(sort) => void update({ sort })} />
              <FiltersPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <HeroCarousel />

      <section
        id="catalogo"
        aria-labelledby="catalogo-titulo"
        className="grid scroll-mt-4 gap-10 lg:mt-6 lg:grid-cols-[19.375rem_1fr] lg:gap-x-12"
      >
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo
        </h2>
        {/* Coluna de 310 px (frame do destaque): filtros e destaque, só em lg+. */}
        <div className="hidden flex-col gap-6 self-start lg:flex">
          <aside aria-label="Filtros" className="rounded-lg bg-card p-6">
            <FiltersPanel />
          </aside>
          <Spotlight />
        </div>

        {/* lg: o select de ordenação tem 36 px; com 14 px a grade começa 50 px abaixo do topo (Figma). */}
        <div className="flex min-w-0 flex-col gap-6 lg:gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CatalogTabs active={search.tab} />
            <div className="hidden lg:block">
              <SortSelect value={search.sort} onChange={(sort) => void update({ sort })} />
            </div>
          </div>
          <CatalogGrid search={search} />
        </div>
      </section>

      <div className="mt-12 flex flex-col gap-16 lg:mt-18 lg:gap-24">
        <PromoBanners />
        <MintJournal />
      </div>
    </PageContainer>
  )
}
