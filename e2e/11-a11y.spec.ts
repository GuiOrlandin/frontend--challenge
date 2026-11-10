import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

/** As 6 telas principais (SPEC §14.1), com o elemento que confirma que cada uma carregou. */
const SCREENS = [
  { name: 'Início', path: '/', ready: { role: 'list', name: 'NFTs' } },
  { name: 'Detalhe', path: '/nft/nft_001', ready: { role: 'button', name: 'Favoritar' } },
  { name: 'Carrinho', path: '/carrinho', ready: { role: 'heading', name: 'Carrinho de NFTs' } },
  { name: 'Pagamento', path: '/pagamento', ready: { role: 'button', name: 'Continuar' } },
  { name: 'Perfil', path: '/perfil', ready: { role: 'heading', name: 'Perfil do colecionador' } },
  { name: 'Carteiras', path: '/perfil/carteiras', ready: { role: 'heading', name: 'Carteiras' } },
] as const

/** Logado com o nft_001 no carrinho: assim Carrinho e Pagamento têm conteúdo. */
async function prepare(page: Page, loginAs: (user: 'ana') => Promise<void>) {
  await loginAs('ana')
  await page.goto('/nft/nft_001')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

async function open(page: Page, screen: (typeof SCREENS)[number]) {
  await page.goto(screen.path)
  await expect(
    page
      .getByRole(screen.ready.role, { name: screen.ready.name, exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible()
}

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test('axe sem violações serious/critical e sem overflow horizontal nas 6 telas', async ({
  page,
  loginAs,
}) => {
  test.setTimeout(90_000)
  await prepare(page, loginAs)
  for (const screen of SCREENS) {
    await open(page, screen)
    const { violations } = await new AxeBuilder({ page }).analyze()
    const blocking = violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
    expect(blocking, screen.name).toEqual([])
    expect(await horizontalOverflow(page), screen.name).toBe(0)
  }
})

// 720 = 1440 com zoom de 200% (SPEC §13.5); 768 = tablet (SPEC §14.1).
for (const width of [720, 768]) {
  test(`sem overflow horizontal a ${width} px nas 6 telas`, async ({ page, loginAs, isMobile }) => {
    test.skip(isMobile, 'checagem única por largura, fora dos dois projetos')
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 1024 })
    await prepare(page, loginAs)
    for (const screen of SCREENS) {
      await open(page, screen)
      expect(await horizontalOverflow(page), screen.name).toBe(0)
    }
  })
}

test('cada rota tem título e descrição próprios', async ({ page, loginAs }) => {
  await prepare(page, loginAs)
  const titles = new Set<string>()
  for (const screen of SCREENS) {
    await open(page, screen)
    await expect(page).toHaveTitle(/Kurio/)
    await expect(page.locator('meta[name="description"]')).toHaveCount(1)
    titles.add(await page.title())
  }
  expect(titles.size).toBe(SCREENS.length)
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
})

test('"Pular para o conteúdo" é o primeiro foco e leva ao conteúdo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('list', { name: 'NFTs' })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

test('teclado: do catálogo ao carrinho sem mouse', async ({ page }) => {
  await page.goto('/')
  const card = page.getByRole('list', { name: 'NFTs' }).getByRole('link').first()
  await card.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/nft\//)
  await page.getByRole('button', { name: 'Comprar' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
})

test('AuthDialog prende o foco, fecha com Esc e devolve o foco ao gatilho', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('main').getByRole('button', { name: 'Favoritar' }).first()
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await expect(dialog).toBeVisible()

  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('erros do login ficam associados aos campos', async ({ page }) => {
  await page.goto('/?auth=entrar')
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  const email = dialog.getByLabel('E-mail')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).not.toHaveAccessibleDescription('')
  await expect(email).toBeFocused()
})

test('Sheet de filtros prende o foco, fecha com Esc e devolve o foco', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'filtros em Sheet só abaixo de lg')
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Abrir filtros' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const sheet = page.getByRole('dialog', { name: 'Filtros' })
  await expect(sheet).toBeVisible()

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('prefers-reduced-motion: diálogo abre sem animação', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?auth=entrar')
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await expect(dialog).toBeVisible()
  const seconds = await dialog.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))
  expect(seconds).toBeLessThan(0.001)
})
