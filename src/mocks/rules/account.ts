/** Regras puras de conta do mock (SPEC §6): senha, unicidade, carteira por role, sessão. */
import type { ApiErrorCode, Wallet, WalletRole } from '@/shared/contracts'

import type { SessionRecord, UserRecord } from '../fixtures/users'

export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

/** SHA-256(salt + senha) em hex. Sem PBKDF2, por custo nos testes (SPEC §6). */
export async function hashPassword(salt: string, password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password))
  return toHex(new Uint8Array(digest))
}

export async function verifyPassword(
  user: Pick<UserRecord, 'salt' | 'passwordHash'>,
  password: string,
): Promise<boolean> {
  return (await hashPassword(user.salt, password)) === user.passwordHash
}

/** E-mail (sem diferenciar maiúsculas) ou nome de usuário já usado por outro Colecionador. */
export function findAccountConflict(
  users: readonly UserRecord[],
  candidate: { email: string; username: string },
  exceptUserId?: string,
): Extract<ApiErrorCode, 'EMAIL_TAKEN' | 'USERNAME_TAKEN'> | null {
  const others = users.filter((user) => user.id !== exceptUserId)
  const email = candidate.email.toLowerCase()
  if (others.some((user) => user.email.toLowerCase() === email)) return 'EMAIL_TAKEN'
  if (others.some((user) => user.username === candidate.username)) return 'USERNAME_TAKEN'
  return null
}

/** No máximo uma Carteira por `role`. */
export function walletRoleTaken(wallets: readonly { role: WalletRole }[], role: WalletRole) {
  return wallets.some((wallet) => wallet.role === role)
}

/** Principal e secundária não repetem Apelido nem Endereço (SPEC §9, "Igual à carteira principal"). */
export function walletClash(
  wallets: readonly Wallet[],
  candidate: Pick<Wallet, 'role' | 'label' | 'address'>,
): Record<string, string> | null {
  const other = wallets.find((wallet) => wallet.role !== candidate.role)
  if (!other) return null
  const otherName = other.role === 'primary' ? 'carteira principal' : 'carteira secundária'
  const errors: Record<string, string> = {}
  if (other.label === candidate.label) errors.label = `Use um apelido diferente da ${otherName}`
  if (other.address === candidate.address) {
    errors.address = `Use um endereço diferente da ${otherName}`
  }
  return Object.keys(errors).length ? errors : null
}

export function sessionStatus(
  session: SessionRecord | undefined,
  now: number,
): 'valid' | 'expired' | 'missing' {
  if (!session) return 'missing'
  return Date.parse(session.expiresAt) > now ? 'valid' : 'expired'
}
