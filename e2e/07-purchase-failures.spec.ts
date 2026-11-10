import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

/** Cenário ativo, Ana logada, nft_001 no carrinho e revisão aberta com a Conexão pronta. */
async function goToReview(page: Page, loginAs: (user: 'ana') => Promise<void>, scenario: string) {
  await page.goto(`/?scenario=${scenario}`)
  await loginAs('ana')
  await page.goto('/nft/nft_001')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/step=revisao/)
}

const confirmButton = (page: Page) => page.getByRole('button', { name: 'Confirmar compra' })

/** Captura o `Idempotency-Key` de cada `POST /api/orders`. */
function trackOrderPosts(page: Page) {
  const keys: (string | undefined)[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders') {
      keys.push(request.headers()['idempotency-key'])
    }
  })
  return keys
}

test('clique repetido em "Confirmar compra" envia um pedido só', async ({ page, loginAs }) => {
  await goToReview(page, loginAs, 'default')
  const keys = trackOrderPosts(page)

  await expect(confirmButton(page)).toBeEnabled()
  await confirmButton(page).dblclick()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
  expect(keys).toHaveLength(1)
})

test('order-timeout verifica o pedido e reenvia com a mesma chave', async ({ page, loginAs }) => {
  // O timeout de 10 s do Axios corre em tempo real.
  test.setTimeout(60_000)
  await goToReview(page, loginAs, 'order-timeout')
  const keys = trackOrderPosts(page)

  await confirmButton(page).click()
  await expect(confirmButton(page)).toBeDisabled()
  await expect(page.getByText('Verificando seu pedido…')).toBeVisible({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/, { timeout: 30_000 })
  expect(keys.length).toBeGreaterThan(1)
  expect(new Set(keys).size).toBe(1)
})

test('wallet-rejected avisa e bloqueia a compra', async ({ page, loginAs }) => {
  await goToReview(page, loginAs, 'wallet-rejected')

  await expect(page.getByText('Conexão recusada na carteira')).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()
  await page.getByRole('button', { name: 'Tentar de novo' }).click()
  await expect(page.getByText('Conexão recusada na carteira')).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()
})

test('wallet-disconnected pede para reconectar e conclui sem perder dados', async ({
  page,
  loginAs,
}) => {
  await goToReview(page, loginAs, 'wallet-disconnected')

  await confirmButton(page).click()
  await expect(
    page.getByText('A carteira desconectou. Conecte de novo para continuar.'),
  ).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()

  await page.getByRole('button', { name: 'Reconectar' }).click()
  await expect(confirmButton(page)).toBeEnabled()
  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
})

test('refresh antes do pedido retoma a tentativa com a mesma chave', async ({ page, loginAs }) => {
  test.setTimeout(60_000)
  await goToReview(page, loginAs, 'order-timeout')
  const keys = trackOrderPosts(page)

  await confirmButton(page).click()
  await expect(confirmButton(page)).toBeDisabled()
  // O refresh corta a resposta antes do `orderId`; a retomada reenvia com a chave guardada.
  await page.reload()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/, { timeout: 30_000 })
  expect(new Set(keys).size).toBe(1)
})
