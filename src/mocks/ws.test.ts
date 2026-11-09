/**
 * Socket.IO do mock de ponta a ponta: `socket.io-client` (bundle de browser, alias no
 * `vite.config.ts`, porque o build de Node usa o pacote `ws`, que o MSW não intercepta).
 */
import { setupServer } from 'msw/node'
import type { Socket } from 'socket.io-client'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'

import type { RealtimeEvent } from '@/shared/contracts'

import { db } from './db'
import type { OrderRecord } from './fixtures'
import { startSession } from './session'
import { setActiveScenario } from './scenarios'
import { createSocketHandler, dropSockets, emitRealtime } from './ws'

const ORIGIN = 'http://socket.test'
const server = setupServer(createSocketHandler(ORIGIN))
const sockets: Socket[] = []
let io: typeof import('socket.io-client').io

beforeAll(async () => {
  server.listen()
  // O engine.io-client guarda o `WebSocket` global ao ser importado: só depois do patch do MSW.
  ;({ io } = await import('socket.io-client'))
})
afterAll(() => server.close())
beforeEach(() => {
  vi.useFakeTimers()
  setActiveScenario('default')
  db.reset('default')
})
afterEach(() => {
  for (const socket of sockets.splice(0)) socket.disconnect()
  vi.useRealTimers()
})

function tokenOf(username: string) {
  const user = db.data.users.find((u) => u.username === username)!
  return startSession(user).token
}

async function connect(token?: string) {
  const socket = io(ORIGIN, { transports: ['websocket'], query: token ? { token } : {} })
  sockets.push(socket)
  const events: RealtimeEvent[] = []
  const disconnects: string[] = []
  socket.on('nft.updated', (event: RealtimeEvent) => events.push(event))
  socket.on('order.updated', (event: RealtimeEvent) => events.push(event))
  socket.on('disconnect', (reason) => disconnects.push(reason))
  await vi.advanceTimersByTimeAsync(10)
  expect(socket.connected).toBe(true)
  return { socket, events, disconnects }
}

const saveOrderOf = (userId: string) =>
  db.saveOrder({ id: 'ord_0001', userId, status: 'pending' } as Omit<OrderRecord, 'version'>)

it('entrega nft.updated depois de updateNft e não cai por ping timeout em 60 s', async () => {
  const { socket, events, disconnects } = await connect()
  const nft = db.data.nfts[0]!

  await vi.advanceTimersByTimeAsync(60_000)
  const updated = db.updateNft(nft.id, { title: 'Novo título' })
  await vi.advanceTimersByTimeAsync(10)

  expect(disconnects).toEqual([])
  expect(socket.connected).toBe(true)
  expect(events).toEqual([
    {
      eventId: `nft.updated:${nft.id}:${updated.version}`,
      type: 'nft.updated',
      resourceId: nft.id,
      version: updated.version,
      occurredAt: expect.any(String),
      data: updated,
    },
  ])
})

it('order.updated só chega ao dono: nem Visitante, nem outro Colecionador', async () => {
  const visitor = await connect()
  const ana = await connect(tokenOf('ana'))
  const bruno = await connect(tokenOf('bruno'))
  const anaId = db.data.users.find((u) => u.username === 'ana')!.id

  saveOrderOf(anaId)
  await vi.advanceTimersByTimeAsync(10)

  expect(ana.events.map((e) => e.type)).toEqual(['order.updated'])
  expect(visitor.events).toEqual([])
  expect(bruno.events).toEqual([])
})

it('emit entrega duplicados como vieram; dropSocket derruba e o cliente reconecta', async () => {
  const { socket, events, disconnects } = await connect()
  const updated = db.updateNft(db.data.nfts[0]!.id, { title: 'x' })
  await vi.advanceTimersByTimeAsync(10)

  emitRealtime(events[0]!)
  await vi.advanceTimersByTimeAsync(10)
  expect(events.map((e) => e.version)).toEqual([updated.version, updated.version])

  dropSockets()
  await vi.advanceTimersByTimeAsync(10)
  expect(disconnects).toEqual(['transport close'])
  await vi.advanceTimersByTimeAsync(10_000)
  expect(socket.connected).toBe(true)
})

it('cenário offline: o socket não conecta', async () => {
  setActiveScenario('offline')
  const socket = io(ORIGIN, { transports: ['websocket'] })
  sockets.push(socket)
  await vi.advanceTimersByTimeAsync(10_000)
  expect(socket.connected).toBe(false)
})
