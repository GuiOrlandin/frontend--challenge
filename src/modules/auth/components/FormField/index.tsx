import { useId, useState } from 'react'

import EyeIcon from '@/assets/icons/eye.svg?react'
import EyeOffIcon from '@/assets/icons/eye-off.svg?react'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import type { FormFieldProps } from './types'

/** Campo do Figma: só o placeholder à vista, rótulo para leitores de tela, erro associado. */
export function FormField({ label, error, type = 'text', ...props }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-12 rounded-md bg-transparent px-4 lg:h-10 text-xs placeholder:text-primary/70 md:text-xs dark:bg-transparent',
            isPassword && 'pr-12',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label="Mostrar senha"
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-primary hover:text-primary/80"
          >
            {visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
