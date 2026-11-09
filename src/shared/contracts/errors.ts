/** Envelope de erro da API e erro normalizado do cliente (SPEC §5.5). */

export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'USERNAME_TAKEN',
  'AVAILABILITY_CONFLICT',
  'QUOTE_STALE',
  'IDEMPOTENCY_KEY_REUSED',
  'WALLET_REJECTED',
  'WALLET_DISCONNECTED',
  'TEMPORARILY_UNAVAILABLE',
] as const

/** Códigos que a API devolve no envelope. */
export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

/**
 * Códigos que a UI pode receber: os da API, mais os gerados no cliente
 * (`NETWORK_ERROR` para rede e timeout; `UNKNOWN_ERROR` para resposta sem envelope).
 */
export type ErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'UNKNOWN_ERROR'

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
  details?: unknown
  retryable: boolean
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody
}

/** Todo erro que sai do cliente HTTP. A UI decide pelo `code`, nunca pelo texto. */
export class ApiError extends Error {
  override readonly name = 'ApiError'
  /** Status HTTP; 0 quando não houve resposta (rede ou timeout). */
  readonly status: number
  readonly code: ErrorCode
  readonly fieldErrors: Record<string, string>
  readonly details: unknown
  readonly retryable: boolean
  /** Do header `Retry-After` (503 `TEMPORARILY_UNAVAILABLE`), quando presente. */
  readonly retryAfterSeconds: number | undefined

  constructor(init: {
    status: number
    code: ErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: unknown
    retryable: boolean
    retryAfterSeconds?: number
  }) {
    super(init.message)
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors ?? {}
    this.details = init.details
    this.retryable = init.retryable
    this.retryAfterSeconds = init.retryAfterSeconds
  }
}

export function isApiError(error: unknown, code?: ErrorCode): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code)
}
