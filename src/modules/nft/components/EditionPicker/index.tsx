import type { Edition } from '@/shared/contracts'
import { cn } from '@/shared/lib/utils'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

interface EditionPickerProps {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
}

/** Edições do Nft em pílulas; a esgotada fica visível e desabilitada (SPEC §13.6). */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-15 font-bold">Edição:</legend>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-1">
        {/* Ordem do Figma: menor tiragem primeiro, aberta por último. */}
        {editions
          .toSorted((a, b) => (a.supply ?? Infinity) - (b.supply ?? Infinity))
          .map((edition) => {
            const soldOut = edition.available === 0
            const id = `edition-${edition.id}`
            return (
              <label
                key={edition.id}
                htmlFor={id}
                className={cn(
                  'cursor-pointer rounded-full border px-1.5 py-0.5 text-sm text-option uppercase has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:text-primary',
                  soldOut && 'cursor-not-allowed line-through opacity-60',
                )}
              >
                {/* O rádio continua no foco e na leitura; a pílula é o visual. */}
                <RadioGroupItem id={id} value={edition.id} disabled={soldOut} className="sr-only" />
                {/* Figma mostra a tiragem (1/50, ABERTA); o nome completo fica para leitores de tela. */}
                <span aria-hidden>
                  {edition.supply === null ? 'Aberta' : `1/${edition.supply}`}
                </span>
                <span className="sr-only">
                  {edition.label}
                  {soldOut && ' (Esgotada)'}
                </span>
              </label>
            )
          })}
      </RadioGroup>
    </fieldset>
  )
}
