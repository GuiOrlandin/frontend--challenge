/** Gerador pseudoaleatório com semente (mulberry32): mesma semente, mesma sequência. */
export interface Random {
  /** Número em [0, 1). */
  next(): number
  /** Inteiro em [min, max]. */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  chance(probability: number): boolean
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    next,
    int,
    pick: (items) => {
      const item = items[int(0, items.length - 1)]
      if (item === undefined) throw new Error('pick() em lista vazia')
      return item
    },
    chance: (probability) => next() < probability,
  }
}
