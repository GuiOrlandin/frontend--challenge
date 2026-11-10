import { expect, test } from './fixtures'
import { open, prepare, SCREENS } from './screens'

/** Baselines visuais (SPEC §14.1): só na imagem Docker, via `pnpm test:visual`. */
for (const screen of SCREENS.slice(0, 4)) {
  // "Início" → "inicio": nome de arquivo ASCII para a baseline.
  const file = screen.name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

  test(`${screen.name} @visual`, async ({ page, loginAs, addToCart, mock }) => {
    await prepare({ loginAs, addToCart })
    expect(await mock.scenario()).toBe('default')
    await open(page, screen)
    // `fullPage` não rola a página: força as imagens lazy e espera todas decodificarem.
    await page.evaluate(async () => {
      const images = [...document.images]
      images.forEach((img) => (img.loading = 'eager'))
      await Promise.all(images.map((img) => img.decode().catch(() => {})))
      await document.fonts.ready
    })
    await page.mouse.move(-1, -1)
    await expect(page).toHaveScreenshot(`${file}.png`, { fullPage: true })
  })
}
