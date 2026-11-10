import { Link } from '@tanstack/react-router'

import TrashIcon from '@/assets/icons/trash.svg?react'
import { EthPrice } from '@/shared/components/EthPrice'
import { QuantityStepper } from '@/shared/components/QuantityStepper'
import { cn } from '@/shared/lib/utils'

import { useChangeLine } from '../../hooks/useCart'

import type { CartLineProps } from './types'

/**
 * Linha do carrinho: quantidade e remoção otimistas; esgotada ou acima do estoque bloqueia o
 * checkout. Mobile: arte na altura toda, Edição e total; desktop: colunas Preço/Edições/Total.
 */
export function CartLine({ line, highlighted = false }: CartLineProps) {
  const change = useChangeLine()
  const max = Math.min(line.available, line.maxPerOrder)
  const { title, tokenId, image, editionLabel } = line.nft

  return (
    <li
      aria-busy={change.isPending}
      className={cn(
        'grid grid-cols-[5rem_minmax(0,1fr)_auto] gap-x-3 overflow-hidden rounded-xl bg-card transition-shadow md:grid-cols-[4rem_minmax(0,1fr)_6.5rem_7rem_6.5rem_2.5rem] md:items-center md:rounded-sm md:p-1 md:pr-3',
        highlighted && 'ring-2 ring-primary',
      )}
    >
      <img
        src={image}
        alt=""
        width={80}
        height={100}
        loading="lazy"
        className="row-span-2 h-full min-h-25 w-20 object-cover md:row-span-1 md:size-16 md:min-h-0 md:rounded-sm"
      />
      <div className="row-span-2 flex min-w-0 flex-col gap-1 py-2.5 md:row-span-1 md:gap-0 md:py-0">
        <p className="truncate text-sm font-bold">
          <Link
            to="/nft/$nftId"
            params={{ nftId: line.nftId }}
            className="hover:text-primary focus-visible:underline focus-visible:outline-none"
          >
            {title}
          </Link>
        </p>
        <p className="hidden text-xs whitespace-nowrap text-option md:block">
          ID do token: #{tokenId.padStart(4, '0')}
        </p>
        <p className="text-xs text-option md:hidden">Edição: {editionLabel}</p>
        {line.status === 'unavailable' && (
          <p className="text-xs text-destructive">Edição esgotada. Remova para continuar.</p>
        )}
        {line.status === 'exceedsAvailable' && (
          <p className="text-xs text-destructive">
            {line.available === 1
              ? 'Só resta 1 disponível.'
              : `Só restam ${line.available} disponíveis.`}{' '}
            Ajuste a quantidade.
          </p>
        )}
        <p className="mt-auto text-lg font-bold text-primary md:hidden">
          <span className="sr-only">Total: </span>
          <EthPrice value={line.lineTotal} />
        </p>
      </div>
      <p className="hidden text-sm font-bold text-option md:block">
        <span className="sr-only">Preço: </span>
        <EthPrice value={line.unitPrice} />
      </p>
      <QuantityStepper
        label={`Quantidade de ${title}`}
        value={line.quantity}
        max={Math.max(max, 1)}
        disabled={line.status === 'unavailable'}
        onChange={(quantity) => change.mutate({ lineId: line.lineId, quantity })}
        // Mobile: botões menores e escuros, como no frame.
        className="col-start-3 row-start-1 gap-1 pt-2.5 pr-2.5 max-md:[&_button]:size-6 max-md:[&_button]:bg-accent max-md:[&_button]:text-foreground max-md:[&_input]:h-6 max-md:[&_input]:w-6 max-md:[&_input]:text-sm max-md:[&_svg]:size-3.5 md:col-start-auto md:row-start-auto md:gap-2 md:p-0"
      />
      <p className="hidden text-sm font-bold text-primary md:block">
        <span className="sr-only">Total: </span>
        <EthPrice value={line.lineTotal} />
      </p>
      <button
        type="button"
        aria-label={`Remover ${title}`}
        onClick={() => {
          // A linha some na hora (otimista): o foco não pode cair no body.
          document.getElementById('carrinho')?.focus()
          change.mutate({ lineId: line.lineId, quantity: 0 })
        }}
        className="col-start-3 row-start-2 mr-1 mb-1 flex size-9 items-center justify-center self-end justify-self-end rounded-sm text-primary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none md:col-start-auto md:row-start-auto md:m-0 md:self-auto md:text-option md:hover:text-primary"
      >
        <TrashIcon className="h-5 w-[18px]" aria-hidden />
      </button>
    </li>
  )
}
