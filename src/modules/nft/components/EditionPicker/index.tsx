import type { Edition } from '@/shared/contracts'
import { EthPrice } from '@/shared/components/EthPrice'
import { cn } from '@/shared/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

interface EditionPickerProps {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
}

/** Edições do Nft; a esgotada fica visível e desabilitada (SPEC §13.6). */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm text-muted-foreground">Edição</legend>
      <RadioGroup value={value} onValueChange={onChange} className="gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const id = `edition-${edition.id}`
          return (
            <label
              key={edition.id}
              htmlFor={id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 has-[[data-state=checked]]:border-primary',
                soldOut && 'cursor-not-allowed opacity-60',
              )}
            >
              <RadioGroupItem id={id} value={edition.id} disabled={soldOut} />
              <span className="flex-1 text-sm">{edition.label}</span>
              <span className="text-xs text-muted-foreground">
                {soldOut
                  ? 'Esgotada'
                  : edition.supply === null
                    ? 'Aberta'
                    : `${edition.available} disponíveis`}
              </span>
              <EthPrice value={edition.price} className="text-sm font-bold text-primary" />
            </label>
          )
        })}
      </RadioGroup>
    </fieldset>
  )
}
