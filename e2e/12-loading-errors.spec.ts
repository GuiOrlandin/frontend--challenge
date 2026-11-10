import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

const grid = (page: Page) => page.getByRole('list', { name: 'NFTs' })
const gridError = (page: Page) =>
  page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs' })

test('slow: skeleton enquanto o catálogo carrega', async ({ page }) => {
  await page.goto('/?scenario=slow')
  await expect(page.getByText('Carregando NFTs…')).toBeAttached()
  await expect(grid(page)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Carregando NFTs…')).toHaveCount(0)
})

test('flaky: erro com "Tentar novamente", e a nova tentativa carrega', async ({ page }) => {
  await page.goto('/?scenario=flaky')
  await expect(gridError(page)).toBeVisible()
  await gridError(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(grid(page)).toBeVisible()
})

test('offline: erro de rede no catálogo, sem tela quebrada', async ({ page }) => {
  await page.goto('/?scenario=offline')
  await expect(gridError(page)).toBeVisible()
  await expect(gridError(page)).toContainText('Verifique sua conexão')
  await gridError(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(gridError(page)).toBeVisible()
})
