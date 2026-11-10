import { useId } from 'react'

import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import type { SelectFieldProps } from './types'

/**
 * Select obrigatório no formato do `Field`. O Radix envia o valor num `<select>` nativo oculto;
 * o foco do erro vai para o gatilho, que leva o `aria-invalid`.
 */
export function SelectField({
  name,
  label,
  options,
  defaultValue,
  value,
  onValueChange,
  disabled,
  error,
}: SelectFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`

  return (
    <div className="grid content-start gap-3">
      <Label htmlFor={id} className="font-normal">
        {label}
        <span aria-hidden="true" className="-ml-1.5 text-base leading-none text-primary">
          *
        </span>
      </Label>
      <Select
        name={name}
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-10! w-full dark:bg-transparent"
        >
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {options.map(([value, text]) => (
            <SelectItem key={value} value={value}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
