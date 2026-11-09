/**
 * Banco do mock (SPEC §12.2, §12.4): estado em memória espelhado em `localStorage`.
 * Toda mudança passa por uma mutação daqui, que incrementa `version`, persiste e emite,
 * então REST e eventos de tempo real leem o mesmo estado.
 */
import type { Nft } from '@/shared/contracts'

import { createSeed, type DbData, type OrderRecord, type SeedName } from './fixtures'

const DB_STORAGE_KEY = 'kurio-mock-db'
/** Mudou a forma de `DbData`? Incremente: bancos antigos são descartados e voltam à seed. */
export const DB_SCHEMA_VERSION = 4

interface Persisted {
  schemaVersion: number
  seed: SeedName
  data: DbData
}

export interface DbEvents {
  nft: Nft
  /** Leva `userId`: o socket filtra por ele e manda só o `Order` público. */
  order: OrderRecord
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

    /** Cria (`version` 1) ou troca um Pedido incrementando `version`, persiste e emite. */
    saveOrder(next: Omit<OrderRecord, 'version'>): OrderRecord {
      const current = data.orders.find((o) => o.id === next.id)
      const order: OrderRecord = { ...next, version: (current?.version ?? 0) + 1 }
      data = {
        ...data,
        orders: current
          ? data.orders.map((o) => (o.id === order.id ? order : o))
          : [...data.orders, order],
      }
      persist()
      emit('order', order)
      return order
    },

    /** Conta, sessão, carrinho, Cotação e conexão (sem evento de tempo real): troca e persiste. */
    mutate(recipe: (current: Readonly<DbData>) => DbData): void {
      data = recipe(data)
      persist()
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
