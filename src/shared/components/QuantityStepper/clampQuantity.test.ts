import { describe, expect, it } from 'vitest'

import { clampQuantity } from './clampQuantity'

describe('clampQuantity', () => {
  it('keeps a value inside the range', () => {
    expect(clampQuantity(3, { min: 1, max: 5 })).toBe(3)
  })

  it('limits to min and max', () => {
    expect(clampQuantity(0, { min: 1, max: 5 })).toBe(1)
    expect(clampQuantity(9, { min: 1, max: 5 })).toBe(5)
  })

  it('truncates fractions and falls back to min on non-numbers', () => {
    expect(clampQuantity(2.7, { min: 1, max: 5 })).toBe(2)
    expect(clampQuantity(Number.NaN, { min: 1, max: 5 })).toBe(1)
  })

  it('returns min when max is below min (nothing available)', () => {
    expect(clampQuantity(3, { min: 1, max: 0 })).toBe(1)
  })
})
