import { loginSchema } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'

import { login } from '../../api'
import { useAuthForm } from '../../hooks/useAuthForm'
import { FormField } from '../FormField'

export function LoginForm() {
  const { onSubmit, fieldErrors, formError, pending } = useAuthForm(loginSchema, login)

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
      <FormField
        name="email"
        type="email"
        label="E-mail"
        placeholder="contato@email.com"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <div className="grid gap-2">
        <FormField
          name="password"
          type="password"
          label="Senha"
          placeholder="Senha"
          autoComplete="current-password"
          error={fieldErrors.password}
        />
        {/* Estático (SPEC §1). */}
        <span className="justify-self-end text-xs text-primary">Esqueceu a senha?</span>
      </div>
      {formError && (
        <p role="alert" className="text-xs text-destructive">
          {formError}
        </p>
      )}
      <Button
        type="submit"
        aria-busy={pending}
        disabled={pending}
        className="mt-4 h-12 rounded-md lg:h-11"
      >
        Entrar
      </Button>
    </form>
  )
}
