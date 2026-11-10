import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { AddToCartButton, useAddToCart } from '@/modules/cart'
import { EthPrice } from '@/shared/components/EthPrice'
import { PageContainer } from '@/shared/components/PageContainer'
import { QuantityStepper } from '@/shared/components/QuantityStepper'
import { clampQuantity } from '@/shared/components/QuantityStepper/clampQuantity'
import type { Edition, Nft } from '@/shared/contracts'
import { compare, formatEth, mulQty } from '@/shared/lib/eth'
import { useRealtimeEvent } from '@/shared/lib/realtime'
import { Button } from '@/shared/ui/button'
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
    <PageContainer className="flex flex-col gap-6 py-6 lg:pt-10 lg:pb-8">
      <Breadcrumb>
        <BreadcrumbList className="text-sm font-bold text-foreground">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" hash="catalogo">
                Mercado
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-bold">{nft.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Outro Nft (vitrine) zera Edição e quantidade escolhidas. */}
      <Purchase key={nft.id} nft={nft} />
      <div className="mt-10 flex flex-col gap-16 lg:mt-14 lg:gap-20">
        <NftInfo nft={nft} />
        <Showcases nft={nft} />
      </div>
    </PageContainer>
  )
}

function Purchase({ nft }: { nft: Nft }) {
  const [editionId, setEditionId] = useState(nft.defaultEditionId)
  const [quantity, setQuantity] = useState(1)
  const [announcement, setAnnouncement] = useState('')
  const addToCart = useAddToCart()
  const navigate = useNavigate()

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
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-8">
      <Gallery images={nft.images} rare={nft.rare} />

      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="text-2xl font-bold lg:text-[28px] lg:leading-tight">{nft.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-2">
          {edition && (
            <p className="flex flex-wrap items-baseline gap-x-2 text-xl font-bold">
              <EthPrice value={edition.price} className="text-primary" />
              {edition.compareAtPrice && (
                <s className="text-sm font-normal text-[#B0916A] no-underline">
                  <span className="sr-only">Preço anterior: </span>
                  <EthPrice value={edition.compareAtPrice} />
                </s>
              )}
            </p>
          )}
          <Rating rating={nft.rating} />
        </div>

        <section className="mt-1 flex flex-col gap-2">
          <h2 className="text-sm font-bold">Sobre este NFT:</h2>
          <p className="text-sm leading-[22px] text-option">{nft.description}</p>
        </section>

        <EditionPicker editions={nft.editions} value={editionId} onChange={setEditionId} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <QuantityStepper value={qty} onChange={setQuantity} max={max} disabled={soldOut} />
          <div className="flex flex-wrap items-center gap-2">
            {/* "Comprar" adiciona e vai ao carrinho; o ícone só adiciona (SPEC §13.6). */}
            <Button
              disabled={soldOut || addToCart.isPending}
              aria-busy={addToCart.isPending}
              onClick={() =>
                edition &&
                addToCart.mutate(
                  { nftId: nft.id, editionId: edition.id, quantity: qty },
                  { onSuccess: () => void navigate({ to: '/carrinho' }) },
                )
              }
              className="h-9 rounded-sm px-8 text-xs font-bold uppercase"
            >
              Comprar
            </Button>
            {edition && !soldOut && (
              <AddToCartButton
                nftId={nft.id}
                editionId={edition.id}
                quantity={qty}
                className="rounded-sm border border-primary bg-transparent hover:bg-accent"
              />
            )}
            <FavoriteButton
              nftId={nft.id}
              showLabel
              className="h-9 w-auto gap-2 rounded-sm border border-primary bg-transparent px-3 text-[13px] text-option hover:bg-accent"
            />
          </div>
        </div>
        {soldOut ? (
          <p className="text-sm text-destructive">Edição esgotada</p>
        ) : (
          edition && (
            <p className="text-xs text-option">
              Total: <EthPrice value={mulQty(edition.price, qty)} className="font-bold" /> · máximo
              de {max} por pedido
            </p>
          )
        )}

        <dl className="flex flex-col gap-2.5 text-sm text-option">
          {[
            { label: 'ID do token', value: `#${nft.tokenId.padStart(4, '0')}` },
            { label: 'Coleção', value: nft.collection.label },
            { label: 'Atributos', value: nft.attributes.map((a) => a.value).join(', ') },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-1">
              <dt>{label}:</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <ShareLinks title={nft.title} />

        <p role="status" aria-live="polite" className="text-sm text-primary empty:hidden">
          {announcement}
        </p>
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
