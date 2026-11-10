/** Seleção de cenário e `window.__mock` (SPEC §12.4). Só existe com os mocks ligados. */
import type { Nft, RealtimeEvent } from '@/shared/contracts'

import { db, type NftPatch } from './db'
import { failNext, resetNetworkState } from './network'
import { resetScenarioEvents } from './scenarioEvents'
import { expireSessions } from './session'
import {
  getActiveScenario,
  isScenarioName,
  readStoredScenario,
  SCENARIOS,
  setActiveScenario,
  type RequestMatch,
  type ScenarioName,
} from './scenarios'
import { dropSockets, emitRealtime } from './ws'

/** Troca de cenário: sempre volta à seed dele. */
function switchScenario(name: ScenarioName) {
  setActiveScenario(name)
  resetNetworkState()
  resetScenarioEvents()
  db.reset(SCENARIOS[name].seed)
}

function resetCurrent() {
  resetNetworkState()
  resetScenarioEvents()
  db.reset(SCENARIOS[getActiveScenario().name].seed)
}

/**
 * Aplica `?scenario=` e `?reset=1` e remove os dois da URL. Sem parâmetro, retoma o cenário
 * e o banco guardados. Cenário desconhecido é ignorado com aviso.
 */
export function applyScenarioFromUrl(location: Location, history: History) {
  const url = new URL(location.href)
  const requested = url.searchParams.get('scenario')
  const reset = url.searchParams.get('reset') === '1'
  const stored = readStoredScenario() ?? 'default'

  if (requested !== null && !isScenarioName(requested)) {
    console.warn(`[mock] cenário desconhecido: "${requested}". Mantendo "${stored}".`)
  }

  if (isScenarioName(requested) && requested !== stored) {
    switchScenario(requested)
  } else {
    setActiveScenario(stored)
    db.load(SCENARIOS[stored].seed)
    if (reset) resetCurrent()
  }

  if (url.searchParams.has('scenario') || url.searchParams.has('reset')) {
    url.searchParams.delete('scenario')
    url.searchParams.delete('reset')
    history.replaceState(history.state, '', url)
  }
}

export interface MockControl {
  /** Cenário atual (sem argumento) ou troca de cenário, resetando o banco para a seed dele. */
  scenario(name?: ScenarioName): ScenarioName
  /** Volta o banco à seed do cenário atual. */
  reset(): void
  /** Muda um Nft como o "servidor" faria: incrementa `version`, persiste e emite. */
  updateNft(id: string, patch: NftPatch): Nft
  /** Vence todas as sessões: a próxima chamada privada responde 401 `SESSION_EXPIRED`. */
  expireSession(): void
  /** Entrega um evento como veio (inclusive duplicado ou antigo), respeitando o escopo. */
  emit(event: RealtimeEvent): void
  /** Derruba as conexões Socket.IO; o cliente reconecta sozinho. */
  dropSocket(): void
  /** As próximas `count` chamadas que casam respondem 503 (falha pontual nos testes). */
  failNext(match: RequestMatch, count?: number): void
}

export function installMockControl(target: Window & { __mock?: MockControl }) {
  target.__mock = {
    scenario(name) {
      if (name !== undefined) {
        if (!isScenarioName(name)) throw new Error(`Cenário desconhecido: ${String(name)}`)
        switchScenario(name)
      }
      return getActiveScenario().name
    },
    reset: resetCurrent,
    updateNft: (id, patch) => db.updateNft(id, patch),
    expireSession: expireSessions,
    emit: emitRealtime,
    dropSocket: dropSockets,
    failNext,
  }
}
