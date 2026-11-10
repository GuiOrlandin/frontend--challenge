import { Link } from '@tanstack/react-router'

// shortcut: ícone de remover provisório (X) até chegar o SVG da lixeira do Figma.
import TrashIcon from '@/assets/icons/x.svg?react'
import { EthPrice } from '@/shared/components/EthPrice'
import { QuantityStepper } from '@/shared/components/QuantityStepper'
import { cn } from '@/shared/lib/utils'

import { useChangeLine } from '../../hooks/useCart'

import type { CartLineProps } from './types'

/** Linha do carrinho: quantidade e remoção otimistas; esgotada ou acima do estoque bloqueia o checkout. */
export function CartLine({ line, highlighted = false }: CartLineProps) {
  const change = useChangeLine()
  const max = Math.min(line.available, line.maxPerOrder)
  const { title, tokenId, image } = line.nft

  return (
    <li
      aria-busy={change.isPending}
      className={cn(
        'grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-sm bg-card p-1 pr-3 transition-shadow md:grid-cols-[4rem_minmax(0,1fr)_6.5rem_7rem_6.5rem_2.5rem] md:gap-x-3 md:gap-y-0',
        highlighted && 'ring-2 ring-primary',
      )}
    >
      <img
        src={image}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        className="row-span-2 size-16 rounded-sm object-cover md:row-span-1"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          <Link
            to="/nft/$nftId"
            params={{ nftId: line.nftId }}
            className="hover:text-primary focus-visible:underline focus-visible:outline-none"
          >
            {title}
          </Link>
        </p>
        <p className="text-xs whitespace-nowrap text-option">
          ID do token: #{tokenId.padStart(4, '0')}
        </p>
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
        className="col-start-2 md:col-start-auto"
      />
      <p className="justify-self-end text-sm font-bold text-primary md:justify-self-auto">
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
        className="col-start-3 row-start-1 flex size-9 items-center justify-center justify-self-end rounded-sm text-option hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none md:col-start-auto md:row-start-auto"
      >
        <TrashIcon className="size-5" aria-hidden />
      </button>
    </li>
  )
}
