import type { Page } from '@playwright/test'

import type { Nft } from '../src/shared/contracts'

import { expect, SESSION_KEY, test, USERS } from './fixtures'

const TITLE = 'Emerald Ape #042'
const items = (page: Page) => page.getByRole('list', { name: 'Itens do carrinho' })
const line = (page: Page) => items(page).getByRole('listitem').filter({ hasText: TITLE })

/** Adiciona o nft_001 pela tela do detalhe ("Comprar" leva ao carrinho). */
async function buy(page: Page) {
  await page.goto('/nft/nft_001')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(line(page)).toBeVisible()
}

test('altera a quantidade e remove a linha', async ({ page }) => {
  await buy(page)
  await line(page).getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(line(page).getByRole('textbox', { name: `Quantidade de ${TITLE}` })).toHaveValue('2')
  await expect(line(page)).toContainText('2,38 ETH')
  await expect(page.getByRole('region', { name: 'Resumo da carteira' })).toContainText('2,38 ETH')

  await line(page)
    .getByRole('button', { name: `Remover ${TITLE}` })
    .click()
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
})

test('cupons: KURIO10 aplica, EXPIRADO e inválido dão erro no campo', async ({ page }) => {
  await buy(page)
  const summary = page.getByRole('region', { name: 'Resumo da carteira' })
  const field = summary.getByLabel('Código promocional')

  await field.fill('EXPIRADO')
  await summary.getByRole('button', { name: 'Aplicar' }).click()
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  await expect(field).toHaveAccessibleDescription('Este cupom expirou.')

  await field.fill('NAOEXISTE')
  await summary.getByRole('button', { name: 'Aplicar' }).click()
  await expect(field).toHaveAccessibleDescription('Cupom inválido.')

  await field.fill('KURIO10')
  await summary.getByRole('button', { name: 'Aplicar' }).click()
  await expect(summary.getByText('KURIO10')).toBeVisible()
  // 10% de 1,19 ETH.
  await expect(summary).toContainText('(-) 0,119 ETH')
})

test('o carrinho continua após recarregar', async ({ page }) => {
  await buy(page)
  await page.reload()
  await expect(line(page)).toBeVisible()
})

test('Visitante vai ao login antes do pagamento', async ({ page }) => {
  await buy(page)
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/auth=entrar/)
  await expect(page).toHaveURL(/redirect=%2Fpagamento/)
})

test('o login junta os carrinhos e avisa do ajuste pelo teto', async ({ page, loginAs }) => {
  await page.goto('/nft/nft_001')
  await loginAs('ana')
  // A conta já tem o teto da Edição padrão; o item do Visitante vai passar dele.
  await page.evaluate(async (key) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem(key)}`,
    }
    const nft = (await (await fetch('/api/nfts/nft_001')).json()) as Nft
    const edition = nft.editions.find((e) => e.id === nft.defaultEditionId)!
    const cap = Math.min(edition.available, edition.maxPerOrder)
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nftId: nft.id, editionId: edition.id, quantity: cap }),
    })
    if (!res.ok) throw new Error(`add falhou: ${res.status}`)
    localStorage.removeItem(key)
  }, SESSION_KEY)

  await buy(page)
  await page.goto('/carrinho?auth=entrar')
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByLabel('E-mail').fill(USERS.ana)
  await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@123')
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

  await expect(
    page.getByText(new RegExp(`Ajustamos a quantidade de ${TITLE} para \\d`)),
  ).toBeVisible()
  await expect(items(page).getByRole('listitem')).toHaveCount(1)
})

test('preço novo pelo tempo real é anunciado e destaca a linha', async ({ page, mock }) => {
  await buy(page)
  const nft = await page.evaluate(
    async () => (await (await fetch('/api/nfts/nft_001')).json()) as Nft,
  )
  const editions = nft.editions.map((e) =>
    e.id === nft.defaultEditionId ? { ...e, price: '2.5' } : e,
  )
  const announcement = page.getByRole('status').filter({ hasText: 'preço mudou' })
  // O socket conecta depois da página: repete o evento até ele chegar.
  await expect(async () => {
    await mock.updateNft('nft_001', { editions })
    await expect(announcement).toBeVisible({ timeout: 1_000 })
  }).toPass()
  await expect(announcement).toHaveText(`${TITLE}: preço mudou de 1,19 para 2,50 ETH`)
  await expect(line(page)).toContainText('2,50 ETH')
  await expect(line(page)).toHaveClass(/ring-primary/)
})
