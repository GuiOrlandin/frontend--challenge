import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useCanGoBack, useNavigate, useRouter, useSearch } from '@tanstack/react-router'

import BackIcon from '@/assets/icons/arrow-circle-left.svg?react'
import { accountQueries } from '@/modules/account'
import { sessionQueries } from '@/modules/auth'
import { cartQueries } from '@/modules/cart'
import { EmptyState } from '@/shared/components/EmptyState'
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

import { BuyerForm } from '../../components/BuyerForm'
import { ReviewStep } from '../../components/ReviewStep'

/** `/pagamento?step=` (SPEC §8.1). Carrinho, Perfil e Carteiras já vêm do loader. */
export function CheckoutPage() {
  const { step } = useSearch({ from: '/_authenticated/pagamento' })
  const { data: session } = useSuspenseQuery(sessionQueries.current())
  const userId = session!.user.id
  const { data: cart } = useSuspenseQuery(cartQueries.current(userId))
  const { data: profile } = useSuspenseQuery(accountQueries.profile(userId))
  const { data: wallets } = useSuspenseQuery(accountQueries.wallets(userId))
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
          onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/carrinho' }))}
          className="rounded-full focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
        >
          <BackIcon className="size-9" aria-hidden />
        </button>
        <p aria-hidden className="text-center text-xl font-bold">
          Pagamento com carteira
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
            <BreadcrumbPage className="font-bold">Pagamento</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="sr-only">Pagamento com carteira</h1>

      {wallets.length === 0 ? (
        <EmptyState
          title="Cadastre uma carteira para continuar"
          description="O pagamento usa os dados da sua carteira principal."
          action={
            <Button asChild>
              <Link to="/perfil/carteiras" search={{ redirect: '/pagamento' }}>
                Cadastrar carteira
              </Link>
            </Button>
          }
        />
      ) : step === 'revisao' ? (
        <ReviewStep userId={userId} wallets={wallets} cart={cart} />
      ) : (
        <BuyerForm userId={userId} profile={profile} wallets={wallets} cart={cart} />
      )}
    </PageContainer>
  )
}
