import { type FormEvent, useState } from 'react'
import type { z } from 'zod'

import { type AuthResponse, isApiError } from '@/shared/contracts'
import { type FieldErrors, fieldErrorsOf, focusFirstInvalid } from '@/shared/lib/form'

import { useSignIn } from './useSignIn'

/** Mensagem de falha sem campo, decidida pelo `code` (SPEC §5.5). */
function formErrorOf(error: unknown): string {
  if (isApiError(error, 'UNAUTHENTICATED')) return 'E-mail ou senha incorretos.'
  if (isApiError(error, 'NETWORK_ERROR')) return error.message
  return 'Não foi possível concluir. Tente novamente.'
}

/**
 * Valida com Zod, envia, mapeia `fieldErrors` da API e foca o primeiro campo inválido (SPEC §9).
 * No sucesso, segue a sequência de autenticação.
 */
export function useAuthForm<S extends z.ZodType>(
  schema: S,
  send: (input: z.output<S>) => Promise<AuthResponse>,
) {
  const signIn = useSignIn()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const showFieldErrors = (errors: FieldErrors) => {
      setFieldErrors(errors)
      focusFirstInvalid(form, errors)
    }

    setFormError(undefined)
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)))
    if (!parsed.success) {
      showFieldErrors(fieldErrorsOf(parsed.error))
      return
    }

    setFieldErrors({})
    setPending(true)
    try {
      await signIn(await send(parsed.data))
    } catch (error) {
      if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
        showFieldErrors(error.fieldErrors)
      } else setFormError(formErrorOf(error))
    } finally {
      setPending(false)
    }
  }

  return { onSubmit, fieldErrors, formError, pending }
}
