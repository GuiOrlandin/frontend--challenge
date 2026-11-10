import { expect, NOW, SESSION_KEY, test, USERS } from './fixtures'

test('abre o início com o mock ligado e o relógio fixo', async ({ page, mock }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  expect(await mock.scenario()).toBe('default')
  const now = await page.evaluate(() => Date.now())
  expect(now - NOW.getTime()).toBeGreaterThanOrEqual(0)
  expect(now - NOW.getTime()).toBeLessThan(60_000)
})

test('rota inexistente mostra o 404', async ({ page }) => {
  await page.goto('/nao-existe')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeAttached()
  await expect(page.getByRole('link', { name: 'Voltar para o início' })).toBeVisible()
})

test('loginAs entra pela API', async ({ page, loginAs }) => {
  await loginAs('ana')
  const email = await page.evaluate(async (key) => {
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${localStorage.getItem(key)}` },
    })
    return res.ok ? ((await res.json()) as { user: { email: string } }).user.email : res.status
  }, SESSION_KEY)
  expect(email).toBe(USERS.ana)
})
