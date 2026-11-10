/** Erros de formulário por campo (SPEC §9): o mesmo formato para Zod no cliente e `fieldErrors` da API. */
import { z } from 'zod'

export type FieldErrors = Partial<Record<string, string>>

/** Primeira mensagem de cada campo. */
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const issues = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>
  return Object.fromEntries(Object.entries(issues).map(([key, list]) => [key, list?.[0]]))
}

/** Foca o primeiro campo inválido na ordem do formulário. */
export function focusFirstInvalid(form: HTMLFormElement, errors: FieldErrors) {
  Array.from(form.elements)
    .find((el): el is HTMLInputElement => el instanceof HTMLInputElement && !!errors[el.name])
    ?.focus()
}
