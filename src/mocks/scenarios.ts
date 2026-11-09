/**
 * Os 13 cenários da demo e dos testes (SPEC §12.3). Cada um combina seed, perfil de rede e
 * comportamento. Os comportamentos são lidos pelos handlers de sessão, carteira, pedido e
 * eventos, que chegam nas tasks seguintes.
 */
import type { SeedName } from './fixtures'

export const SCENARIO_NAMES = [
  'default',
  'empty',
  'slow',
  'flaky',
  'offline',
  'out-of-order',
  'session-expired',
  'payment-refused',
  'wallet-rejected',
  'wallet-disconnected',
  'order-timeout',
  'price-change',
  'sold-out',
] as const

export type ScenarioName = (typeof SCENARIO_NAMES)[number]

export function isScenarioName(value: unknown): value is ScenarioName {
  return SCENARIO_NAMES.includes(value as ScenarioName)
}

export interface RequestMatch {
  method?: string
  /** Caminho sem a base da API (`/nfts`, `/orders`); casa como prefixo, salvo com `exact`. */
  path: string
  exact?: boolean
}

export interface NetworkProfile {
  /** Latência em ms; `min === max` é fixa, senão sorteada pelo PRNG com semente. */
  latency: { min: number; max: number }
  /** Toda chamada falha por rede. */
  offline?: boolean
  /** As primeiras `first` chamadas que casam respondem 503 `TEMPORARILY_UNAVAILABLE`. */
  unavailable?: { match: RequestMatch; first: number }
  /** Chamadas que casam respondem na ordem inversa: a mais antiga depois da mais nova. */
  outOfOrder?: { match: RequestMatch }
}

export type ScenarioBehavior =
  | { kind: 'session-expired' }
  | { kind: 'payment-refused' }
  | { kind: 'wallet-rejected' }
  | { kind: 'wallet-disconnected' }
  | { kind: 'order-timeout' }
  | { kind: 'price-change' }
  | { kind: 'sold-out' }

export interface Scenario {
  seed: SeedName
  network: NetworkProfile
  behavior?: ScenarioBehavior
}

const DEFAULT_LATENCY = { min: 150, max: 150 }
/** A busca do catálogo (`GET /nfts` com query), sem facets nem detalhe. */
const catalogSearch: RequestMatch = { method: 'GET', path: '/nfts', exact: true }

const base: Scenario = { seed: 'default', network: { latency: DEFAULT_LATENCY } }
const withBehavior = (kind: ScenarioBehavior['kind']): Scenario => ({
  ...base,
  behavior: { kind },
})

export const SCENARIOS: Record<ScenarioName, Scenario> = {
  default: base,
  empty: { ...base, seed: 'empty' },
  slow: { ...base, network: { latency: { min: 1500, max: 3000 } } },
  flaky: {
    ...base,
    network: { latency: DEFAULT_LATENCY, unavailable: { match: catalogSearch, first: 2 } },
  },
  offline: { ...base, network: { latency: DEFAULT_LATENCY, offline: true } },
  'out-of-order': {
    ...base,
    network: {
      latency: DEFAULT_LATENCY,
      outOfOrder: { match: catalogSearch },
    },
  },
  'session-expired': withBehavior('session-expired'),
  'payment-refused': withBehavior('payment-refused'),
  'wallet-rejected': withBehavior('wallet-rejected'),
  'wallet-disconnected': withBehavior('wallet-disconnected'),
  // O pedido é criado antes de segurar a resposta: o handler de pedidos lê o comportamento.
  'order-timeout': withBehavior('order-timeout'),
  'price-change': withBehavior('price-change'),
  'sold-out': withBehavior('sold-out'),
}

const SCENARIO_STORAGE_KEY = 'kurio-mock-scenario'
let active: ScenarioName = 'default'

/** Cenário em vigor; os handlers leem a cada requisição. */
export function getActiveScenario(): { name: ScenarioName; scenario: Scenario } {
  return { name: active, scenario: SCENARIOS[active] }
}

/** Troca o cenário e o guarda para sobreviver a refresh. */
export function setActiveScenario(name: ScenarioName): void {
  active = name
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, name)
  } catch {
    // Sem storage: o cenário vale até o próximo refresh.
  }
}

export function readStoredScenario(): ScenarioName | null {
  try {
    const stored = localStorage.getItem(SCENARIO_STORAGE_KEY)
    return isScenarioName(stored) ? stored : null
  } catch {
    return null
  }
}
