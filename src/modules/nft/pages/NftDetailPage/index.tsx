import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { EthPrice } from '@/shared/components/EthPrice'
import { PageContainer } from '@/shared/components/PageContainer'
import { QuantityStepper } from '@/shared/components/QuantityStepper'
import { clampQuantity } from '@/shared/components/QuantityStepper/clampQuantity'
import type { Edition, Nft } from '@/shared/contracts'
import { compare, formatEth, mulQty } from '@/shared/lib/eth'
import { useRealtimeEvent } from '@/shared/lib/realtime'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'

import { EditionPicker } from '../../components/EditionPicker'
import { FavoriteButton } from '../../components/FavoriteButton'
import { Gallery } from '../../components/Gallery'
import { NftInfo, Rating } from '../../components/NftInfo'
import { ShareLinks } from '../../components/ShareLinks'
import { Showcases } from '../../components/Showcases'
import { nftQueries } from '../../queries'

/** Dado já carregado pelo loader (SPEC §11.4); o tempo real atualiza o mesmo cache. */
export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const { data: nft } = useSuspenseQuery(nftQueries.detail(nftId))

  return (
    <PageContainer className="flex flex-col gap-10 py-6 lg:gap-16 lg:pt-12 lg:pb-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" hash="catalogo">
                Mercado
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{nft.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Outro Nft (vitrine) zera Edição e quantidade escolhidas. */}
      <Purchase key={nft.id} nft={nft} />
      <Showcases nft={nft} />
    </PageContainer>
  )
}

function Purchase({ nft }: { nft: Nft }) {
  const [editionId, setEditionId] = useState(nft.defaultEditionId)
  const [quantity, setQuantity] = useState(1)
  const [announcement, setAnnouncement] = useState('')

  const edition = nft.editions.find((e) => e.id === editionId) ?? nft.editions[0]
  const soldOut = !edition || edition.available === 0
  const max = edition ? Math.min(edition.available, edition.maxPerOrder) : 0
  // Derivado: se a disponibilidade cair (tempo real), a quantidade acompanha o novo teto.
  const qty = clampQuantity(quantity, { min: 1, max })

  // O cache já tem a versão nova; `edition` ainda é a do último render, a de antes do evento.
  useRealtimeEvent('nft.updated', (event) => {
    if (event.resourceId !== nft.id || !edition) return
    const next = event.data.editions.find((e) => e.id === edition.id)
    if (next) setAnnouncement(describeChange(edition, next))
  })

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <Gallery images={nft.images} rare={nft.rare} />

      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-primary uppercase">{nft.collection.label}</p>
            <h1 className="text-2xl font-medium uppercase lg:text-4xl">{nft.title}</h1>
            <p className="text-sm text-muted-foreground">
              Criado por <span className="text-foreground">{nft.creator.name}</span>
            </p>
            <Rating rating={nft.rating} />
          </div>
          <FavoriteButton nftId={nft.id} className="shrink-0 border" />
        </div>

        {edition && (
          <p className="flex flex-wrap items-baseline gap-x-3 text-2xl font-bold">
            <EthPrice value={edition.price} className="text-primary" />
            {edition.compareAtPrice && (
              <s className="text-base font-normal text-muted-foreground">
                <span className="sr-only">Preço anterior: </span>
                <EthPrice value={edition.compareAtPrice} />
              </s>
            )}
          </p>
        )}

        <EditionPicker editions={nft.editions} value={editionId} onChange={setEditionId} />

        <div className="flex flex-wrap items-center gap-4">
          <QuantityStepper value={qty} onChange={setQuantity} max={max} disabled={soldOut} />
          {soldOut ? (
            <p className="text-sm text-destructive">Edição esgotada</p>
          ) : (
            <p className="text-xs text-muted-foreground">Máximo de {max} por pedido</p>
          )}
        </div>
        {edition && !soldOut && (
          <p className="text-sm">
            Total: <EthPrice value={mulQty(edition.price, qty)} className="font-bold" />
          </p>
        )}

        {/* Slot do carrinho (task 33): "Comprar" e o ícone de carrinho entram aqui. */}
        <div className="flex flex-wrap items-center gap-3 empty:hidden" />

        <ShareLinks title={nft.title} />

        <p role="status" aria-live="polite" className="text-sm text-primary empty:hidden">
          {announcement}
        </p>

        <NftInfo nft={nft} />
      </div>
    </div>
  )
}

/** Texto do anúncio de preço e disponibilidade da Edição escolhida (SPEC §10.3). */
function describeChange(before: Edition, after: Edition): string {
  const parts: string[] = []
  if (compare(before.price, after.price) !== 0) {
    parts.push(`Preço atualizado para ${formatEth(after.price)} ETH`)
  }
  if (before.available !== after.available) {
    parts.push(
      after.available === 0
        ? 'Edição esgotada'
        : `Disponibilidade atualizada: ${after.available} disponíveis`,
    )
  }
  return parts.join('. ')
}
