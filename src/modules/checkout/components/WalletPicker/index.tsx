import { NETWORK_LABELS } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'

import type { WalletPickerProps } from './types'

/**
 * Troca entre a principal e a secundária, repreenchendo o formulário (SPEC §9).
 * `card` (mobile, no topo): Carteira conectada com "Trocar carteira".
 * `toggle` (desktop, depois do E-mail): "Usar outra carteira?".
 */
export function WalletPicker({ variant, wallet, canSwitch, onSwitch }: WalletPickerProps) {
  if (variant === 'toggle') {
    if (!canSwitch) return null
    const usingOther = wallet.role === 'secondary'
    return (
      <button
        type="button"
        aria-pressed={usingOther}
        onClick={onSwitch}
        className="flex w-fit items-center gap-2 rounded-sm text-sm focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none max-md:hidden md:col-span-2"
      >
        <span
          aria-hidden
          className={cn(
            'grid size-4 place-items-center rounded-full border border-primary',
            usingOther && 'after:size-2 after:rounded-full after:bg-primary',
          )}
        />
        Usar outra carteira?
      </button>
    )
  }

  return (
    <section aria-labelledby="carteira-conectada" className="flex flex-col gap-3 md:hidden">
      <div className="flex items-center justify-between gap-4">
        <h2 id="carteira-conectada" className="font-bold">
          Carteira conectada
        </h2>
        {canSwitch && (
          <button
            type="button"
            onClick={onSwitch}
            className="text-sm text-primary hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Trocar carteira
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-card px-4 py-3 text-sm">
        <p className="font-bold">{wallet.label}</p>
        <p className="truncate text-option">
          {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
        </p>
        <p className="text-option">Rede {NETWORK_LABELS[wallet.network]}</p>
      </div>
    </section>
  )
}
