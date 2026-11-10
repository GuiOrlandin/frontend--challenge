import { QueryClient } from '@tanstack/react-query'
import { http as mswHttp, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Session } from '@/shared/contracts'
import { http } from '@/shared/lib/http'
import { tokenStore } from '@/shared/lib/tokenStore'

import { sessionQueries } from './queries'

const ORIGIN = 'http://api.test'
const session: Session = {
  user: { id: 'u1', username: 'ana', displayName: 'Ana', email: 'ana@kurio.dev' },
  expiresAt: '2026-07-29T14:00:00.000Z',
}
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  http.defaults.baseURL = ORIGIN
})
afterAll(() => server.close())
beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  })
})
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllGlobals()
})

const readSession = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } }).query(sessionQueries.current())

describe('sessionQueries.current (SPEC §6, boot)', () => {
  it('sem token é Visitante, sem chamar a API', async () => {
    await expect(readSession()).resolves.toBeNull()
  })

  it('com token válido devolve a sessão', async () => {
    tokenStore.setSessionToken('t1')
    server.use(
      mswHttp.get(`${ORIGIN}/auth/session`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer t1'
          ? HttpResponse.json(session)
          : new HttpResponse(null, { status: 400 }),
      ),
    )
    await expect(readSession()).resolves.toEqual(session)
  })

  it('401 apaga o token e segue como Visitante, sem erro', async () => {
    tokenStore.setSessionToken('velho')
    server.use(
      mswHttp.get(`${ORIGIN}/auth/session`, () =>
        HttpResponse.json(
          { error: { code: 'SESSION_EXPIRED', message: 'expirou', retryable: false } },
          { status: 401 },
        ),
      ),
    )
    await expect(readSession()).resolves.toBeNull()
    expect(tokenStore.getSessionToken()).toBeNull()
  })

  it('outras falhas continuam sendo erro e mantêm o token', async () => {
    tokenStore.setSessionToken('t1')
    server.use(mswHttp.get(`${ORIGIN}/auth/session`, () => new HttpResponse(null, { status: 500 })))
    await expect(readSession()).rejects.toMatchObject({ status: 500 })
    expect(tokenStore.getSessionToken()).toBe('t1')
  })
})
