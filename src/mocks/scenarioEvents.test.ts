import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { db } from './db'
import type { CartRecord } from './fixtures'
import { onScreenOpened, resetScenarioEvents, SCENARIO_EVENT_DELAY_MS } from './scenarioEvents'
import { setActiveScenario, type ScenarioName } from './scenarios'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup(scenario: ScenarioName) {
  setActiveScenario(scenario)
  resetScenarioEvents()
  db.reset('default')
  const nft = db.data.nfts.find((n) => n.editions[0]!.available > 0)!
  const edition = nft.editions[0]!
  const cart = {
    lines: [{ lineId: 'l1', nftId: nft.id, editionId: edition.id, quantity: 1 }],
  } as CartRecord
  const current = () => db.findNft(nft.id)!.editions[0]!
  return { cart, edition, current }
}

it('price-change: sobe 10% alguns segundos depois de abrir, uma vez por tela', () => {
  const { cart, edition, current } = setup('price-change')
  const before = Number(edition.price)

  onScreenOpened('cart', cart)
  vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS - 1)
  expect(current().price).toBe(edition.price)
  vi.advanceTimersByTime(1)
  expect(Number(current().price)).toBeCloseTo(before * 1.1, 10)

  // Refetch do carrinho não rearma; a revisão arma o seu.
  onScreenOpened('cart', cart)
  onScreenOpened('review', cart)
  vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS)
  expect(Number(current().price)).toBeCloseTo(before * 1.21, 10)
})

it('sold-out: esgota só na revisão', () => {
  const { cart, current } = setup('sold-out')
  onScreenOpened('cart', cart)
  vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS)
  expect(current().available).toBeGreaterThan(0)

  onScreenOpened('review', cart)
  vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS)
  expect(current().available).toBe(0)
})

it('reset antes do timer cancela o efeito; outros cenários não fazem nada', () => {
  const { cart, edition, current } = setup('price-change')
  onScreenOpened('cart', cart)
  resetScenarioEvents()
  // Reabrir logo depois do reset arma um timer só: sobe uma vez, não duas.
  onScreenOpened('cart', cart)
  vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS)
  expect(Number(current().price)).toBeCloseTo(Number(edition.price) * 1.1, 10)

  setup('default')
  onScreenOpened('review', cart)
  vi.advanceTimersByTime(SCENARIO_EVENT_DELAY_MS)
  expect(current().price).toBe(edition.price)
})
