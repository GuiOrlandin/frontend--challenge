import { Link } from '@tanstack/react-router'

import { EthPrice } from '@/shared/components/EthPrice'

import type { CheckoutSummaryProps } from './types'

/**
 * "Seus NFTs" e valores: estimados do carrinho (`summary`, SPEC §7) nos dados, firmes da
 * Cotação na revisão. Mobile: só o Total (frame mobile).
 */
export function CheckoutSummary({ cart, quote }: CheckoutSummaryProps) {
  const { subtotal, discount, networkFee, total } = quote ?? cart.summary
  // Na revisão as linhas são as cotadas; imagem e token vêm da linha do carrinho.
  const lines = quote
    ? quote.lines.map((line) => {
        const inCart = cart.lines.find(
          (l) => l.nftId === line.nftId && l.editionId === line.editionId,
        )
        return { ...line, key: `${line.nftId}:${line.editionId}`, nft: inCart?.nft }
      })
    : cart.lines.map((line) => ({ ...line, key: line.lineId, title: line.nft.title }))

  return (
    <section aria-labelledby="seus-nfts" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 max-md:hidden">
        <h2 id="seus-nfts" className="text-17 font-bold">
          Seus NFTs
        </h2>
        <p aria-hidden className="flex justify-between text-base font-bold">
          <span>NFTs</span>
          <span>Subtotal</span>
        </p>
        <ul aria-label="Itens do pedido" className="flex flex-col gap-2">
          {lines.map((line) => (
            <li
              key={line.key}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto_auto] items-center gap-x-3 rounded-sm bg-card p-1 pr-3"
            >
              {line.nft ? (
                <img
                  src={line.nft.image}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="size-14 rounded-sm object-cover"
                />
              ) : (
                <span aria-hidden className="size-14 rounded-sm bg-muted" />
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{line.title}</p>
                {line.nft && (
                  <p className="text-sm text-option">
                    ID do token: #{line.nft.tokenId.padStart(4, '0')}
                  </p>
                )}
              </div>
              <span className="text-sm text-option">
                <span className="sr-only">Quantidade: </span>(x {line.quantity})
              </span>
              <EthPrice value={line.lineTotal} className="text-lg font-bold text-primary" />
            </li>
          ))}
        </ul>
        {!quote && (
          <p className="text-center text-sm">
            Tem um código promocional?{' '}
            <Link to="/carrinho" className="text-primary underline underline-offset-2">
              Aplique aqui
            </Link>
          </p>
        )}
      </div>
      <dl className="flex flex-col gap-3 text-15">
        <div className="flex items-center justify-between gap-4 max-md:hidden">
          <dt>Subtotal</dt>
          <dd className="text-lg">
            <EthPrice value={subtotal} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 max-md:hidden">
          <dt>Desconto do lançamento</dt>
          <dd className="text-15">
            (-) <EthPrice value={discount} />
          </dd>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 max-md:hidden">
          <dt>Taxa de rede</dt>
          <dd className="text-lg">
            <EthPrice value={networkFee} />
          </dd>
          {!quote && <dd className="col-span-2 text-right text-xs text-primary">Taxa estimada</dd>}
        </div>
        <div className="flex items-center justify-between gap-4 text-base font-bold md:mt-2 md:border-t md:pt-4">
          <dt className="max-md:ml-auto">Total</dt>
          <dd className="text-lg">
            <EthPrice value={total} className="text-primary" />
          </dd>
        </div>
      </dl>
    </section>
  )
}
