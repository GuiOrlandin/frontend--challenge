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
    <p className="flex items-center gap-1.5 text-sm">
      <span aria-hidden className="text-base tracking-[0.15em] text-primary">
        {'★'.repeat(rounded)}
        <span className="text-muted-foreground">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span>
        <span className="sr-only">
          Nota {rating.average.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} de 5,{' '}
        </span>
        {rating.count} avaliações de colecionadores
      </span>
    </p>
  )
}

/** Abas abaixo da compra: descrição e ficha; "Avaliações" fica visível e desabilitada. */
export function NftInfo({ nft }: { nft: Nft }) {
  const network = NETWORK_LABELS[nft.network]
  return (
    <Tabs defaultValue="details" className="gap-4">
      <TabsList variant="line" className="w-full justify-start gap-8 border-b">
        <TabsTrigger value="details" className="flex-none px-0 text-base">
          Detalhes do NFT
        </TabsTrigger>
        {/* Fora do Radix: o Trigger desabilitado usa `disabled`, e a SPEC §13.5 pede aria-disabled. Fica fora do foco por não ter conteúdo. */}
        <span
          role="tab"
          aria-disabled="true"
          aria-selected="false"
          className="cursor-not-allowed px-0 text-base text-foreground"
        >
          Avaliações de colecionadores ({nft.rating.count})
        </span>
      </TabsList>
      <TabsContent value="details" className="flex flex-col gap-4 text-sm leading-relaxed">
        {/* shortcut: textos fixos do Figma com os dados do Nft; contrato e royalties não existem na API. */}
        <div className="flex flex-col gap-6 text-option">
          <p>
            {nft.description} Cada atributo fica armazenado nos metadados do token e verificado na{' '}
            {network}. A obra explora identidade, movimento e luz em um mundo digital sem
            fronteiras.
          </p>
          <p>
            A propriedade inclui a arte em alta resolução, lançamentos exclusivos para
            colecionadores e um registro permanente de procedência registrada na rede.{' '}
            {nft.creator.name} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos
            trabalhos e lançamentos da comunidade.
          </p>
        </div>
        <dl className="flex flex-col gap-3">
          {[
            {
              label: 'Rede',
              value: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
            },
            {
              label: 'Contrato',
              value:
                'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
            },
            {
              label: 'Direitos autorais',
              value: '0x7A42...19E8 • Contrato inteligente ERC-721 verificado.',
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="font-bold">{label}:</dt>
              <dd className="text-option">{value}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>
    </Tabs>
  )
}
