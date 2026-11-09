/**
 * Eventos por timer dos cenários `price-change` e `sold-out` (SPEC §12.3, §12.4). O gatilho é a
 * requisição que a tela faz ao abrir (`GET /cart` no carrinho, `POST /quotes` na revisão, que não
 * tem `GET`), nunca a UI. Cada tela arma uma vez: senão o refetch do carrinho rearmaria o timer.
 * Fica em memória, como o timer: um refresh antes de disparar arma de novo na próxima abertura.
 */
import { fromWei, toWei } from '@/shared/lib/eth'

import { db } from './db'
import type { CartRecord } from './fixtures'
import { getActiveScenario } from './scenarios'

/** "Alguns segundos" depois de abrir a tela. É `setTimeout`: `page.clock` controla. */
export const SCENARIO_EVENT_DELAY_MS = 4000

export type ScenarioScreen = 'cart' | 'review'

const armed = new Map<ScenarioScreen, ReturnType<typeof setTimeout>>()

/** Troca de cenário e reset: cancela os timers pendentes e permite armar de novo. */
export function resetScenarioEvents() {
  for (const timer of armed.values()) clearTimeout(timer)
  armed.clear()
}

function wantsEvent(screen: ScenarioScreen) {
  const kind = getActiveScenario().scenario.behavior?.kind
  return kind === 'price-change' || (kind === 'sold-out' && screen === 'review')
}

/** Mexe na Edição da 1ª linha: +10% no preço ou esgota, emitindo `nft.updated`. */
function fire(line: CartRecord['lines'][number]) {
  const nft = db.findNft(line.nftId)
  if (!nft) return
  const soldOut = getActiveScenario().scenario.behavior?.kind === 'sold-out'
  db.updateNft(nft.id, {
    editions: nft.editions.map((edition) =>
      edition.id !== line.editionId
        ? edition
        : soldOut
          ? { ...edition, available: 0 }
          : { ...edition, price: fromWei((toWei(edition.price) * 11n) / 10n) },
    ),
  })
}

export function onScreenOpened(screen: ScenarioScreen, cart: CartRecord) {
  const line = cart.lines[0]
  if (!line || !wantsEvent(screen) || armed.has(screen)) return
  armed.set(
    screen,
    setTimeout(() => fire(line), SCENARIO_EVENT_DELAY_MS),
  )
}
