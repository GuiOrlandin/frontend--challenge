/**
 * Banco do mock (SPEC §12.2, §12.4): estado em memória espelhado em `localStorage`.
 * Toda mudança passa por uma mutação daqui, que incrementa `version`, persiste e emite,
 * então REST e eventos de tempo real leem o mesmo estado.
 */
import type { Nft, Order } from '@/shared/contracts'

import { createSeed, type DbData, type SeedName } from './fixtures'

const DB_STORAGE_KEY = 'kurio-mock-db'
/** Mudou a forma de `DbData`? Incremente: bancos antigos são descartados e voltam à seed. */
export const DB_SCHEMA_VERSION = 1

interface Persisted {
  schemaVersion: number
  seed: SeedName
  data: DbData
}

export interface DbEvents {
  nft: Nft
  order: Order
}

type Listener<T> = (payload: T) => void
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export type NftPatch = Partial<Omit<Nft, 'id' | 'version'>>

export function createDb(storage: StorageLike | null) {
  let seed: SeedName = 'default'
  let data: DbData = createSeed(seed)
  const listeners: { [K in keyof DbEvents]: Set<Listener<DbEvents[K]>> } = {
    nft: new Set(),
    order: new Set(),
  }

  const persist = () => {
    const snapshot: Persisted = { schemaVersion: DB_SCHEMA_VERSION, seed, data }
    try {
      storage?.setItem(DB_STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      // Storage cheio ou bloqueado: o mock segue em memória.
    }
  }

  const emit = <K extends keyof DbEvents>(event: K, payload: DbEvents[K]) => {
    for (const listener of listeners[event]) listener(payload)
  }

  return {
    get data(): Readonly<DbData> {
      return data
    },
    get seed(): SeedName {
      return seed
    },

    /** Recupera o banco salvo; schema ou seed diferentes voltam à seed pedida. */
    load(requested: SeedName) {
      const saved = readPersisted(storage)
      if (saved && saved.schemaVersion === DB_SCHEMA_VERSION && saved.seed === requested) {
        seed = saved.seed
        data = saved.data
        return
      }
      this.reset(requested)
    },

    reset(requested: SeedName = seed) {
      seed = requested
      data = createSeed(requested)
      persist()
    },

    findNft(id: string): Nft | undefined {
      return data.nfts.find((nft) => nft.id === id)
    },

    updateNft(id: string, patch: NftPatch): Nft {
      const current = this.findNft(id)
      if (!current) throw new Error(`Nft inexistente no mock: ${id}`)
      const updated: Nft = { ...current, ...patch, id, version: current.version + 1 }
      data = { ...data, nfts: data.nfts.map((nft) => (nft.id === id ? updated : nft)) }
      persist()
      emit('nft', updated)
      return updated
    },

    on<K extends keyof DbEvents>(event: K, listener: Listener<DbEvents[K]>): () => void {
      listeners[event].add(listener)
      return () => listeners[event].delete(listener)
    },
  }
}

function readPersisted(storage: StorageLike | null): Persisted | null {
  try {
    const raw = storage?.getItem(DB_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : null
  } catch {
    return null
  }
}

/** Instância do app: só existe com os mocks ligados (carregada pelo bootstrap). */
export const db = createDb(typeof localStorage === 'undefined' ? null : localStorage)
