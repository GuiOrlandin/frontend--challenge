import type { Locator, Page } from '@playwright/test'

import { expect, test } from './fixtures'

/** Títulos que a API devolve para a mesma consulta: o que a grade deve mostrar. */
async function apiTitles(page: Page, query: string): Promise<string[]> {
  return page.evaluate(async (q) => {
    const res = await fetch(`/api/nfts?${q}`)
    const body = (await res.json()) as { items: { title: string }[] }
    return body.items.map((nft) => nft.title)
  }, query)
}

const grid = (page: Page) => page.getByRole('list', { name: 'NFTs' })
const cardTitles = (page: Page) => grid(page).getByRole('heading')

async function expectGrid(page: Page, query: string) {
  await expect(cardTitles(page)).toHaveText(await apiTitles(page, query))
}

/** Barra lateral no desktop; Sheet aberto pelo botão ao lado da busca no mobile. */
async function openFilters(page: Page, isMobile: boolean): Promise<Locator> {
  if (!isMobile) return page.getByRole('complementary', { name: 'Filtros' })
  await page.getByRole('button', { name: 'Abrir filtros' }).click()
  return page.getByRole('dialog', { name: 'Filtros' })
}

async function closeFilters(page: Page, isMobile: boolean) {
  if (!isMobile) return
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeHidden()
}

async function search(page: Page, isMobile: boolean, text: string) {
  if (isMobile) {
    await page.getByRole('searchbox', { name: 'Buscar no catálogo' }).fill(text)
  } else {
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill(text)
    await page.keyboard.press('Enter')
  }
}

test('lista a primeira página com os mais recentes', async ({ page }) => {
  await page.goto('/')
  await expect(cardTitles(page)).toHaveCount(9)
  await expect(cardTitles(page).first()).toHaveText('Emerald Ape #042')
  await expectGrid(page, '')
})

test('busca filtra o catálogo e vai para a URL', async ({ page, isMobile }) => {
  await page.goto('/')
  await expect(grid(page)).toBeVisible()
  await search(page, isMobile, 'Nomad')
  await expect(page).toHaveURL(/q=(%22)?Nomad/)
  await expectGrid(page, 'q=Nomad')
  await expect(cardTitles(page).first()).toContainText('Nomad')
})

test('combina categoria e rede, uma de cada, e desfaz pelo mesmo botão', async ({
  page,
  isMobile,
}) => {
  await page.goto('/')
  await expect(grid(page)).toBeVisible()
  const panel = await openFilters(page, isMobile)
  await expect(panel.getByRole('button', { name: /^Solana/ })).toContainText('(9)')
  await panel.getByRole('button', { name: /^Arte digital/ }).click()
  // Contagens reativas: nenhum Nft de Arte digital está em Solana.
  await expect(panel.getByRole('button', { name: /^Solana/ })).toContainText('(0)')
  await panel.getByRole('button', { name: /^Ethereum/ }).click()
  await expect(panel.getByRole('button', { name: /^Ethereum/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page).toHaveURL(/category=.*arte-digital.*network=.*ethereum/)
  await closeFilters(page, isMobile)
  await expectGrid(page, 'category=arte-digital&network=ethereum')

  const again = await openFilters(page, isMobile)
  await again.getByRole('button', { name: /^Ethereum/ }).click()
  await expect(page).not.toHaveURL(/network=/)
  // Uma coleção por vez: escolher outra substitui a atual.
  await again.getByRole('button', { name: /^Música/ }).click()
  await expect(page).toHaveURL(/category=.*musica/)
  await expect(page).not.toHaveURL(/arte-digital/)
  await expect(again.getByRole('button', { name: /^Arte digital/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await closeFilters(page, isMobile)
  await expectGrid(page, 'category=musica')
})

test('faixa de preço aplica os limites escolhidos', async ({ page, isMobile }) => {
  await page.goto('/')
  await expect(grid(page)).toBeVisible()
  const panel = await openFilters(page, isMobile)
  await panel.getByRole('slider', { name: 'Preço máximo' }).focus()
  // Do teto (12.30) para 1.00 ETH: 1.130 passos de 1 centavo, 10 por PageDown.
  for (let i = 0; i < 113; i++) await page.keyboard.press('PageDown')
  await expect(panel.getByText('Preço: 0.02 – 1.00 ETH')).toBeVisible()
  await panel.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page).toHaveURL(/priceMax=/)
  await closeFilters(page, isMobile)
  await expectGrid(page, 'priceMax=1.00')
})

test('ordena por menor preço', async ({ page, isMobile }) => {
  await page.goto('/')
  await expect(grid(page)).toBeVisible()
  // No mobile a ordenação fica no Sheet de filtros.
  if (isMobile) await openFilters(page, isMobile)
  await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await page.getByRole('option', { name: 'Menor preço' }).click()
  await expect(page).toHaveURL(/sort=price_asc/)
  await closeFilters(page, isMobile)
  await expectGrid(page, 'sort=price_asc')
  await expect(grid(page).getByRole('listitem').first()).toContainText('0.02 ETH')
})

test('abas trocam o recorte do catálogo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Em alta' }).click()
  const tabs = page.getByRole('navigation', { name: 'Abas do catálogo' })
  await expect(tabs.getByRole('link', { name: 'Em alta' })).toHaveAttribute('aria-current', 'page')
  await expect(tabs.getByRole('link', { name: 'Todos os NFTs' })).not.toHaveAttribute(
    'aria-current',
  )
  await expectGrid(page, 'tab=trending')
})

test('paginação entra no histórico, e mudar filtro volta à página 1', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page)).toBeVisible()
  const firstPage = await apiTitles(page, '')

  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expectGrid(page, 'page=2')
  const pagination = page.getByRole('navigation', { name: 'Paginação' })
  await expect(pagination.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(pagination.getByRole('link', { name: 'Página 1' })).not.toHaveAttribute(
    'aria-current',
  )

  await page.goBack()
  await expect(page).not.toHaveURL(/page=/)
  await expect(cardTitles(page)).toHaveText(firstPage)

  await page.goForward()
  await expect(page).toHaveURL(/page=2/)
  await expectGrid(page, 'page=2')

  await page.getByRole('link', { name: 'Novos lançamentos' }).click()
  await expect(page).toHaveURL(/tab=new/)
  await expect(page).not.toHaveURL(/page=/)
  await expectGrid(page, 'tab=new')
})

test('busca sem resultado mostra o vazio, e "Limpar filtros" volta ao catálogo', async ({
  page,
}) => {
  await page.goto('/?q=zzzz')
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  await page.getByRole('link', { name: 'Limpar filtros' }).click()
  await expect(cardTitles(page)).toHaveCount(9)
})

test('empty: catálogo vazio mostra o estado vazio', async ({ page }) => {
  await page.goto('/?scenario=empty')
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
})

test('out-of-order: a resposta atrasada da busca anterior não cobre a atual', async ({ page }) => {
  await page.goto('/?scenario=out-of-order')
  await expect(grid(page)).toBeVisible()
  // As duas buscas saem em sequência; a mais antiga responde depois da mais nova.
  await page.getByRole('link', { name: 'Novos lançamentos' }).click()
  await page.getByRole('link', { name: 'Em alta' }).click()
  await expect(page).toHaveURL(/tab=trending/)
  const trending = await apiTitles(page, 'tab=trending')
  await expect(cardTitles(page)).toHaveText(trending)
  // Passado o tempo em que a busca antiga responderia, a grade continua na atual.
  await page.waitForTimeout(1_500)
  await expect(cardTitles(page)).toHaveText(trending)
})

test('mobile: botão central da barra inferior abre os filtros', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'A barra inferior só existe no mobile')
  await page.goto('/?tab=trending')
  const navFilters = page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Filtros' })
  const sheet = page.getByRole('dialog', { name: 'Filtros' })

  // Fechar logo depois de abrir pela barra não reabre o Sheet.
  await navFilters.click()
  await expect(sheet).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(page).not.toHaveURL(/#filtros/)

  await navFilters.click()
  await expect(sheet).toBeVisible()
  await sheet.getByRole('button', { name: /^Música/ }).click()
  // Filtrar não fecha o Sheet, e a aba atual continua na URL.
  await expect(page).toHaveURL(/category=.*musica/)
  await expect(page).toHaveURL(/tab=trending/)
  await expect(sheet).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})

test.describe('hero e destaque', () => {
  const hero = (page: Page) => page.getByRole('region', { name: 'Destaques' })

  test('carrossel troca a arte pelos pontos e pelas setas do teclado', async ({ page }) => {
    await page.goto('/')
    const dots = hero(page).getByRole('button', { name: /^Mostrar destaque/ })
    await expect(dots).toHaveCount(3)
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
    await expect(hero(page).getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()

    await dots.nth(1).click()
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect(hero(page).getByRole('link', { name: 'Neon Vessel #552' })).toBeVisible()

    await dots.nth(1).focus()
    await page.keyboard.press('ArrowRight')
    await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
    await expect(hero(page).getByRole('link', { name: 'Golden Beat #207' })).toBeVisible()
    // As artes fora da tela ficam fora do foco e da leitura (`inert`).
    await expect(hero(page).getByRole('group', { name: '1 de 3' })).toHaveAttribute('inert')
    await expect(hero(page).getByRole('group', { name: '3 de 3' })).not.toHaveAttribute('inert')
  })

  test('destaque leva ao detalhe do Nft', async ({ page, isMobile }) => {
    test.skip(isMobile, 'O destaque fica na coluna dos filtros, só no desktop')
    await page.goto('/')
    const spotlight = page.getByRole('region', { name: 'NFT em destaque' })
    await spotlight.getByRole('link', { name: 'Sage Nomad #009' }).click()
    await expect(page).toHaveURL(/\/nft\/nft_002$/)
  })

  test('empty: sem artes nem destaque, e o texto do hero continua', async ({ page }) => {
    await page.goto('/?scenario=empty')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Seja dono d/i })).toBeVisible()
    await expect(hero(page).getByRole('button', { name: /^Mostrar destaque/ })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'NFT em destaque' })).toHaveCount(0)
  })

  test('carregar a Início não desloca o layout (CLS ≈ 0)', async ({ page }) => {
    await page.goto('/')
    await expect(grid(page)).toBeVisible()
    await expect(hero(page).getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & {
              value: number
              hadRecentInput: boolean
            })[]) {
              if (!entry.hadRecentInput) total += entry.value
            }
          }).observe({ type: 'layout-shift', buffered: true })
          setTimeout(() => resolve(total), 500)
        }),
    )
    expect(cls).toBeLessThan(0.1)
  })
})
