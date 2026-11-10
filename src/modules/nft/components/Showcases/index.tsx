import { type UseQueryResult, useQuery } from '@tanstack/react-query'

import { catalogQueries } from '@/modules/catalog'
import { NftCarousel } from '@/shared/components/NftCarousel'
import type { Nft, Page } from '@/shared/contracts'
import { Skeleton } from '@/shared/ui/skeleton'

const SHOWCASE_SIZE = 8

/** "Mais desta coleção" (sem o atual). O Figma do detalhe não tem "Colecionadores também viram". */
export function Showcases({ nft }: { nft: Nft }) {
  const sameCollection = useQuery(
    catalogQueries.list({ collection: nft.collection.id, pageSize: SHOWCASE_SIZE }),
  )

  return <Showcase title="Mais desta coleção" query={sameCollection} exclude={nft.id} />
}

/** Complementar: com erro ou vazia, a vitrine some (o conteúdo principal já está na tela). */
function Showcase(props: { title: string; query: UseQueryResult<Page<Nft>>; exclude: string }) {
  if (props.query.isPending) {
    return (
      <div role="status" className="flex flex-col gap-6">
        <span className="sr-only">Carregando {props.title}…</span>
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }
  const items = props.query.data?.items.filter((n) => n.id !== props.exclude) ?? []
  if (items.length === 0) return null

  return <NftCarousel title={props.title} nfts={items} />
}
