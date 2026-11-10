import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ErrorState } from '@/shared/components/ErrorState'
import {
  buyerSchema,
  isApiError,
  NETWORK_LABELS,
  type Quote,
  WALLET_PROVIDER_LABELS,
} from '@/shared/contracts'
import { withEnsSuffix } from '@/shared/lib/ens'
import { useRealtimeEvent } from '@/shared/lib/realtime'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { createOrder } from '../../api'
import {
  attemptFor,
  type CheckoutAttempt,
  clearAttempt,
  readAttempt,
  writeAttempt,
} from '../../attempt'
import { readDraft } from '../../draft'
import { checkoutQueries } from '../../queries'
import { cartTarget, describeQuoteChanges } from '../../quoteChanges'
import { CheckoutSummary } from '../CheckoutSummary'
import { QuoteChangesNotice } from '../QuoteChangesNotice'
import type { ReviewStepProps } from './types'

/** Reenvios automáticos após timeout ou falha de rede, sempre com a mesma chave (SPEC §8.4). */
const RETRY_DELAYS_MS = [1000, 2000, 4000]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Phase = 'idle' | 'sending' | 'verifying' | 'failed'

/** Item esgotado: o carrinho é quem resolve (mesma regra do loader). */
function backToCart(navigate: ReturnType<typeof useNavigate>) {
  toast('Ajuste ou remova os itens indisponíveis para continuar.')
  void navigate({ to: '/carrinho' })
}

/** Rascunho válido do passo "dados": Carteira existente e comprador que passa no schema. */
function readOrder(userId: string, wallets: ReviewStepProps['wallets']) {
  const draft = readDraft(userId)
  const wallet = draft && wallets.find((w) => w.id === draft.walletId)
  if (!draft || !wallet) return null
  const buyer = buyerSchema.safeParse({
    ...draft.values,
    ensName: withEnsSuffix(draft.values.ensName),
  })
  return buyer.success ? { wallet, provider: draft.provider, buyer: buyer.data } : null
}

/**
 * Passo "revisão" (SPEC §8.1–8.4, §8.6): cria a Cotação e a Conexão ao entrar, acompanha a
 * obsolescência e envia o pedido com chave de idempotência guardada em `sessionStorage`.
 */
export function ReviewStep({ userId, wallets, cart }: ReviewStepProps) {
  const [order] = useState(() => readOrder(userId, wallets))
  if (!order) return <Navigate to="/pagamento" search={{ step: 'dados' }} replace />
  return <Review userId={userId} cart={cart} {...order} />
}

function Review({
  userId,
  cart,
  wallet,
  provider,
  buyer,
}: Omit<ReviewStepProps, 'wallets'> & NonNullable<ReturnType<typeof readOrder>>) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const quoteOptions = checkoutQueries.quote(userId, wallet.network)
  const quoteQuery = useQuery(quoteOptions)
  const connection = useQuery(checkoutQueries.connection(userId, wallet.id, provider))
  const quote = quoteQuery.data

  // Obsolescência por Cotação: marcar pelo `quoteId` dispensa resetar ao trocar de Cotação.
  const [nftStaleFor, setNftStaleFor] = useState<string>()
  const [expiredFor, setExpiredFor] = useState<string>()
  /** Cotação nova do `QUOTE_STALE`: entra na tela pelo "Atualizar cotação". */
  const [replacement, setReplacement] = useState<Quote>()
  const [pending] = useState(() => {
    const saved = readAttempt(userId)
    return saved && !saved.orderId ? saved : null
  })
  const [phase, setPhase] = useState<Phase>(pending ? 'verifying' : 'idle')
  const [walletDropped, setWalletDropped] = useState(false)
  const [error, setError] = useState<string>()
  const mounted = useRef(true)
  const resumed = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => void (mounted.current = false)
  }, [])

  useRealtimeEvent('nft.updated', (event) => {
    if (quote && event.version > (quote.nftVersions[event.resourceId] ?? Infinity)) {
      setNftStaleFor(quote.quoteId)
    }
  })

  useEffect(() => {
    if (!quote) return
    const timer = setTimeout(
      () => setExpiredFor(quote.quoteId),
      Math.max(0, Date.parse(quote.expiresAt) - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [quote])

  useEffect(() => {
    if (isApiError(quoteQuery.error, 'AVAILABILITY_CONFLICT')) backToCart(navigate)
  }, [quoteQuery.error, navigate])

  const expired = !!quote && expiredFor === quote.quoteId
  const stale =
    !!quote &&
    (!!replacement ||
      nftStaleFor === quote.quoteId ||
      expired ||
      cart.version !== quote.cartVersion)
  const changes = !quote ? [] : describeQuoteChanges(quote, replacement ?? cartTarget(cart))

  async function refreshQuote() {
    setError(undefined)
    if (replacement) {
      queryClient.setQueryData(quoteOptions.queryKey, replacement)
      setReplacement(undefined)
    } else {
      await quoteQuery.refetch()
    }
  }

  function onOrderError(failure: unknown) {
    // Só a falha de rede deixa a tentativa pendente para "Tentar novamente" e para o refresh;
    // as demais nunca criaram pedido, e a retomada não pode reenviar sem clique.
    if (isApiError(failure, 'NETWORK_ERROR')) return setPhase('failed')
    setPhase('idle')
    clearAttempt()
    if (!isApiError(failure)) return setError('Algo deu errado. Tente novamente.')
    if (failure.code === 'QUOTE_STALE') {
      return setReplacement((failure.details as { quote: Quote }).quote)
    }
    if (failure.code === 'WALLET_DISCONNECTED') return setWalletDropped(true)
    if (failure.code === 'AVAILABILITY_CONFLICT') return backToCart(navigate)
    // A expiração de sessão já abre o login; o resto vira mensagem perto do botão.
    if (failure.code !== 'SESSION_EXPIRED') setError(failure.message)
  }

  function send(attempt: CheckoutAttempt, connectionId: string) {
    setError(undefined)
    setPhase('sending')
    void post(attempt, connectionId)
  }

  /** Envia e reenvia com a mesma chave; sucesso troca a rota sem deixar a revisão no histórico. */
  async function post(attempt: CheckoutAttempt, connectionId: string) {
    const input = { quoteId: attempt.quoteId, walletId: wallet.id, connectionId, buyer }
    for (let retry = 0; ; retry++) {
      try {
        const created = await createOrder(input, attempt.key)
        writeAttempt({ ...attempt, orderId: created.id })
        if (!mounted.current) return
        return void navigate({
          to: '/pedidos/$orderId',
          params: { orderId: created.id },
          replace: true,
        })
      } catch (failure) {
        const delay = RETRY_DELAYS_MS[retry]
        if (isApiError(failure, 'NETWORK_ERROR') && delay !== undefined && mounted.current) {
          setPhase('verifying')
          await sleep(delay)
          if (mounted.current) continue
        }
        if (mounted.current) onOrderError(failure)
        return
      }
    }
  }

  function confirm() {
    if (!quote || !connection.data) return
    const attempt = attemptFor(userId, quote.quoteId, readAttempt(userId))
    writeAttempt(attempt)
    send(attempt, connection.data.connectionId)
  }

  // Refresh antes do `orderId`: repete o envio pendente com a mesma chave (SPEC §8.6). A fase
  // já nasce em "verificando"; o efeito só dispara o envio quando a Conexão chega.
  useEffect(() => {
    if (!pending || resumed.current || !connection.data) return
    resumed.current = true
    void post(pending, connection.data.connectionId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uma vez, quando a Conexão chega
  }, [connection.data])

  async function reconnect() {
    const result = await connection.refetch()
    if (result.data) setWalletDropped(false)
  }

  if (quoteQuery.isPending) return <ReviewSkeleton />
  if (!quote) {
    return (
      <ErrorState
        title="Não foi possível cotar o pedido"
        description={quoteQuery.error?.message}
        onRetry={() => void quoteQuery.refetch()}
      />
    )
  }

  const busy = phase === 'sending' || phase === 'verifying'
  const canConfirm = !busy && !stale && !walletDropped && !!connection.data
  const shortAddress = `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`

  function connectionMessage() {
    if (connection.isFetching) return 'Conectando à carteira…'
    if (walletDropped) return 'A carteira desconectou. Conecte de novo para continuar.'
    if (isApiError(connection.error, 'WALLET_REJECTED')) return 'Conexão recusada na carteira'
    return connection.error?.message ?? ''
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
      <section aria-labelledby="carteira-pedido" className="flex min-w-0 flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <h2 id="carteira-pedido" className="font-bold">
            Carteira conectada
          </h2>
          <Link
            to="/pagamento"
            search={{ step: 'dados' }}
            className="text-sm text-primary hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Trocar carteira
          </Link>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3 text-sm">
          <p className="font-bold">{wallet.label}</p>
          <p className="truncate text-option">{shortAddress}</p>
          <p className="text-option">Rede {NETWORK_LABELS[wallet.network]}</p>
          <p className="text-option">{WALLET_PROVIDER_LABELS[provider]}</p>
        </div>

        <div role="status" aria-live="polite" className="text-sm empty:sr-only">
          {connectionMessage()}
        </div>
        {!connection.isFetching && (walletDropped || connection.error) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void reconnect()}
            className="h-10 w-fit rounded-sm text-sm font-bold"
          >
            {walletDropped ? 'Reconectar' : 'Tentar de novo'}
          </Button>
        )}

        <QuoteChangesNotice
          stale={stale}
          changes={changes}
          expired={expired}
          refreshing={quoteQuery.isFetching}
          onRefresh={() => void refreshQuote()}
        />
      </section>

      <aside className="flex flex-col gap-6 max-md:pb-8">
        <CheckoutSummary cart={cart} quote={quote} />
        <div role="status" aria-live="polite" className="text-sm empty:sr-only">
          {/* Retomada com a Conexão recusada: o aviso da Conexão explica o que fazer. */}
          {phase === 'verifying' && !connection.error
            ? 'Verificando seu pedido…'
            : phase === 'failed'
              ? 'Não conseguimos confirmar seu pedido. Tente novamente.'
              : (error ?? '')}
        </div>
        {phase === 'failed' ? (
          <Button
            type="button"
            disabled={stale || !connection.data}
            onClick={() => {
              const saved = readAttempt(userId)
              if (saved && connection.data) send(saved, connection.data.connectionId)
            }}
            className="h-10 rounded-sm text-15 font-bold max-md:h-12 max-md:rounded-full"
          >
            Tentar novamente
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canConfirm}
            aria-busy={busy || undefined}
            onClick={confirm}
            className="h-10 rounded-sm text-15 font-bold max-md:h-12 max-md:rounded-full max-md:bg-linear-to-r max-md:from-primary max-md:to-[#A86D3D]"
          >
            Confirmar compra
          </Button>
        )}
      </aside>
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Carregando a revisão"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]"
    >
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-80 rounded-sm" />
    </div>
  )
}
