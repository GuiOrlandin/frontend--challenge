import { describe, expect, it } from 'vitest'

import { add, compare, formatEth, fromWei, mulQty, toWei } from './eth'

describe('toWei / fromWei', () => {
  it('converts a decimal string with 18 places to wei and back without loss', () => {
    expect(toWei('1.000000000000000001')).toBe(1_000_000_000_000_000_001n)
    expect(fromWei(1_000_000_000_000_000_001n)).toBe('1.000000000000000001')
  })

  it('handles integers, short fractions and zero', () => {
    expect(toWei('2')).toBe(2_000_000_000_000_000_000n)
    expect(toWei('0.5')).toBe(500_000_000_000_000_000n)
    expect(fromWei(500_000_000_000_000_000n)).toBe('0.5')
    expect(fromWei(2_000_000_000_000_000_000n)).toBe('2')
    expect(fromWei(0n)).toBe('0')
  })

  it('rejects malformed values and more than 18 decimal places', () => {
    expect(() => toWei('1,19')).toThrow()
    expect(() => toWei('')).toThrow()
    expect(() => toWei('-1')).toThrow()
    expect(() => toWei('0.0000000000000000001')).toThrow()
  })
})

describe('add', () => {
  it('sums decimal strings exactly', () => {
    expect(add('0.1', '0.2')).toBe('0.3')
    expect(add('1.999999999999999999', '0.000000000000000001')).toBe('2')
  })
})

describe('mulQty', () => {
  it('multiplies a price by an integer quantity exactly', () => {
    expect(mulQty('1.19', 3)).toBe('3.57')
    expect(mulQty('0.000000000000000001', 5)).toBe('0.000000000000000005')
    expect(mulQty('0.33', 0)).toBe('0')
  })

  it('rejects non-integer or negative quantities', () => {
    expect(() => mulQty('1', 1.5)).toThrow()
    expect(() => mulQty('1', -1)).toThrow()
  })
})

describe('compare', () => {
  it('orders values numerically, not lexically', () => {
    expect(compare('10', '9.5')).toBe(1)
    expect(compare('0.50', '0.5')).toBe(0)
    expect(compare('1.19', '1.2')).toBe(-1)
  })
})

describe('formatEth', () => {
  it('formats in pt-BR with at least 2 decimal places', () => {
    expect(formatEth('1.19')).toBe('1,19')
    expect(formatEth('2')).toBe('2,00')
    expect(formatEth('1234.5')).toBe('1.234,50')
  })

  it('rounds 18-place values to 6 places for display without float loss', () => {
    expect(formatEth('1.000000000000000001')).toBe('1,00')
    expect(formatEth('0.1234565')).toBe('0,123457')
    expect(formatEth('9007199254740993.123456789')).toBe('9.007.199.254.740.993,123457')
  })
})
