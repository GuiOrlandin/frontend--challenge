import { useId } from 'react'

import { PasswordInput } from '@/shared/components/PasswordInput'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import type { FieldProps } from './types'

export const inputClass = 'h-10 rounded-sm bg-transparent dark:bg-transparent'

/** Campo com rótulo à vista e asterisco do Figma (SPEC §9: o asterisco vale ao pé da letra). */
export function Field({ label, required, error, type = 'text', ...props }: FieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const inputProps = {
    id,
    className: inputClass,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-required': required || undefined,
    ...props,
  }

  return (
    <div className="grid content-start gap-3">
      <Label htmlFor={id} className="font-normal">
        {label}
        {required && (
          <span aria-hidden="true" className="-ml-1.5 text-base leading-none text-primary">
            *
          </span>
        )}
      </Label>
      {type === 'password' ? (
        <PasswordInput {...inputProps} />
      ) : (
        <Input type={type} {...inputProps} />
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
