import { Link } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import CloseIcon from '@/assets/icons/close.svg?react'
import ThankYouIcon from '@/assets/icons/thank-you.svg?react'
import { EthPrice } from '@/shared/components/EthPrice'
import { NETWORK_LABELS, WALLET_PROVIDER_LABELS } from '@/shared/contracts'
import { compare } from '@/shared/lib/eth'
import { Button } from '@/shared/ui/button'

import type { ReceiptProps } from './types'

const dateParts = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** "29 jul, 2026", como no frame (o `pt-BR` padrão, "29 de jul. de 2026", não cabe na faixa). */
function formatDate(iso: string) {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(iso)).map(({ type, value }) => [type, value]),
  )
  return `${parts.day} ${parts.month!.replace('.', '')}, ${parts.year}`
}

const shortHash = (hash: string) => `${hash.slice(0, 6)}…${hash.slice(-4)}`

function copy(hash: string) {
  navigator.clipboard.writeText(hash).then(
    () => toast.success('Hash copiado.'),
    () => toast.error('Não foi possível copiar o hash.'),
  )
}

/**
 * Recibo do pedido confirmado (SPEC §8.5, §8.7), conforme o frame "Confirmação de Pedido". É o
 * snapshot do servidor: nada aqui é recalculado. "Ver no Etherscan" só revela o hash simulado.
 */
export function Receipt({ receipt }: ReceiptProps) {
  const [revealed, setRevealed] = useState(false)
  const hashId = useId()
  const meta = [
    { label: 'ID da transação', value: shortHash(receipt.transactionHash), strong: true },
    { label: 'Data', value: formatDate(receipt.confirmedAt) },
    { label: 'Total', value: <EthPrice value={receipt.total} /> },
    { label: 'Carteira', value: WALLET_PROVIDER_LABELS[receipt.wallet.provider], strong: true },
  ]

  return (
    <article className="relative mx-auto flex w-full max-w-[36.125rem] flex-col bg-card text-option">
      <Link
        to="/"
        aria-label="Fechar"
        className="absolute top-3 right-3.5 rounded-sm text-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
      >
        <CloseIcon aria-hidden />
      </Link>

      <header className="flex h-39 flex-col items-center justify-center gap-4 px-4 text-center">
        <ThankYouIcon aria-hidden className="text-primary" />
        <h1 className="leading-4 font-bold">Seus NFTs agora estão na sua carteira</h1>
      </header>

      <dl className="grid grid-cols-2 gap-4 border-y border-primary px-6 py-3 md:flex md:min-h-16.25 md:items-center md:justify-between md:px-9 md:py-1">
        {meta.map(({ label, value, strong }, i) => (
          <div
            key={label}
            className={`whitespace-nowrap ${i > 0 ? 'md:border-l md:border-primary md:pl-4' : ''}`}
          >
            <dt className={`text-sm leading-4 ${strong ? 'font-bold' : ''}`}>{label}</dt>
            <dd className="text-[15px]">{value}</dd>
          </div>
        ))}
      </dl>

      <section
        aria-labelledby="detalhes-transacao"
        className="flex flex-col gap-3 px-4 pt-5 pb-12 text-foreground md:px-11"
      >
        <h2 id="detalhes-transacao" className="text-[15px] leading-4 font-bold">
          Detalhes da transação
        </h2>
        <p
          aria-hidden
          className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 border-b border-border pb-3 leading-4 md:gap-x-12"
        >
          <span className="font-bold">NFTs</span>
          <span className="font-bold">Edições</span>
          <span className="font-medium">Subtotal</span>
        </p>
        <ul aria-label="NFTs comprados" className="flex flex-col gap-3">
          {receipt.lines.map((line) => (
            <li
              key={`${line.tokenId}:${line.editionLabel}`}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 md:gap-x-12"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={line.image}
                  alt=""
                  width={70}
                  height={70}
                  loading="lazy"
                  className="size-14 shrink-0 rounded-lg object-cover md:size-17.5"
                />
                <div className="flex min-w-0 flex-col gap-1.5 leading-4">
                  <p className="truncate font-bold">{line.title}</p>
                  <p className="text-sm text-option">
                    ID do token: #{line.tokenId.padStart(4, '0')}
                  </p>
                  <p className="text-xs text-option">{line.editionLabel}</p>
                </div>
              </div>
              <span className="text-sm text-option">
                <span className="sr-only">Quantidade: </span>(x {line.quantity})
              </span>
              <EthPrice
                value={line.lineTotal}
                className="text-right font-bold text-option-active md:text-lg"
              />
            </li>
          ))}
        </ul>

        <dl className="ml-auto flex w-full max-w-80 flex-col gap-3 leading-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[15px]">Subtotal</dt>
            <dd className="md:text-lg">
              <EthPrice value={receipt.subtotal} />
            </dd>
          </div>
          {compare(receipt.discount, '0') > 0 && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[15px]">Desconto do lançamento</dt>
              <dd className="md:text-lg">
                (-) <EthPrice value={receipt.discount} />
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[15px]">Taxa de rede</dt>
            <dd className="md:text-lg">
              <EthPrice value={receipt.networkFee} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 font-bold">
            <dt>Total</dt>
            <dd className="text-lg text-option-active">
              <EthPrice value={receipt.total} />
            </dd>
          </div>
        </dl>

        <div className="flex flex-col items-center gap-6 border-t border-border pt-3 text-center">
          <p className="text-sm leading-[1.375rem] text-option">
            Transação confirmada na {NETWORK_LABELS[receipt.network]}. A propriedade foi transferida
            para sua carteira conectada ({receipt.wallet.label}, {receipt.wallet.shortAddress}) e
            registrada na rede.
          </p>
          <Button
            type="button"
            aria-expanded={revealed}
            aria-controls={hashId}
            onClick={() => setRevealed((open) => !open)}
            className="h-12 rounded-[5px] px-4 text-base font-bold"
          >
            Ver no Etherscan
          </Button>
          <div id={hashId} hidden={!revealed} className="flex w-full flex-col items-center gap-3">
            <p className="text-sm text-option">Hash da transação</p>
            <p className="font-mono text-sm break-all">{receipt.transactionHash}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => copy(receipt.transactionHash)}
              className="h-10 rounded-sm text-sm font-bold"
            >
              Copiar hash
            </Button>
            <p className="text-xs text-option">Transação simulada, sem registro em blockchain</p>
          </div>
        </div>
      </section>
      <div aria-hidden className="h-2.5 bg-primary" />
    </article>
  )
}
