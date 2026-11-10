import { useState } from 'react'

import EyeIcon from '@/assets/icons/eye.svg?react'
import EyeOffIcon from '@/assets/icons/eye-off.svg?react'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'

/** `Input` de senha com o olho do Figma para mostrar ou ocultar (login, cadastro, perfil). */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        aria-label="Mostrar senha"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-primary hover:text-primary/80"
      >
        {visible ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
      </button>
    </div>
  )
}
