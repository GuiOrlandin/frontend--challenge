/** Respostas no formato da API (envelope de erro da SPEC §5.5). */
import { HttpResponse } from 'msw'

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
