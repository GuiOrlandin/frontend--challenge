import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

/** Logado, adiciona o nft_001 e entra no pagamento pelo carrinho. */
async function goToCheckout(page: Page) {
  await page.goto('/nft/nft_001')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/pagamento/)
}

test.describe('pagamento: dados do comprador', () => {
  test('vem preenchido, foca o primeiro erro e continua para a revisão', async ({
    page,
    loginAs,
  }) => {
    await loginAs('ana')
    await goToCheckout(page)

    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Ribeiro')
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
      '0x8f3a21c4b6d7e9f0a1b2c3d4e5f60718293a4b5c',
    )

    await page.getByLabel('Nome de usuário').fill('')
    await page.getByLabel('Código de indicação').fill('x')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByLabel('Nome de usuário')).toBeFocused()
    await expect(page.getByLabel('Código de indicação')).toHaveAttribute('aria-invalid', 'true')

    await page.getByLabel('Nome de usuário').fill('ana')
    await page.getByLabel('Código de indicação').fill('ANA2026')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page).toHaveURL(/step=revisao/)
  })

  test('trocar para a secundária repreenche com os dados dela', async ({ page, loginAs }) => {
    await loginAs('ana')
    await goToCheckout(page)

    await page
      .getByRole('button', { name: /^(Usar outra carteira\?|Trocar carteira)$/ })
      .filter({ visible: true })
      .click()
    await expect(page.getByLabel('Endereço da carteira')).toHaveValue(
      '0x1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5e6',
    )
    await expect(page.getByRole('radio', { name: 'WalletConnect' })).toBeChecked()
  })

  test('o rascunho sobrevive ao refresh e não vaza para outro usuário', async ({
    page,
    loginAs,
  }) => {
    await loginAs('ana')
    await goToCheckout(page)
    await page.getByLabel('Observação do colecionador (opcional)').fill('Embrulhar para presente')
    await page.getByRole('radio', { name: 'Coinbase Wallet' }).check()

    await page.reload()
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue(
      'Embrulhar para presente',
    )
    await expect(page.getByRole('radio', { name: 'Coinbase Wallet' })).toBeChecked()

    // Troca o token sem logout: o rascunho da Ana continua no sessionStorage.
    await loginAs('bruno')
    await goToCheckout(page)
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Tavares')
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('')
  })

  test('com o carrinho vazio volta ao carrinho', async ({ page, loginAs }) => {
    await loginAs('bruno')
    await page.goto('/pagamento')
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByText('Seu carrinho está vazio.', { exact: true })).toBeVisible()
  })
})
