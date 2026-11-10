import { describe, expect, it } from 'vitest'

import { parseDraft } from './draft'

const draft = {
  userId: 'u-ana',
  walletId: 'w-1',
  provider: 'metamask',
  values: { displayName: 'Ana' },
}

describe('parseDraft', () => {
  it('devolve o rascunho do mesmo usuário', () => {
    expect(parseDraft(JSON.stringify(draft), 'u-ana')).toEqual(draft)
  })

  it('descarta o rascunho de outro usuário', () => {
    expect(parseDraft(JSON.stringify(draft), 'u-bruno')).toBeNull()
  })

  it('ignora rascunho ausente ou corrompido', () => {
    expect(parseDraft(null, 'u-ana')).toBeNull()
    expect(parseDraft('{quebrado', 'u-ana')).toBeNull()
  })

  it('descarta rascunho com provedor desconhecido', () => {
    expect(parseDraft(JSON.stringify({ ...draft, provider: 'phantom' }), 'u-ana')).toBeNull()
  })
})
