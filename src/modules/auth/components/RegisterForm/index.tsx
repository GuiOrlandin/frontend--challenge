import { z } from 'zod'

import { registerSchema } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'

import { register } from '../../api'
import { useAuthForm } from '../../hooks/useAuthForm'
import { FormField } from '../FormField'

/**
 * O frame não tem "Nome de exibição", mas a API exige: vai o nome de usuário, que já cabe na
 * regra (2–40) e pode ser trocado no Perfil.
 */
const registerFormSchema = z.preprocess(
  (input) => ({
    ...(input as Record<string, unknown>),
    displayName: (input as { username?: unknown }).username,
  }),
  registerSchema,
)

export function RegisterForm() {
  const { onSubmit, fieldErrors, formError, pending } = useAuthForm(registerFormSchema, register)

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
      <FormField
        name="username"
        label="Nome de usuário"
        placeholder="Nome de usuário"
        autoComplete="username"
        error={fieldErrors.username}
      />
      <FormField
        name="email"
        type="email"
        label="E-mail"
        placeholder="Digite seu e-mail"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <FormField
        name="password"
        type="password"
        label="Senha"
        placeholder="Senha"
        autoComplete="new-password"
        error={fieldErrors.password}
      />
      <FormField
        name="confirmPassword"
        type="password"
        label="Confirmar senha"
        placeholder="Confirmar senha"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
      />
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
        Criar conta
      </Button>
    </form>
  )
}
