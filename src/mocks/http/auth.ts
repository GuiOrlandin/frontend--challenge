/** Cadastro, login, logout e sessão (SPEC §5.3, §6). */
import { http, HttpResponse } from 'msw'

import { loginSchema, registerSchema, type AuthResponse } from '@/shared/contracts'

import { db } from '../db'
import type { UserRecord } from '../fixtures'
import { api, apiError, noContent, readJson, validate } from '../respond'
import { findAccountConflict, hashPassword, verifyPassword } from '../rules/account'
import { endSession, newSalt, readSession, startSession, toSession, unauthorized } from '../session'

/** 409 com o erro no campo que conflita (cadastro e Perfil). */
export const accountConflict = (code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN') =>
  code === 'EMAIL_TAKEN'
    ? apiError(409, code, 'E-mail já cadastrado.', {
        fieldErrors: { email: 'Este e-mail já está em uso' },
      })
    : apiError(409, code, 'Nome de usuário já cadastrado.', {
        fieldErrors: { username: 'Este nome de usuário já está em uso' },
      })

export const authHandlers = [
  http.post(api('/auth/register'), async ({ request }) => {
    const input = validate(registerSchema, await readJson(request))
    if (input instanceof Response) return input
    const conflict = findAccountConflict(db.data.users, input)
    if (conflict) return accountConflict(conflict)

    const salt = newSalt()
    const user: UserRecord = {
      id: `usr_${db.data.users.length + 1}`,
      username: input.username,
      displayName: input.displayName,
      email: input.email,
      ensName: '',
      alias: '',
      profileVersion: 1,
      salt,
      passwordHash: await hashPassword(salt, input.password),
      wallets: [],
      favoriteNftIds: [],
    }
    db.mutate((data) => ({ ...data, users: [...data.users, user] }))
    return HttpResponse.json<AuthResponse>(startSession(user), { status: 201 })
  }),

  http.post(api('/auth/login'), async ({ request }) => {
    const input = validate(loginSchema, await readJson(request))
    if (input instanceof Response) return input
    const email = input.email.toLowerCase()
    const user = db.data.users.find((u) => u.email.toLowerCase() === email)
    if (!user || !(await verifyPassword(user, input.password))) {
      return apiError(401, 'UNAUTHENTICATED', 'E-mail ou senha incorretos.')
    }
    return HttpResponse.json<AuthResponse>(startSession(user))
  }),

  http.post(api('/auth/logout'), ({ request }) => {
    endSession(request)
    return noContent()
  }),

  http.get(api('/auth/session'), ({ request }) => {
    const { status, session, user } = readSession(request)
    return status === 'valid' && session && user
      ? HttpResponse.json(toSession(user, session))
      : unauthorized(status)
  }),
]
