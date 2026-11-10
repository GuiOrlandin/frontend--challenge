/** Fixtures comuns dos specs (SPEC §14.1). Importe `test` e `expect` daqui, não do Playwright. */
import { test as base, type Page } from '@playwright/test'

import type { MockControl } from '../src/mocks/control'
import { tokenStore } from '../src/shared/lib/tokenStore'

declare global {
  interface Window {
    __mock?: MockControl
  }
}

/** `window.__mock` do lado do teste: mesmos métodos, resultado em Promise. */
export type Mock = {
  [K in keyof MockControl]: (
    ...args: Parameters<MockControl[K]>
  ) => Promise<Awaited<ReturnType<MockControl[K]>>>
}

export const USERS = { ana: 'ana@kurio.dev', bruno: 'bruno@kurio.dev' } as const
const PASSWORD = 'Kurio@123'
export const SESSION_KEY = tokenStore.sessionKey

export const NOW = new Date('2026-07-29T12:00:00Z')

/** `window.__mock` só aparece depois que o worker do MSW já intercepta. */
const mockReady = (page: Page) => page.waitForFunction(() => window.__mock !== undefined)

export const test = base.extend<{
  mock: Mock
  loginAs: (user: keyof typeof USERS) => Promise<void>
}>({
  page: async ({ page }, use) => {
    await page.clock.install({ time: NOW })
    await use(page)
  },

  mock: async ({ page }, use) => {
    const mock = new Proxy({} as Mock, {
      // `then` indefinido: senão `await mock` trataria o proxy como Promise e travaria.
      get: (_, name: string) =>
        name === 'then'
          ? undefined
          : async (...args: unknown[]) => {
              await mockReady(page)
              return page.evaluate(
                ([method, params]) =>
                  (window.__mock![method as keyof MockControl] as (...a: unknown[]) => unknown)(
                    ...params,
                  ),
                [name, args] as const,
              )
            },
    })
    await use(mock)
  },

  /** Autentica pela API simulada, grava o token e recarrega já logado (o login pela UI é do `03-auth`). */
  loginAs: async ({ page }, use) => {
    await use(async (user) => {
      if (!page.url().startsWith('http')) await page.goto('/')
      await mockReady(page)
      await page.evaluate(
        async ({ email, password, key }) => {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          if (!res.ok) throw new Error(`login falhou: ${res.status}`)
          const { token } = (await res.json()) as { token: string }
          localStorage.setItem(key, token)
        },
        { email: USERS[user], password: PASSWORD, key: SESSION_KEY },
      )
      await page.reload()
    })
  },
})

export { expect } from '@playwright/test'
