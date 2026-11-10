import { describe, expect, it } from 'vitest'

import { attemptFor, parseAttempt } from './attempt'

const attempt = { userId: 'u-ana', quoteId: 'qt_0001', key: 'k-1' }

describe('parseAttempt', () => {
  it('devolve a tentativa do mesmo usuário e descarta a de outro', () => {
    expect(parseAttempt(JSON.stringify(attempt), 'u-ana')).toEqual(attempt)
    expect(parseAttempt(JSON.stringify(attempt), 'u-bruno')).toBeNull()
  })

  it('ignora tentativa ausente, corrompida ou sem chave', () => {
    expect(parseAttempt(null, 'u-ana')).toBeNull()
    expect(parseAttempt('{quebrado', 'u-ana')).toBeNull()
    expect(parseAttempt(JSON.stringify({ ...attempt, key: '' }), 'u-ana')).toBeNull()
  })
})

describe('attemptFor', () => {
  it('reaproveita a chave da mesma Cotação', () => {
    expect(attemptFor('u-ana', 'qt_0001', attempt)).toBe(attempt)
  })

  it('gera chave nova para Cotação nova ou tentativa já concluída', () => {
    expect(attemptFor('u-ana', 'qt_0002', attempt).key).not.toBe('k-1')
    expect(attemptFor('u-ana', 'qt_0001', { ...attempt, orderId: 'ord_1' }).key).not.toBe('k-1')
    expect(attemptFor('u-ana', 'qt_0001', null)).toMatchObject({ quoteId: 'qt_0001' })
  })
})
