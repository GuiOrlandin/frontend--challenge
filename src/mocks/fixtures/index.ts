/** Seeds do banco simulado. Cada cenário parte de uma delas (SPEC §12.3). */
import type { Eth, Network, Nft } from '@/shared/contracts'

import { COUPONS, NETWORK_FEES, type CouponFixture } from './commerce'
import { createNfts } from './nfts'

export { CATEGORIES, COLLECTIONS, NETWORK_LABELS } from './taxonomy'

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
}

export function createSeed(name: SeedName): DbData {
  return {
    now: SEED_NOW,
    nfts: name === 'empty' ? [] : createNfts(SEED, SEED_NOW),
    // Emerald Ape #042, Neon Vessel #552 e Golden Beat #207 no hero; Sage Nomad #009 em destaque.
    highlights: { heroIds: ['nft_001', 'nft_003', 'nft_007'], spotlightId: 'nft_002' },
    coupons: COUPONS.map((coupon) => ({ ...coupon })),
    networkFees: { ...NETWORK_FEES },
  }
}
