import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('trata os tamanhos extras do tema como font-size, não como cor', () => {
    expect(cn('text-sm text-primary', 'text-15')).toBe('text-primary text-15')
  })
})
