/**
 * Tentativa de envio do pedido em `sessionStorage` (SPEC §8.4, §8.6): a chave de idempotência
 * nasce no primeiro clique e sobrevive ao refresh. O logout apaga todas as chaves `kurio-`.
 */
export const ATTEMPT_KEY = 'kurio-checkout-attempt'

export interface CheckoutAttempt {
  userId: string
  quoteId: string
  key: string
  orderId?: string
}

export function parseAttempt(raw: string | null, userId: string): CheckoutAttempt | null {
  try {
    const attempt = raw ? (JSON.parse(raw) as CheckoutAttempt) : null
    return attempt?.userId === userId && attempt.quoteId && attempt.key ? attempt : null
  } catch {
    return null
  }
}

export function readAttempt(userId: string) {
  try {
    return parseAttempt(sessionStorage.getItem(ATTEMPT_KEY), userId)
  } catch {
    return null
  }
}

export function writeAttempt(attempt: CheckoutAttempt) {
  try {
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt))
  } catch {
    // Storage bloqueado: o envio segue, só não há retomada após refresh.
  }
}

export function clearAttempt() {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY)
  } catch {
    // Storage bloqueado: nada a apagar.
  }
}

/** Mesma Cotação reaproveita a chave; Cotação nova (atualizada ou `QUOTE_STALE`) ganha outra. */
export function attemptFor(userId: string, quoteId: string, saved: CheckoutAttempt | null) {
  return saved && saved.quoteId === quoteId && !saved.orderId
    ? saved
    : { userId, quoteId, key: crypto.randomUUID() }
}
