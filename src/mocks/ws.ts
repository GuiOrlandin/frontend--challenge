/**
 * Socket.IO do mock (SPEC §10, §12.2): `ws.link` + `toSocketIo`, heartbeat manual, escopo pelo
 * `token` da query e emissão a partir do emitter do `db`. Limitações do transporte na §10.5.
 */
import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import type { RealtimeEvent, RealtimeEventType } from '@/shared/contracts'

import { db } from './db'
import { toOrder } from './orders'
import { sessionStatus } from './rules/account'
import { getActiveScenario } from './scenarios'

/** Abaixo do `pingInterval + pingTimeout` (30 s) que o binding 0.2.0 anuncia e nunca cumpre. */
export const HEARTBEAT_MS = 20_000

interface Subscriber {
  /** Colecionador do token; `null` é Visitante (só `nft.updated`). */
  userId: string | null
  emit(event: RealtimeEvent): void
  close(): void
}

const subscribers = new Set<Subscriber>()

function userIdOfToken(token: string | null): string | null {
  const session = token ? db.data.sessions.find((s) => s.token === token) : undefined
  return sessionStatus(session, Date.now()) === 'valid' ? session!.userId : null
}

function envelope<T extends RealtimeEventType>(
  type: T,
  data: RealtimeEvent<T>['data'],
): RealtimeEvent<T> {
  return {
    // Determinístico: o mesmo recurso na mesma versão é o mesmo evento (dedupe do cliente).
    eventId: `${type}:${data.id}:${data.version}`,
    type,
    resourceId: data.id,
    version: data.version,
    occurredAt: new Date(Date.now()).toISOString(),
    data,
  }
}

/**
 * `order.updated` só para o dono; o dono vem do banco, nunca do evento. Também é o
 * `window.__mock.emit`: entrega como veio, inclusive duplicado ou de versão antiga.
 */
export function emitRealtime(event: RealtimeEvent) {
  const ownerId =
    event.type === 'order.updated'
      ? (db.data.orders.find((o) => o.id === event.resourceId)?.userId ?? null)
      : null
  for (const subscriber of subscribers) {
    if (event.type === 'nft.updated' || (ownerId && subscriber.userId === ownerId)) {
      subscriber.emit(event)
    }
  }
}

db.on('nft', (nft) => emitRealtime(envelope('nft.updated', nft)))
db.on('order', (order) => emitRealtime(envelope('order.updated', toOrder(order))))

/** `window.__mock.dropSocket`: derruba todas as conexões; o cliente reconecta sozinho. */
export function dropSockets() {
  for (const subscriber of subscribers) subscriber.close()
}

/** `origin` é a de `VITE_SOCKET_URL` (ou da página), sem `/socket.io`: o MSW tira o prefixo. */
export function createSocketHandler(origin: string) {
  const link = ws.link(origin.replace(/^http/, 'ws'))

  return link.addEventListener('connection', (connection) => {
    const { client } = connection
    // Cenário `offline`: o socket não conecta (o Manager segue tentando com backoff).
    if (getActiveScenario().scenario.network.offline) {
      client.close()
      return
    }

    const io = toSocketIo(connection)
    const subscriber: Subscriber = {
      userId: userIdOfToken(client.url.searchParams.get('token')),
      emit: (event) => io.client.emit(event.type, event),
      close: () => client.close(),
    }
    subscribers.add(subscriber)
    const heartbeat = setInterval(() => client.send('2'), HEARTBEAT_MS)

    client.addEventListener('close', () => {
      clearInterval(heartbeat)
      subscribers.delete(subscriber)
    })
  })
}
