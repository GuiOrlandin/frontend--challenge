import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useCanGoBack, useNavigate, useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import BackIcon from '@/assets/icons/chevron-back.svg?react'
import CartSolidIcon from '@/assets/icons/cart-solid.svg?react'
import { AddToCartButton, useAddToCart } from '@/modules/cart'
import { EthPrice } from '@/shared/components/EthPrice'
import { PageContainer } from '@/shared/components/PageContainer'
import { QuantityStepper } from '@/shared/components/QuantityStepper'
import { clampQuantity } from '@/shared/components/QuantityStepper/clampQuantity'
import type { Edition, Nft } from '@/shared/contracts'
import { compare, formatEth } from '@/shared/lib/eth'
import { useRealtimeEvent } from '@/shared/lib/realtime'
import { Button } from '@/shared/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
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
    // Mobile: fundo marrom na tela toda (frame) e espaço no fim para a barra de compra fixa.
    <PageContainer className="flex flex-col gap-6 pt-4 pb-40 max-md:min-h-dvh max-md:bg-[#2F1D15] md:py-6 lg:pt-10 lg:pb-8">
      {/* Mobile (frame do Figma) não mostra a trilha; ela fica para leitores de tela. */}
      <Breadcrumb className="max-md:sr-only">
        <BreadcrumbList className="text-15 font-bold text-foreground">
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
        </BreadcrumbList>
      </Breadcrumb>
      {/* Outro Nft (vitrine) zera Edição e quantidade escolhidas. */}
      <Purchase key={nft.id} nft={nft} />
      {/* Mobile fica focado na compra: sem abas nem vitrines (frame mobile). */}
      <div className="mt-10 flex flex-col gap-16 max-md:hidden lg:mt-14 lg:gap-20">
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

  // "Comprar" adiciona e vai ao carrinho.
  const buy = () =>
    edition &&
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: qty },
      { onSuccess: () => void navigate({ to: '/carrinho' }) },
    )

  return (
    <div className="grid md:gap-8 lg:grid-cols-2">
      {/* Mobile: voltar e favoritar sobre a arte; no desktop o wrapper some (contents). */}
      <div className="flex flex-col gap-4 rounded-t-3xl bg-[#2F1D15] p-4 pb-0 md:contents">
        <div className="flex items-center justify-between md:hidden">
          <BackButton />
          <FavoriteButton
            nftId={nft.id}
            className="size-9 border border-primary/40 bg-transparent text-primary"
          />
        </div>
        <Gallery images={nft.images} rare={nft.rare} />
      </div>

      <div className="relative z-10 -mt-10 flex min-w-0 flex-col gap-3 rounded-3xl bg-[#2F1D15] p-5 md:mt-0 md:rounded-none md:bg-transparent md:p-0">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold md:text-2xl lg:text-28 lg:leading-tight">{nft.title}</h1>
          <RatingPill rating={nft.rating} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-2 max-md:hidden">
          {edition && (
            <p className="flex flex-wrap items-baseline gap-x-2 text-22 font-bold">
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
          <h2 className="text-15 font-bold max-md:sr-only">Sobre este NFT:</h2>
          <p className="text-sm leading-[22px] text-option">{nft.description}</p>
        </section>

        <EditionPicker editions={nft.editions} value={editionId} onChange={setEditionId} />

        <div className="flex flex-wrap items-center justify-between gap-4 max-md:hidden">
          <QuantityStepper
            value={qty}
            onChange={setQuantity}
            max={max}
            disabled={soldOut}
            className="[&_input]:text-xl"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={soldOut || addToCart.isPending}
              aria-busy={addToCart.isPending}
              onClick={buy}
              className="h-9 rounded-sm px-8 text-sm font-bold uppercase"
            >
              Comprar
            </Button>
            <FavoriteButton
              nftId={nft.id}
              showLabel
              className="h-9 w-auto gap-2 rounded-sm border border-primary bg-transparent px-3 text-sm text-option hover:bg-accent"
            />
          </div>
        </div>
        {soldOut && <p className="text-sm text-destructive">Edição esgotada</p>}

        <dl className="flex flex-col gap-2.5 text-15 text-option">
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

        <div className="max-md:hidden">
          <ShareLinks title={nft.title} />
        </div>

        <p role="status" aria-live="polite" className="text-sm text-primary empty:hidden">
          {announcement}
        </p>
      </div>

      {/* Mobile: quantidade, preço e compra numa barra fixa (no lugar da navegação inferior). */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-3xl bg-[#2F1D15] px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_24px_rgb(0_0_0/0.35)] md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="text-15 text-option">
              Qtd.
            </span>
            <QuantityStepper
              value={qty}
              onChange={setQuantity}
              max={max}
              disabled={soldOut}
              className="gap-2.5 [&_button]:h-[30px] [&_button]:w-5 [&_button]:bg-[#D28A4C] [&_button:disabled]:opacity-100 [&_input]:h-6 [&_input]:w-4 [&_input]:text-lg [&_svg]:size-3"
            />
          </div>
          {edition && <EthPrice value={edition.price} className="text-xl font-bold text-primary" />}
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            disabled={soldOut || addToCart.isPending}
            aria-busy={addToCart.isPending}
            onClick={buy}
            className="h-12 rounded-full bg-linear-to-r from-primary to-[#A86D3D] px-10 text-base font-bold"
          >
            Comprar NFT
          </Button>
          {edition && !soldOut && (
            <AddToCartButton
              nftId={nft.id}
              editionId={edition.id}
              quantity={qty}
              icon={<CartSolidIcon className="size-5" aria-hidden />}
              className="size-15 rounded-full bg-[#3F2319] text-[#B39463] hover:bg-accent"
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Volta para a tela anterior; aberto por link direto, vai à Início. */
function BackButton() {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/' }))}
      className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-[#2F1D15] text-[#CFB28C] focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    >
      <BackIcon className="h-3.5 w-2" aria-hidden />
    </button>
  )
}

/** Nota compacta do frame mobile: ★ 4,8 (19). */
function RatingPill({ rating }: Pick<Nft, 'rating'>) {
  const average = rating.average.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return (
    <p className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-sm md:hidden">
      <span aria-hidden className="text-primary">
        ★
      </span>
      <span className="sr-only">Nota </span>
      {average}
      <span aria-hidden>({rating.count})</span>
      <span className="sr-only">, {rating.count} avaliações</span>
    </p>
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
