import { useState } from 'react'

import MinusIcon from '@/assets/icons/minus.svg?react'
import PlusIcon from '@/assets/icons/plus.svg?react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

import { clampQuantity } from './clampQuantity'
import type { QuantityStepperProps } from './types'

export function QuantityStepper({
  value,
  onChange,
  max,
  min = 1,
  label = 'Quantidade',
  disabled = false,
  className,
}: QuantityStepperProps) {
  // Texto em edição; `null` mostra o valor controlado. Só vira número no blur ou Enter.
  const [draft, setDraft] = useState<string | null>(null)
  const range = { min, max }

  function commit(next: number) {
    setDraft(null)
    const clamped = clampQuantity(next, range)
    if (clamped !== value) onChange(clamped)
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center gap-1', className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= min}
        onClick={() => commit(value - 1)}
      >
        <MinusIcon />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        disabled={disabled}
        value={draft ?? String(value)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
        onBlur={() => draft !== null && commit(Number.parseInt(draft, 10))}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && draft !== null) commit(Number.parseInt(draft, 10))
        }}
        className="h-8 w-10 rounded-sm border border-input bg-transparent text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => commit(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
