import { type Query, type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

import { sessionQueries } from '@/modules/auth'
import { applyOrderUpdated } from '@/modules/checkout'
import { applyNftUpdated } from '@/modules/nft'
import type { Order, RealtimeEvent, RealtimeEventType } from '@/shared/contracts'
import { type RealtimeHandler, RealtimeContext, type RealtimeStatus } from '@/shared/lib/realtime'
import { tokenStore } from '@/shared/lib/tokenStore'

import { createEventGate } from './eventGate'

const RECONNECTING_NOTICE_MS = 3_000

/** Consultas ativas a reconciliar num `connect` após queda (SPEC §10.4). */
function shouldReconcile(query: Query): boolean {
  const [root, kind] = query.queryKey
  if (root === 'nfts') return kind !== 'facets'
  if (root === 'order') return (query.state.data as Order | undefined)?.status === 'pending'
  return root === 'cart'
}

/**
 * Um socket por token (SPEC §10.2): Visitante sem token, Colecionador com o da sessão. Recriado
 * quando a sessão muda; cada evento passa pelo gate, vai para o aplicador do módulo e depois
 * para os `useRealtimeEvent`.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const session = useQuery(sessionQueries.current())
  const [status, setStatus] = useState<RealtimeStatus>('disconnected')
  const [reconnecting, setReconnecting] = useState(false)
  const [handlers] = useState(() => new Map<RealtimeEventType, Set<RealtimeHandler>>())
  const [gate] = useState(() => createEventGate())

  // `undefined` enquanto a sessão carrega: não abre um socket de Visitante para trocar logo depois.
  const token = session.isPending ? undefined : session.data ? tokenStore.getSessionToken() : null

  useEffect(() => {
    if (token === undefined) return
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      transports: ['websocket'],
      query: token ? { token } : {},
    })
    let connectedBefore = false
    let noticeTimer: ReturnType<typeof setTimeout> | undefined

    socket.on('connect', () => {
      clearTimeout(noticeTimer)
      setStatus('connected')
      setReconnecting(false)
      if (connectedBefore) {
        void queryClient.refetchQueries({ type: 'active', predicate: shouldReconcile })
      }
      connectedBefore = true
    })
    socket.on('disconnect', () => {
      setStatus('disconnected')
      noticeTimer = setTimeout(() => setReconnecting(true), RECONNECTING_NOTICE_MS)
    })

    function receive<T extends RealtimeEventType>(
      type: T,
      apply: (client: QueryClient, event: RealtimeEvent<T>) => void,
    ) {
      socket.on(type as string, (event: RealtimeEvent<T>) => {
        if (!gate.accept(event)) return
        apply(queryClient, event)
        handlers.get(type)?.forEach((handler) => handler(event))
      })
    }
    receive('nft.updated', applyNftUpdated)
    receive('order.updated', applyOrderUpdated)

    return () => {
      clearTimeout(noticeTimer)
      socket.removeAllListeners()
      socket.disconnect()
      setStatus('disconnected')
      setReconnecting(false)
    }
  }, [token, queryClient, gate, handlers])

  const [subscribe] = useState(() => (type: RealtimeEventType, handler: RealtimeHandler) => {
    const set = handlers.get(type) ?? new Set()
    handlers.set(type, set.add(handler))
    return () => void set.delete(handler)
  })
  const value = useMemo(() => ({ status, subscribe }), [status, subscribe])

  return (
    <RealtimeContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center"
      >
        {reconnecting && (
          <p className="rounded-full bg-foreground px-4 py-1 text-sm text-background shadow-md">
            Reconectando…
          </p>
        )}
      </div>
    </RealtimeContext>
  )
}
