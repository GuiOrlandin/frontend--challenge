import { useId } from 'react'

import { ENS_SUFFIX, withoutEnsSuffix } from '@/shared/lib/ens'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { inputClass } from '../Field'
import type { EnsFieldProps } from './types'

/** "Nome ENS": o nome num campo e o domínio num select. Envie com `withEnsSuffix`. */
export function EnsField({ defaultValue, error }: EnsFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`

  return (
    <div className="grid content-start gap-3">
      <Label htmlFor={id} className="text-15 font-normal">
        Nome ENS
        <span aria-hidden="true" className="-ml-1.5 text-22 leading-none text-primary">
          *
        </span>
      </Label>
      <div className="flex gap-2">
        {/* Só `.eth` (SPEC §9): o select existe porque está no Figma. */}
        <Select value={ENS_SUFFIX}>
          <SelectTrigger aria-label="Domínio ENS" className="h-10! dark:bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ENS_SUFFIX}>{ENS_SUFFIX}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          id={id}
          name="ensName"
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          defaultValue={withoutEnsSuffix(defaultValue)}
          className={inputClass}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
