import EllipsisIcon from '@/assets/icons/ellipsis.svg?react'
import { NETWORK_LABELS } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

import type { WalletPickerProps } from './types'

/**
 * Troca entre a principal e a secundária, repreenchendo o formulário (SPEC §9).
 * `card` (mobile, no topo): Carteiras com radio, "Trocar carteira" e ⋮ para editar os dados.
 * `toggle` (desktop, depois do E-mail): "Usar outra carteira?".
 */
export function WalletPicker({
  variant,
  wallet,
  wallets,
  canSwitch,
  onSwitch,
  editing,
  onEdit,
  fieldsId,
}: WalletPickerProps) {
  if (variant === 'toggle') {
    if (!canSwitch) return null
    const usingOther = wallet.role === 'secondary'
    return (
      <button
        type="button"
        aria-pressed={usingOther}
        onClick={onSwitch}
        className="flex w-fit items-center gap-2 rounded-sm text-15 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none max-md:hidden md:col-span-2"
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

  // Mobile (frame): uma linha por Carteira com radio; o ⋮ abre os dados do comprador.
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
      <RadioGroup
        aria-labelledby="carteira-conectada"
        value={wallet.id}
        // Só há principal e secundária: escolher a outra é trocar.
        onValueChange={(id) => id !== wallet.id && onSwitch()}
        className="gap-3"
      >
        {wallets.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl bg-card py-3 pr-2 pl-4 text-sm"
          >
            <RadioGroupItem id={`carteira-${item.id}`} value={item.id} />
            <label
              htmlFor={`carteira-${item.id}`}
              className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1"
            >
              <span className="text-base font-bold">{item.label}</span>
              <span className="truncate text-option">
                {item.address.slice(0, 6)}…{item.address.slice(-4)}
              </span>
              <span className="text-option">Rede {NETWORK_LABELS[item.network]}</span>
            </label>
            {item.id === wallet.id && onEdit && (
              <button
                type="button"
                aria-label="Editar dados do comprador"
                aria-expanded={editing}
                aria-controls={fieldsId}
                onClick={onEdit}
                className="grid size-9 place-items-center self-start rounded-full text-option hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
              >
                <EllipsisIcon className="size-5 rotate-90" aria-hidden />
              </button>
            )}
          </div>
        ))}
      </RadioGroup>
    </section>
  )
}
