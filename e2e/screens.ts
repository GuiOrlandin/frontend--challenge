import type { Page } from '@playwright/test'

import { expect, type Fixtures } from './fixtures'

/** As 6 telas principais (SPEC §14.1), com o elemento que confirma que cada uma carregou. */
export const SCREENS = [
  { name: 'Início', path: '/', ready: { role: 'list', name: 'NFTs' } },
  { name: 'Detalhe', path: '/nft/nft_001', ready: { role: 'button', name: 'Favoritar' } },
  { name: 'Carrinho', path: '/carrinho', ready: { role: 'heading', name: 'Carrinho de NFTs' } },
  { name: 'Pagamento', path: '/pagamento', ready: { role: 'button', name: 'Continuar' } },
  { name: 'Perfil', path: '/perfil', ready: { role: 'heading', name: 'Perfil do colecionador' } },
  { name: 'Carteiras', path: '/perfil/carteiras', ready: { role: 'heading', name: 'Carteiras' } },
] as const

/** Ana logada com o nft_001 (edição aberta) no carrinho: assim Carrinho e Pagamento têm conteúdo. */
export async function prepare({ loginAs, addToCart }: Pick<Fixtures, 'loginAs' | 'addToCart'>) {
  await loginAs('ana')
  await addToCart({ nftId: 'nft_001', editionId: 'ed_001_a' })
}

export async function open(page: Page, screen: (typeof SCREENS)[number]) {
  await page.goto(screen.path)
  await expect(
    page
      .getByRole(screen.ready.role, { name: screen.ready.name, exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible()
}
