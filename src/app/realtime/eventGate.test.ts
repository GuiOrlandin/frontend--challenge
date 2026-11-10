import { describe, expect, it } from 'vitest'

import type { RealtimeEvent } from '@/shared/contracts'

import { createEventGate } from './eventGate'

const event = (version: number, eventId = `nft.updated:nft_1:${version}`) =>
  ({ eventId, type: 'nft.updated', resourceId: 'nft_1', version }) as RealtimeEvent

describe('createEventGate (SPEC §10.3)', () => {
  it('aplica versão maior e descarta igual ou menor', () => {
    const gate = createEventGate()
    expect(gate.accept(event(2))).toBe(true)
    expect(gate.accept(event(3))).toBe(true)
    expect(gate.accept(event(3, 'outro-id'))).toBe(false)
    expect(gate.accept(event(1))).toBe(false)
  })

  it('versões de recursos diferentes não se misturam', () => {
    const gate = createEventGate()
    expect(gate.accept(event(5))).toBe(true)
    expect(gate.accept({ ...event(1), resourceId: 'nft_2', eventId: 'x' })).toBe(true)
    expect(gate.accept({ ...event(1), type: 'order.updated', eventId: 'y' })).toBe(true)
  })

  it('descarta eventId repetido mesmo com versão nova', () => {
    const gate = createEventGate()
    expect(gate.accept(event(1, 'e1'))).toBe(true)
    expect(gate.accept(event(2, 'e1'))).toBe(false)
  })

  it('esquece o eventId mais antigo além do limite do LRU', () => {
    const gate = createEventGate(2)
    gate.accept({ ...event(1, 'a'), resourceId: 'r1' })
    gate.accept({ ...event(1, 'b'), resourceId: 'r2' })
    gate.accept({ ...event(1, 'c'), resourceId: 'r3' })
    expect(gate.accept({ ...event(2, 'a'), resourceId: 'r1' })).toBe(true)
    expect(gate.accept({ ...event(2, 'c'), resourceId: 'r3' })).toBe(false)
  })
})
