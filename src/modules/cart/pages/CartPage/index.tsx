import { useIsMutating, useQuery } from '@tanstack/react-query'
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import BackIcon from '@/assets/icons/arrow-circle-left.svg?react'
import { catalogQueries } from '@/modules/catalog'
import { EmptyState } from '@/shared/components/EmptyState'
import { NftCarousel } from '@/shared/components/NftCarousel'
import { PageContainer } from '@/shared/components/PageContainer'
import { Button } from '@/shared/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'

import { CartChangesAnnouncer } from '../../components/CartChangesAnnouncer'
import { CartLine } from '../../components/CartLine'
import { CartSummary } from '../../components/CartSummary'
import { CART_MUTATION, useCart } from '../../hooks/useCart'

/** Carrinho já carregado pelo loader (SPEC §11.4); quantidade, cupom e tempo real no mesmo cache. */
export function CartPage() {
  const { data: cart } = useCart()
  const updating = useIsMutating({ mutationKey: CART_MUTATION }) > 0
  const [highlighted, setHighlighted] = useState<string[]>([])
  const trending = useQuery(catalogQueries.list({ tab: 'trending', pageSize: 8 }))
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  return (
    <PageContainer className="flex flex-col gap-5 pt-4 pb-0 max-md:min-h-dvh md:gap-6 md:py-6 lg:pt-10 lg:pb-8">
      {/* Mobile: voltar e título no topo, sem trilha (frame mobile). */}
      <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center md:hidden">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/' }))}
          className="rounded-full focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
        >
          <BackIcon className="size-9" aria-hidden />
        </button>
        <p aria-hidden className="text-center text-xl font-bold">
          Carrinho de NFTs
        </p>
      </div>
      <Breadcrumb className="hidden md:block">
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
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-bold">Carrinho</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Recebe o foco quando a linha que o tinha é removida. */}
      <h1 id="carrinho" tabIndex={-1} className="sr-only">
        Carrinho de NFTs
      </h1>

      {cart.lines.length === 0 ? (
        <EmptyState
          title="Seu carrinho está vazio"
          description="Explore o mercado e adicione NFTs para continuar."
          action={
            <Button asChild>
              <Link to="/" hash="catalogo">
                Explorar o mercado
              </Link>
            </Button>
          }
        />
      ) : (
        // Mobile: tela cheia, resumo no rodapé da tela (frame).
        <div className="grid gap-6 max-md:flex-1 max-md:content-between md:gap-10 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:gap-20">
          <section aria-labelledby="itens" className="flex min-w-0 flex-col gap-3">
            <h2 id="itens" className="sr-only">
              Itens
            </h2>
            <div
              aria-hidden
              className="hidden grid-cols-[4rem_minmax(0,1fr)_6.5rem_7rem_6.5rem_2.5rem] gap-x-3 border-b pb-2 text-base font-bold md:grid"
            >
              <span className="col-span-2">NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            <CartChangesAnnouncer lines={cart.lines} onHighlight={setHighlighted} />
            {/* Cupom vencido removido pelo servidor (SPEC §7); a região já existe antes do aviso. */}
            <div role="status" className="text-sm text-primary empty:sr-only">
              {cart.notices?.map((notice) => (
                <p key={notice.code}>{notice.message}</p>
              ))}
            </div>
            <ul aria-label="Itens do carrinho" className="flex flex-col gap-2.5">
              {cart.lines.map((line) => (
                <CartLine
                  key={line.lineId}
                  line={line}
                  highlighted={highlighted.includes(line.lineId)}
                />
              ))}
            </ul>
          </section>
          <CartSummary cart={cart} updating={updating} />
        </div>
      )}

      {/* Complementar: sem dados ou com erro, a vitrine some. Só no desktop (o frame mobile não tem). */}
      {trending.data && trending.data.items.length > 0 && (
        <div className="mt-10 hidden md:block lg:mt-16">
          <NftCarousel title="Colecionadores também viram" nfts={trending.data.items} />
        </div>
      )}
    </PageContainer>
  )
}
