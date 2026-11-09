/**
 * Cliente HTTP único da aplicação (SPEC §5.5, §6, §11.4).
 * Só transporte: injeta os tokens e normaliza erros em `ApiError`.
 * Sem lógica de negócio e sem respostas fictícias (quem simula a API é o MSW).
 */
import axios, { AxiosError, isCancel } from 'axios'

import { ApiError, isApiError, type ApiErrorEnvelope } from '@/shared/contracts'

import { tokenStore } from './tokenStore'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  const sessionToken = tokenStore.getSessionToken()
  const cartToken = tokenStore.getCartToken()
  if (sessionToken) config.headers.set('Authorization', `Bearer ${sessionToken}`)
  if (cartToken) config.headers.set('X-Cart-Token', cartToken)
  return config
})

type SessionExpiredHandler = (error: ApiError) => void
let sessionExpiredHandler: SessionExpiredHandler | null = null

/**
 * Registra quem reage a 401 `SESSION_EXPIRED` (o módulo auth). O erro continua sendo
 * rejeitado para quem fez a chamada. Devolve a função que desfaz o registro.
 */
export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  sessionExpiredHandler = handler
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null
  }
}

function isEnvelope(data: unknown): data is ApiErrorEnvelope {
  if (typeof data !== 'object' || data === null || !('error' in data)) return false
  const { error } = data
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

/** Converte qualquer falha do Axios em `ApiError`. Cancelamentos (signal) passam intactos. */
export function toApiError(error: unknown): unknown {
  // Cancelamento e erros de programação (fora do Axios) não viram falha de rede.
  if (isCancel(error) || !(error instanceof AxiosError)) return error

  if (!error.response) {
    // Requisição sem resposta: rede ou timeout. Sem `request`, foi erro de configuração.
    if (!error.request) return error
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Não foi possível falar com o servidor. Verifique sua conexão.',
      retryable: true,
    })
  }

  const { status, data, headers } = error.response
  const retryAfterSeconds = parseRetryAfter(headers['retry-after'])
  if (isEnvelope(data)) {
    return new ApiError({
      status,
      code: data.error.code,
      message: data.error.message,
      fieldErrors: data.error.fieldErrors,
      details: data.error.details,
      retryable: data.error.retryable === true,
      retryAfterSeconds,
    })
  }

  return new ApiError({
    status,
    code: 'UNKNOWN_ERROR',
    message: 'Algo deu errado. Tente novamente.',
    retryable: status >= 500,
    retryAfterSeconds,
  })
}

/** `Retry-After` em segundos ou data HTTP → segundos a esperar. */
function parseRetryAfter(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - Date.now()) / 1000))
}

http.interceptors.response.use(undefined, (error: unknown) => {
  const normalized = toApiError(error)
  if (isApiError(normalized, 'SESSION_EXPIRED') && normalized.status === 401) {
    sessionExpiredHandler?.(normalized)
  }
  return Promise.reject(normalized)
})
