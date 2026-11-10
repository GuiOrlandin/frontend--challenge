import type { Page } from '@playwright/test'

import { expect, type Mock, test } from './fixtures'

const receiptHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })

/** Ana compra o nft_001 e para na página do pedido ainda `pending`; devolve o `orderId`. */
async function placeOrder(page: Page, loginAs: (user: 'ana') => Promise<void>) {
  await loginAs('ana')
  await page.goto('/nft/nft_001')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
  return new URL(page.url()).pathname.split('/').pop()!
}

/** `order.updated` de versão 1 (`pending`), mais velho que o pedido já decidido. */
function stalePending(mock: Mock, orderId: string, eventId: string) {
  return mock.emit({
    eventId,
    type: 'order.updated',
    resourceId: orderId,
    version: 1,
    occurredAt: '2026-07-29T12:00:00Z',
    data: {
      id: orderId,
      status: 'pending',
      quoteId: 'q',
      walletId: 'w',
      network: 'ethereum',
      createdAt: '2026-07-29T12:00:00Z',
      version: 1,
      lines: [],
      total: '0',
    },
  })
}

test('evento duplicado e antigo não tiram o recibo da tela', async ({ page, loginAs, mock }) => {
  const orderId = await placeOrder(page, loginAs)
  await expect(receiptHeading(page)).toBeVisible()

  await stalePending(mock, orderId, 'old-1')
  await stalePending(mock, orderId, 'old-1')
  await stalePending(mock, orderId, 'old-2')

  await expect(receiptHeading(page)).toBeVisible()
  await expect(page.getByText('Aguardando confirmação da rede…')).toBeHidden()
})

test('queda do socket com o pedido pendente ainda chega ao recibo', async ({
  page,
  loginAs,
  mock,
}) => {
  await placeOrder(page, loginAs)
  await expect(page.getByText('Aguardando confirmação da rede…')).toBeVisible()

  await mock.dropSocket()
  await expect(receiptHeading(page)).toBeVisible({ timeout: 15_000 })
})

test('refresh com o pedido pendente retoma e confirma', async ({ page, loginAs }) => {
  await placeOrder(page, loginAs)
  await expect(page.getByText('Aguardando confirmação da rede…')).toBeVisible()

  await page.reload()
  await expect(receiptHeading(page)).toBeVisible()
})
