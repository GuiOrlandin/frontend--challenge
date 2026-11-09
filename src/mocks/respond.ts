/** Respostas no formato da API (envelope de erro da SPEC §5.5). */
import { HttpResponse } from 'msw'
import type { z } from 'zod'

import { API_BASE_URL } from '@/shared/lib/http'
import type { ApiErrorBody, ApiErrorCode, ApiErrorEnvelope } from '@/shared/contracts'

export const api = (path: string) => `${API_BASE_URL}${path}`

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra: Partial<Omit<ApiErrorBody, 'code' | 'message'>> & { headers?: HeadersInit } = {},
) {
  const { headers, retryable = status >= 500, ...rest } = extra
  return HttpResponse.json<ApiErrorEnvelope>(
    { error: { code, message, retryable, ...rest } },
    { status, headers },
  )
}

/** Valida com o schema de `shared/contracts`; falha → 422 com a primeira mensagem por campo. */
export function validate<T extends z.ZodType>(schema: T, value: unknown): z.output<T> | Response {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues)
    fieldErrors[issue.path.join('.') || 'form'] ??= issue.message
  return apiError(422, 'VALIDATION_FAILED', 'Verifique os campos destacados.', { fieldErrors })
}

/** Corpo JSON da requisição; inválido vira `undefined` (e o schema reprova). */
export const readJson = (request: Request): Promise<unknown> =>
  request.json().catch(() => undefined)

export const noContent = () => new HttpResponse(null, { status: 204 })
