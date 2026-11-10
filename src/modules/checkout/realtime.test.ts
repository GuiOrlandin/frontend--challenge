import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import type { Order, OrderStatus, RealtimeEvent } from '@/shared/contracts'

import { applyOrderUpdated } from './realtime'

const order = (version: number, status: OrderStatus) =>
  ({ id: 'ord_0001', version, status }) as Order

const updated = (data: Order): RealtimeEvent<'order.updated'> => ({
  eventId: `order.updated:${data.id}:${data.version}`,
  type: 'order.updated',
  resourceId: data.id,
  version: data.version,
  occurredAt: '2026-07-29T12:00:03Z',
  data,
})

const ORDER = ['order', 'u1', 'ord_0001']

function seeded() {
  const client = new QueryClient()
  client.setQueryData(ORDER, order(1, 'pending'))
  client.setQueryData(['cart', 'u1'], { id: 'cart' })
  return client
}

describe('applyOrderUpdated (SPEC §10.3)', () => {
  it('confirmado troca o pedido e invalida o carrinho', () => {
    const client = seeded()
    applyOrderUpdated(client, updated(order(2, 'confirmed')))

    expect(client.getQueryData<Order>(ORDER)?.status).toBe('confirmed')
    expect(client.getQueryState(['cart', 'u1'])?.isInvalidated).toBe(true)
  })

  it('recusado troca o pedido sem tocar no carrinho', () => {
    const client = seeded()
    applyOrderUpdated(client, updated(order(2, 'refused')))

    expect(client.getQueryData<Order>(ORDER)?.status).toBe('refused')
    expect(client.getQueryState(['cart', 'u1'])?.isInvalidated).toBe(false)
  })

  it('evento antigo ou duplicado não regride nem invalida', () => {
    const client = seeded()
    client.setQueryData(ORDER, order(2, 'confirmed'))
    applyOrderUpdated(client, updated(order(1, 'pending')))
    applyOrderUpdated(client, updated(order(2, 'confirmed')))

    expect(client.getQueryData<Order>(ORDER)?.status).toBe('confirmed')
    expect(client.getQueryState(['cart', 'u1'])?.isInvalidated).toBe(false)
  })
})
