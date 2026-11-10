import { useId } from 'react'

import { PasswordInput } from '@/shared/components/PasswordInput'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import type { FormFieldProps } from './types'

const inputClass =
  'h-12 rounded-md bg-transparent px-4 text-sm placeholder:text-[#B39463] md:text-sm lg:h-10 dark:bg-transparent'

/** Campo do Figma: só o placeholder à vista, rótulo para leitores de tela, erro associado. */
export function FormField({ label, error, type = 'text', ...props }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const inputProps = {
    id,
    className: inputClass,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    ...props,
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="sr-only">
        {label}
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
