import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

/** Os timers dos cenários disparam "alguns segundos" depois de abrir a tela (mock). */
const SCENARIO_EVENT_DELAY_MS = 4000

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

test('price-change na revisão mostra a diferença e exige atualizar a cotação', async ({
  page,
  loginAs,
}) => {
  await goToReview(page, loginAs, 'price-change')
  await expect(confirmButton(page)).toBeEnabled()

  await page.clock.fastForward(SCENARIO_EVENT_DELAY_MS)
  await expect(page.getByText('A cotação mudou')).toBeVisible()
  await expect(page.getByText(/preço mudou de .* ETH para .* ETH/)).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()

  await page.getByRole('button', { name: 'Atualizar cotação' }).click()
  await expect(page.getByText('A cotação mudou')).toBeHidden()
  await expect(confirmButton(page)).toBeEnabled()
  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
})

test('sold-out na revisão bloqueia a compra e manda ajustar o carrinho', async ({
  page,
  loginAs,
}) => {
  await goToReview(page, loginAs, 'sold-out')
  await expect(confirmButton(page)).toBeEnabled()

  await page.clock.fastForward(SCENARIO_EVENT_DELAY_MS)
  await expect(page.getByText('A cotação mudou')).toBeVisible()
  await expect(page.getByText(/esgotado/)).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()

  await page.getByRole('button', { name: 'Atualizar cotação' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  // O carrinho repete o texto no aviso da linha bloqueada; aqui interessa o toast.
  await expect(
    page
      .getByRole('region', { name: /Notifications/ })
      .getByText('Ajuste ou remova os itens indisponíveis para continuar.'),
  ).toBeVisible()
})
