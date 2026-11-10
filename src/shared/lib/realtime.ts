/** Hooks de tempo real para os módulos; o `RealtimeProvider` (app/realtime) fornece o contexto. */
import { createContext, use, useEffect, useEffectEvent } from 'react'

import type { RealtimeEvent, RealtimeEventType } from '@/shared/contracts'

export type RealtimeStatus = 'connected' | 'disconnected'
export type RealtimeHandler = (event: RealtimeEvent) => void

interface RealtimeContextValue {
  status: RealtimeStatus
  subscribe(type: RealtimeEventType, handler: RealtimeHandler): () => void
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)

function useRealtime() {
  const value = use(RealtimeContext)
  if (!value) throw new Error('useRealtime* fora do RealtimeProvider')
  return value
}

/** Estado do socket; o pedido pendente faz polling enquanto `disconnected` (SPEC §11.2). */
export function useRealtimeStatus(): RealtimeStatus {
  return useRealtime().status
}

/** Reação de UI a um evento já aceito e aplicado no cache (SPEC §10.3). */
export function useRealtimeEvent<T extends RealtimeEventType>(
  type: T,
  handler: (event: RealtimeEvent<T>) => void,
) {
  const { subscribe } = useRealtime()
  const onEvent = useEffectEvent(handler)
  useEffect(() => subscribe(type, (event) => onEvent(event as RealtimeEvent<T>)), [subscribe, type])
}
