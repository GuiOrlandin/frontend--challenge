import type { Page } from '@playwright/test'

import type { Nft } from '../src/shared/contracts'

import { expect, test } from './fixtures'

/** Todos os Nfts da seed, pela API simulada (a fonte de verdade do que a tela mostra). */
async function allNfts(page: Page): Promise<Nft[]> {
  if (!page.url().startsWith('http')) await page.goto('/')
  await page.waitForFunction(() => window.__mock !== undefined)
  return page.evaluate(async () => {
    const res = await fetch('/api/nfts?pageSize=100')
    return ((await res.json()) as { items: Nft[] }).items
  })
}

const title = (page: Page) => page.getByRole('heading', { level: 1 })

test('acesso direto pela URL mostra o Nft', async ({ page, isMobile }) => {
  await page.goto('/nft/nft_001')
  await expect(title(page)).toHaveText('Emerald Ape #042')
  await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toContainText(
    'Início/Mercado',
  )
  await expect(page.getByText('1.19 ETH').filter({ visible: true }).first()).toBeVisible()
  // O frame mobile não tem as abas.
  if (isMobile) return
  await expect(page.getByRole('tab', { name: 'Avaliações de colecionadores' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
})

test('Nft inexistente mostra o 404', async ({ page }) => {
  await page.goto('/nft/nft_999')
  await expect(page.getByText('Erro 404')).toBeVisible()
})

test('card do catálogo leva ao detalhe', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('list', { name: 'NFTs' })
    .getByRole('link', { name: 'Sage Nomad #009', exact: true })
    .click()
  await expect(page).toHaveURL(/\/nft\/nft_002$/)
  await expect(title(page)).toHaveText('Sage Nomad #009')
})

test('edição esgotada fica visível e desabilitada', async ({ page }) => {
  const nft = (await allNfts(page)).find((n) => n.editions.some((e) => e.available === 0))
  const soldOut = nft?.editions.find((e) => e.available === 0)
  if (!nft || !soldOut) throw new Error('a seed não tem edição esgotada')

  await page.goto(`/nft/${nft.id}`)
  const radio = page.getByRole('radio', { name: soldOut.label })
  await expect(radio).toBeVisible()
  await expect(radio).toBeDisabled()
  await expect(page.getByRole('radiogroup')).toContainText('Esgotada')
})

test('quantidade limitada a min(disponível, máximo por pedido)', async ({ page }) => {
  const nft = (await allNfts(page)).find((n) => n.id === 'nft_001')!
  const edition = nft.editions.find((e) => e.id === nft.defaultEditionId)!
  const max = Math.min(edition.available, edition.maxPerOrder)

  await page.goto('/nft/nft_001')
  const input = page.getByRole('textbox', { name: 'Quantidade' })
  await input.fill('99')
  await input.press('Enter')
  await expect(input).toHaveValue(String(max))
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
})

test('lupa abre a arte ampliada num diálogo', async ({ page, isMobile }) => {
  test.skip(isMobile, 'o frame mobile não tem lupa')
  await page.goto('/nft/nft_001')
  await page.getByRole('button', { name: 'Ampliar imagem' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('preço novo pelo tempo real é aplicado e anunciado', async ({ page, mock }) => {
  await page.goto('/nft/nft_001')
  await expect(title(page)).toHaveText('Emerald Ape #042')
  const nft = (await allNfts(page)).find((n) => n.id === 'nft_001')!
  const editions = nft.editions.map((e, i) => (i === 0 ? { ...e, price: '2.5' } : e))
  // O socket conecta depois da página: repete o evento até ele chegar.
  await expect(async () => {
    await mock.updateNft('nft_001', { editions })
    await expect(
      page.getByText('2.50 ETH', { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible({
      timeout: 1_000,
    })
  }).toPass()
  await expect(page.getByRole('status').filter({ hasText: 'Preço atualizado' })).toContainText(
    '2.50 ETH',
  )
})

test('vitrine mostra a coleção sem o atual', async ({ page, isMobile }) => {
  test.skip(isMobile, 'o frame mobile não tem vitrines')
  await page.goto('/nft/nft_001')
  const collection = page.getByRole('region', { name: 'Mais desta coleção' })
  await expect(collection).toBeVisible()
  await expect(collection.getByRole('heading', { name: 'Emerald Ape #042' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Colecionadores também viram' })).toHaveCount(0)
})
