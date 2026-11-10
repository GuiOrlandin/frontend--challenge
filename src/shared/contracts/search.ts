/** Search params globais da raiz (SPEC §4.2, §4.3). `scenario` e `reset` são lidos pelo bootstrap dos mocks. */
import { z } from 'zod'

export const AUTH_DIALOGS = ['entrar', 'cadastro'] as const

/** Só caminho interno: `/x`, nunca `//host` ou `/\host` (que o navegador trata como outra origem). */
const isInternalPath = (value: string) => value.startsWith('/') && !/^\/[/\\]/.test(value)

export const rootSearchSchema = z.object({
  auth: z.enum(AUTH_DIALOGS).optional().catch(undefined),
  redirect: z.string().refine(isInternalPath).optional().catch(undefined),
})

export type RootSearch = z.infer<typeof rootSearchSchema>

/** Passos do pagamento (SPEC §4.2, §8.1): `/pagamento?step=`. */
export const CHECKOUT_STEPS = ['dados', 'revisao'] as const

export const checkoutSearchSchema = z.object({
  step: z.enum(CHECKOUT_STEPS).default('dados').catch('dados'),
})
