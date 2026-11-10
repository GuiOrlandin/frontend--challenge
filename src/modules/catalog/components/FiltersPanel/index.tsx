import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ErrorState } from '@/shared/components/ErrorState'
import type { Eth, Facets } from '@/shared/contracts'
import { formatEth, toWei } from '@/shared/lib/eth'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'

import { useCatalogSearch } from '../../hooks/useCatalogSearch'
import { catalogQueries } from '../../queries'

const WEI_PER_CENT = 10n ** 16n
/** O Slider trabalha em centavos de ETH (o passo do Figma); a URL guarda a string decimal. */
const toCents = (value: Eth) => Number(toWei(value) / WEI_PER_CENT)
const fromCents = (cents: number): Eth => (cents / 100).toFixed(2)

/** Coleções (Categorias), faixa de preço e Rede. Mesmo conteúdo na barra lateral e no Sheet. */
export function FiltersPanel() {
  const { search } = useCatalogSearch()
  const facets = useQuery(catalogQueries.facets(search))

  if (facets.isPending || (facets.isError && facets.isFetching)) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">Carregando filtros…</span>
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    )
  }
  if (facets.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar os filtros"
        onRetry={() => void facets.refetch()}
      />
    )
  }
  return <Filters facets={facets.data} />
}

function Filters({ facets }: { facets: Facets }) {
  const { search, update } = useCatalogSearch()

  // Uma opção por grupo: escolher outra troca a atual; clicar na atual desmarca.
  const toggle = <T extends string>(list: T[], id: T): T[] => (list.includes(id) ? [] : [id])

  return (
    <div className="flex flex-col gap-8">
      <FilterGroup title="Coleções">
        {facets.categories.map((category) => (
          <FilterOption
            key={category.id}
            label={category.label}
            count={category.count}
            selected={search.category.includes(category.id)}
            onClick={() => void update({ category: toggle(search.category, category.id) })}
          />
        ))}
      </FilterGroup>

      <PriceRange
        // Remonta quando a URL muda por fora (ex.: "Limpar filtros"), descartando o rascunho.
        key={`${search.priceMin}-${search.priceMax}`}
        range={facets.priceRange}
        priceMin={search.priceMin}
        priceMax={search.priceMax}
        onApply={(priceMin, priceMax) => void update({ priceMin, priceMax })}
      />

      <FilterGroup title="Rede">
        {facets.networks.map((network) => (
          <FilterOption
            key={network.id}
            label={network.label}
            count={network.count}
            selected={search.network.includes(network.id)}
            onClick={() => void update({ network: toggle(search.network, network.id) })}
          />
        ))}
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-bold">{title}</h3>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  )
}

function FilterOption(props: {
  label: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={props.selected}
        onClick={props.onClick}
        className={cn(
          'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none',
          props.selected ? 'font-bold text-option-active' : 'text-option',
        )}
      >
        {/* Além da cor, a selecionada fica em negrito (SPEC §13.5). */}
        {props.label}
        <span>({props.count})</span>
      </button>
    </li>
  )
}

function PriceRange(props: {
  range: Facets['priceRange']
  priceMin?: Eth
  priceMax?: Eth
  onApply: (priceMin: Eth | undefined, priceMax: Eth | undefined) => void
}) {
  const min = toCents(props.range.min)
  const max = toCents(props.range.max)
  const [draft, setDraft] = useState([
    props.priceMin === undefined ? min : toCents(props.priceMin),
    props.priceMax === undefined ? max : toCents(props.priceMax),
  ])
  const [low = min, high = max] = draft

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-bold">Faixa de preço</h3>
      <Slider
        min={min}
        max={max}
        step={1}
        value={draft}
        onValueChange={setDraft}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        className="py-2"
      />
      <p className="text-sm">
        Preço: {formatEth(fromCents(low))} – {formatEth(fromCents(high))} ETH
      </p>
      <Button
        size="sm"
        className="self-start"
        // Os extremos da faixa equivalem a "sem limite": não vão para a URL.
        onClick={() =>
          props.onApply(
            low === min ? undefined : fromCents(low),
            high === max ? undefined : fromCents(high),
          )
        }
      >
        Aplicar
      </Button>
    </section>
  )
}
