import { Link } from '@tanstack/react-router'

import { EthPrice } from '@/shared/components/EthPrice'

import type { CheckoutSummaryProps } from './types'

/**
 * "Seus NFTs" e valores estimados do carrinho (`summary`, SPEC §7); a Cotação firme vem na
 * revisão. Mobile: só o Total (frame mobile).
 */
export function CheckoutSummary({ cart }: CheckoutSummaryProps) {
  const { subtotal, discount, networkFee, total } = cart.summary

  return (
    <section aria-labelledby="seus-nfts" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 max-md:hidden">
        <h2 id="seus-nfts" className="font-bold">
          Seus NFTs
        </h2>
        <p aria-hidden className="flex justify-between text-sm font-bold">
          <span>NFTs</span>
          <span>Subtotal</span>
        </p>
        <ul aria-label="Itens do pedido" className="flex flex-col gap-2">
          {cart.lines.map((line) => (
            <li
              key={line.lineId}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto_auto] items-center gap-x-3 rounded-sm bg-card p-1 pr-3"
            >
              <img
                src={line.nft.image}
                alt=""
                width={56}
                height={56}
                loading="lazy"
                className="size-14 rounded-sm object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{line.nft.title}</p>
                <p className="text-xs text-option">
                  ID do token: #{line.nft.tokenId.padStart(4, '0')}
                </p>
              </div>
              <span className="text-xs text-option">
                <span className="sr-only">Quantidade: </span>(x {line.quantity})
              </span>
              <EthPrice value={line.lineTotal} className="font-bold text-primary" />
            </li>
          ))}
        </ul>
        <p className="text-center text-xs">
          Tem um código promocional?{' '}
          <Link to="/carrinho" className="text-primary hover:underline">
            Aplique aqui
          </Link>
        </p>
      </div>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between gap-4 max-md:hidden">
          <dt>Subtotal</dt>
          <dd className="text-base">
            <EthPrice value={subtotal} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 max-md:hidden">
          <dt>Desconto do lançamento</dt>
          <dd className="text-xs">
            (-) <EthPrice value={discount} />
          </dd>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 max-md:hidden">
          <dt>Taxa de rede</dt>
          <dd className="text-base">
            <EthPrice value={networkFee} />
          </dd>
          <dd className="col-span-2 text-right text-[10px] text-primary">Taxa estimada</dd>
        </div>
        <div className="flex items-center justify-between gap-4 font-bold md:mt-2 md:border-t md:pt-4">
          <dt className="max-md:ml-auto">Total</dt>
          <dd className="text-lg">
            <EthPrice value={total} className="text-primary" />
          </dd>
        </div>
      </dl>
    </section>
  )
}
