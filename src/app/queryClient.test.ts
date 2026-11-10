import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/contracts'

import { shouldRetryQuery } from './queryClient'

const networkError = new ApiError({
  status: 0,
  code: 'NETWORK_ERROR',
  message: 'rede',
  retryable: true,
})
const unavailable = new ApiError({
  status: 503,
  code: 'TEMPORARILY_UNAVAILABLE',
  message: 'fora',
  retryable: true,
})

describe('shouldRetryQuery (SPEC §11.2)', () => {
  it('tenta de novo uma vez em falha de rede e em 5xx retryable', () => {
    expect(shouldRetryQuery(0, networkError)).toBe(true)
    expect(shouldRetryQuery(0, unavailable)).toBe(true)
    expect(shouldRetryQuery(1, networkError)).toBe(false)
  })

  it('não tenta de novo em 5xx não retryable', () => {
    const crash = new ApiError({
      status: 500,
      code: 'UNKNOWN_ERROR',
      message: 'x',
      retryable: false,
    })
    expect(shouldRetryQuery(0, crash)).toBe(false)
  })

  it('nunca tenta de novo em 4xx, mesmo marcado como retryable', () => {
    const notFound = new ApiError({ status: 404, code: 'NOT_FOUND', message: 'x', retryable: true })
    expect(shouldRetryQuery(0, notFound)).toBe(false)
  })

  it('não tenta de novo em erro fora da API', () => {
    expect(shouldRetryQuery(0, new TypeError('bug'))).toBe(false)
  })
})
