import { describe, expect, it } from 'vitest'

import { rootSearchSchema } from './search'

describe('rootSearchSchema (SPEC §4.2)', () => {
  it('aceita auth e redirect interno', () => {
    expect(rootSearchSchema.parse({ auth: 'entrar', redirect: '/pagamento?step=revisao' })).toEqual(
      { auth: 'entrar', redirect: '/pagamento?step=revisao' },
    )
  })

  it('descarta auth desconhecido sem erro', () => {
    expect(rootSearchSchema.parse({ auth: 'admin' })).toEqual({})
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'perfil', 'javascript:alert(1)', 42])(
    'descarta redirect externo ou malformado: %s',
    (redirect) => {
      expect(rootSearchSchema.parse({ auth: 'entrar', redirect })).toEqual({ auth: 'entrar' })
    },
  )
})
