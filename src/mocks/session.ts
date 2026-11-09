/** Sessão do mock (SPEC §6): token opaco no banco, 2 h absolutas, `requireUser` das rotas privadas. */
import type { Session } from '@/shared/contracts'

import { db } from './db'
import type { SessionRecord, UserRecord } from './fixtures'
import { apiError } from './respond'
import { sessionStatus, toHex } from './rules/account'
import { getActiveScenario } from './scenarios'

const SESSION_TTL_MS = 2 * 60 * 60 * 1000

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

export function toSession(user: UserRecord, session: SessionRecord): Session {
  const { id, username, displayName, email, avatarUrl } = user
  return { user: { id, username, displayName, email, avatarUrl }, expiresAt: session.expiresAt }
}

export function startSession(user: UserRecord): { token: string; session: Session } {
  const record: SessionRecord = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.mutate((data) => ({ ...data, sessions: [...data.sessions, record] }))
  return { token: record.token, session: toSession(user, record) }
}

export function endSession(request: Request) {
  const token = bearerToken(request)
  db.mutate((data) => ({ ...data, sessions: data.sessions.filter((s) => s.token !== token) }))
}

/** `window.__mock.expireSession()` e cenário `session-expired`: vence todas as sessões agora. */
export function expireSessions() {
  const now = new Date(Date.now()).toISOString()
  db.mutate((data) => ({
    ...data,
    sessions: data.sessions.map((session) => ({ ...session, expiresAt: now })),
  }))
}

/** Sessão do token, sem efeito de cenário (`GET /auth/session`). */
export function readSession(request: Request) {
  const token = bearerToken(request)
  const session = token ? db.data.sessions.find((s) => s.token === token) : undefined
  const user = session && db.data.users.find((u) => u.id === session.userId)
  const status = user ? sessionStatus(session, Date.now()) : 'missing'
  return { status, session, user }
}

export const unauthorized = (status: 'valid' | 'missing' | 'expired') =>
  status === 'expired'
    ? apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou, entre novamente.')
    : apiError(401, 'UNAUTHENTICATED', 'Entre para continuar.')

/** Rotas privadas: o Colecionador do token, ou 401 `UNAUTHENTICATED` / `SESSION_EXPIRED`. */
export function requireUser(request: Request): UserRecord | Response {
  const { status, user } = readSession(request)
  if (status !== 'valid' || !user) return unauthorized(status)

  // Uma vez por reset: senão o novo login também cairia na chamada seguinte.
  if (
    getActiveScenario().scenario.behavior?.kind === 'session-expired' &&
    !db.data.scenarioSessionExpired
  ) {
    const now = new Date(Date.now()).toISOString()
    db.mutate((data) => ({
      ...data,
      sessions: data.sessions.map((session) => ({ ...session, expiresAt: now })),
      scenarioSessionExpired: true,
    }))
    return unauthorized('expired')
  }
  return user
}

/** Salt aleatório por Colecionador (cadastro e troca de senha). */
export const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(8)))

/** Troca o registro do Colecionador e persiste; devolve o registro novo. */
export function updateUser(id: string, recipe: (user: UserRecord) => UserRecord): UserRecord {
  db.mutate((data) => ({
    ...data,
    users: data.users.map((user) => (user.id === id ? recipe(user) : user)),
  }))
  return db.data.users.find((user) => user.id === id)!
}
