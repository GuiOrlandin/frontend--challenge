import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

const favorite = (page: Page) =>
  page.getByRole('main').getByRole('button', { name: 'Favoritar' }).first()

test('Visitante é levado ao login', async ({ page }) => {
  await page.goto('/nft/nft_001')
  await favorite(page).click()
  await expect(page).toHaveURL(/auth=entrar/)
  await expect(page.getByText('Entre para favoritar')).toBeVisible()
})

test('favorita, persiste após recarregar e desfaz', async ({ page, loginAs }) => {
  await page.goto('/nft/nft_001')
  await loginAs('ana')
  const button = favorite(page)
  await expect(button).toBeEnabled()
  const initial = (await button.getAttribute('aria-pressed')) === 'true'
  // Parte sempre de "não favoritado", qualquer que seja a seed.
  if (initial) {
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  }

  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Adicionado aos favoritos')).toBeVisible()

  await page.reload()
  await expect(favorite(page)).toBeEnabled()
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'true')

  await favorite(page).click()
  await expect(favorite(page)).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('Removido dos favoritos')).toBeVisible()
})

test('falha na API desfaz o favorito e avisa', async ({ page, loginAs, mock }) => {
  await page.goto('/nft/nft_001')
  await loginAs('ana')
  const button = favorite(page)
  await expect(button).toBeEnabled()
  const before = await button.getAttribute('aria-pressed')

  await mock.failNext({ path: '/me/favorites/' })
  await button.click()
  await expect(page.getByText(/Não foi possível/)).toBeVisible()
  await expect(button).toHaveAttribute('aria-pressed', before!)
})

test('favorito também no card do catálogo', async ({ page, loginAs }) => {
  await page.goto('/')
  await loginAs('ana')
  const card = page.getByRole('list', { name: 'NFTs' }).getByRole('listitem').first()
  const button = card.getByRole('button', { name: 'Favoritar' })
  await expect(button).toBeEnabled()
  const before = (await button.getAttribute('aria-pressed')) === 'true'
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', String(!before))
})
