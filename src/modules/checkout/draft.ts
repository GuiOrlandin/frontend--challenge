/**
 * Rascunho do passo "dados" em `sessionStorage` (SPEC §6, §8.1). Guarda o `userId` e só volta
 * para o mesmo usuário; o logout apaga todas as chaves `kurio-`.
 */
import { WALLET_PROVIDERS, type WalletProvider } from '@/shared/contracts'

export const DRAFT_KEY = 'kurio-checkout-draft'

export interface CheckoutDraft {
  userId: string
  walletId: string
  provider: WalletProvider
  /** Campos do `BuyerForm` como digitados (ENS sem `.eth`). */
  values: Record<string, string>
}

export function parseDraft(raw: string | null, userId: string): CheckoutDraft | null {
  try {
    const draft = raw ? (JSON.parse(raw) as CheckoutDraft) : null
    return draft?.userId === userId && WALLET_PROVIDERS.includes(draft.provider) ? draft : null
  } catch {
    return null
  }
}

export function readDraft(userId: string) {
  try {
    return parseDraft(sessionStorage.getItem(DRAFT_KEY), userId)
  } catch {
    return null
  }
}

export function writeDraft(draft: CheckoutDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Storage cheio ou bloqueado: o formulário segue funcionando sem rascunho.
  }
}
