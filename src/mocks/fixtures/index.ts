/** Seeds do banco simulado. Cada cenário parte de uma delas (SPEC §12.3). */
import type { Eth, Network, Nft } from '@/shared/contracts'

import {
  COUPONS,
  NETWORK_FEES,
  type CartRecord,
  type ConnectionRecord,
  type CouponFixture,
  type OrderRecord,
  type QuoteRecord,
} from './commerce'
import { createNfts } from './nfts'
import { createUsers, type SessionRecord, type UserRecord } from './users'

export { CATEGORIES, COLLECTIONS, NETWORK_LABELS } from './taxonomy'
export type { CartRecord, ConnectionRecord, OrderRecord, QuoteRecord } from './commerce'
export type { SessionRecord, UserRecord } from './users'

/** Relógio fixo da seed: o mesmo instante que os testes instalam com `page.clock`. */
export const SEED_NOW = '2026-07-29T12:00:00.000Z'
const SEED = 20260729

export const SEED_NAMES = ['default', 'empty'] as const
export type SeedName = (typeof SEED_NAMES)[number]

export interface DbData {
  /** Relógio de referência das datas da seed (aba "Novos"). */
  now: string
  nfts: Nft[]
  coupons: CouponFixture[]
  networkFees: Record<Network, Eth>
  /** Ids do hero e do destaque da Início; os textos do hero ficam no código da UI. */
  highlights: { heroIds: string[]; spotlightId: string }
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
  quotes: QuoteRecord[]
  connections: ConnectionRecord[]
  orders: OrderRecord[]
  /** Cenário `session-expired`: já derrubou a sessão uma vez (volta a `false` no reset). */
  scenarioSessionExpired: boolean
  /** Cenário `wallet-disconnected`: já derrubou a conexão uma vez (volta a `false` no reset). */
  scenarioWalletDropped: boolean
}

export function createSeed(name: SeedName): DbData {
  return {
    now: SEED_NOW,
    nfts: name === 'empty' ? [] : createNfts(SEED, SEED_NOW),
    // Emerald Ape #042, Neon Vessel #552 e Golden Beat #207 no hero; Sage Nomad #009 em destaque.
    highlights: { heroIds: ['nft_001', 'nft_003', 'nft_007'], spotlightId: 'nft_002' },
    coupons: COUPONS.map((coupon) => ({ ...coupon })),
    networkFees: { ...NETWORK_FEES },
    // Catálogo vazio: favoritos apontariam para Nfts inexistentes.
    users: createUsers().map((user) => (name === 'empty' ? { ...user, favoriteNftIds: [] } : user)),
    sessions: [],
    carts: [],
    quotes: [],
    connections: [],
    orders: [],
    scenarioSessionExpired: false,
    scenarioWalletDropped: false,
  }
}
