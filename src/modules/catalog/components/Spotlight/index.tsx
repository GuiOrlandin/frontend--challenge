import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/shared/ui/skeleton'

import { catalogQueries } from '../../queries'

/**
 * "NFT em destaque" abaixo dos filtros (frame 310×470). Sem destaque (catálogo vazio) ou com
 * erro, o bloco some: é complementar, e o erro do catálogo já aparece na grade.
 */
export function Spotlight() {
  const highlights = useQuery(catalogQueries.highlights())

  if (highlights.isPending) {
    return (
      <div role="status">
        <span className="sr-only">Carregando destaque…</span>
        <Skeleton className="h-[470px] w-full rounded-2xl" />
      </div>
    )
  }
  const nft = highlights.data?.spotlight
  if (!nft) return null

  return (
    <section
      aria-labelledby="destaque-titulo"
      className="flex flex-col gap-3 rounded-2xl bg-card pt-4"
    >
      <h2 id="destaque-titulo" className="px-4 text-2xl font-medium text-primary uppercase">
        NFT em destaque
      </h2>
      <p className="text-center text-[22px] font-bold uppercase">Oferta limitada</p>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="h-[368px] rounded-2xl focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
      >
        <img
          src={nft.images[0]?.src}
          alt={nft.title}
          width={640}
          height={640}
          loading="lazy"
          className="size-full rounded-2xl object-cover"
        />
      </Link>
    </section>
  )
}
