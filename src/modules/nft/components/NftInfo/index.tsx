import type { Network, Nft } from '@/shared/contracts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

/** Estrelas só de exibição (SPEC §13.5): o valor vai em texto para leitores de tela. */
export function Rating({ rating }: Pick<Nft, 'rating'>) {
  const rounded = Math.round(rating.average)
  return (
    <p className="flex items-center gap-2 text-sm">
      <span aria-hidden className="tracking-widest text-primary">
        {'★'.repeat(rounded)}
        <span className="text-muted-foreground">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span>
        <span className="sr-only">Nota </span>
        {rating.average.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
        <span className="sr-only"> de 5</span>
        <span className="text-muted-foreground"> ({rating.count} avaliações)</span>
      </span>
    </p>
  )
}

/** Descrição, atributos, Coleção e Rede; a aba "Avaliações" fica visível e desabilitada. */
export function NftInfo({ nft }: { nft: Nft }) {
  return (
    <Tabs defaultValue="details" className="gap-6">
      <TabsList variant="line" className="w-full justify-start gap-6 border-b">
        <TabsTrigger value="details" className="flex-none px-0">
          Detalhes
        </TabsTrigger>
        {/* Fora do Radix: o Trigger desabilitado usa `disabled`, e a SPEC §13.5 pede aria-disabled. Fica fora do foco por não ter conteúdo. */}
        <span
          role="tab"
          aria-disabled="true"
          aria-selected="false"
          className="cursor-not-allowed px-0 text-sm font-medium text-muted-foreground opacity-60"
        >
          Avaliações de colecionadores
        </span>
      </TabsList>
      <TabsContent value="details" className="flex flex-col gap-6">
        <p className="text-sm leading-relaxed text-option">{nft.description}</p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Coleção', value: nft.collection.label },
            { label: 'Rede', value: NETWORK_LABELS[nft.network] },
            ...nft.attributes,
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-card px-4 py-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>
    </Tabs>
  )
}
