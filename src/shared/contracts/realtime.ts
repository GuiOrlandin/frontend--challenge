/** Envelope dos eventos Socket.IO (SPEC §10.1). */
import type { IsoDate, Nft, Order } from './entities'

export type RealtimeEventType = 'nft.updated' | 'order.updated'

export interface RealtimeEventData {
  'nft.updated': Nft
  'order.updated': Order
}

export interface RealtimeEvent<T extends RealtimeEventType = RealtimeEventType> {
  eventId: string
  type: T
  resourceId: string
  version: number
  occurredAt: IsoDate
  /** Snapshot completo do recurso na versão nova. */
  data: RealtimeEventData[T]
}
