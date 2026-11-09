import { describe, expect, it } from 'vitest'

import {
  buyerSchema,
  changePasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  walletSchema,
} from './schemas'

const EVM_ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7'
const SOLANA_ADDRESS = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'

/** Caminhos dos campos com erro, para comparar com o que a UI vai marcar. */
function invalidFields(result: {
  success: boolean
  error?: { issues: { path: PropertyKey[] }[] }
}) {
  return [...new Set(result.error?.issues.map((issue) => issue.path.join('.')) ?? [])].sort()
}

describe('registerSchema', () => {
  const valid = {
    username: 'ana_01',
    displayName: 'Ana',
    email: 'ana@kurio.dev',
    password: 'Kurio@123',
    confirmPassword: 'Kurio@123',
  }

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ['too short', 'an'],
    ['too long', 'a'.repeat(21)],
    ['uppercase', 'Ana_01'],
    ['hyphen', 'ana-01'],
  ])('rejects a username that is %s', (_, username) => {
    expect(invalidFields(registerSchema.safeParse({ ...valid, username }))).toEqual(['username'])
  })

  it('rejects an invalid e-mail', () => {
    expect(invalidFields(registerSchema.safeParse({ ...valid, email: 'ana@' }))).toEqual(['email'])
  })

  it.each([
    ['shorter than 8', 'Ab1'],
    ['without a number', 'Abcdefgh'],
    ['without a letter', '12345678'],
  ])('rejects a password %s', (_, password) => {
    const result = registerSchema.safeParse({ ...valid, password, confirmPassword: password })
    expect(invalidFields(result)).toEqual(['password'])
  })

  it('flags the confirmation when it differs from the password', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Kurio@124' })
    expect(invalidFields(result)).toEqual(['confirmPassword'])
  })
})

describe('loginSchema', () => {
  it('requires an e-mail and a password but not the password rules', () => {
    expect(loginSchema.safeParse({ email: 'ana@kurio.dev', password: 'x' }).success).toBe(true)
    expect(invalidFields(loginSchema.safeParse({ email: 'ana', password: '' }))).toEqual([
      'email',
      'password',
    ])
  })
})

describe('changePasswordSchema', () => {
  it('validates the new password and its confirmation', () => {
    const valid = { currentPassword: 'old', newPassword: 'Nova1234', confirmPassword: 'Nova1234' }
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
    expect(
      invalidFields(changePasswordSchema.safeParse({ ...valid, newPassword: 'curta1' })),
    ).toEqual(['confirmPassword', 'newPassword'])
    expect(
      invalidFields(changePasswordSchema.safeParse({ ...valid, currentPassword: '' })),
    ).toEqual(['currentPassword'])
  })
})

describe('profileSchema', () => {
  const valid = {
    displayName: 'Ana Souza',
    username: 'ana',
    email: 'ana@kurio.dev',
    ensName: 'ana-souza.eth',
    alias: 'Cofre',
  }

  it('accepts a valid profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ['without .eth', 'ana'],
    ['with a name shorter than 3', 'an.eth'],
    ['with uppercase', 'Ana.eth'],
    ['with a name longer than 63', `${'a'.repeat(64)}.eth`],
  ])('rejects an ENS name %s', (_, ensName) => {
    expect(invalidFields(profileSchema.safeParse({ ...valid, ensName }))).toEqual(['ensName'])
  })

  it('enforces the length of display name (2–40) and alias (2–24)', () => {
    const result = profileSchema.safeParse({ ...valid, displayName: 'A', alias: 'a'.repeat(25) })
    expect(invalidFields(result)).toEqual(['alias', 'displayName'])
  })

  it('rejects every required field left empty', () => {
    const empty = { displayName: '', username: '', email: '', ensName: '', alias: '' }
    expect(invalidFields(profileSchema.safeParse(empty))).toEqual([
      'alias',
      'displayName',
      'email',
      'ensName',
      'username',
    ])
  })
})

describe('walletSchema', () => {
  const valid = {
    role: 'primary',
    label: 'Principal',
    displayName: 'Ana Souza',
    network: 'ethereum',
    profileName: 'Ana Souza',
    address: EVM_ADDRESS,
    receivingAddress: '',
    provider: 'metamask',
    referralCode: 'KURIO2026',
    email: 'ana@kurio.dev',
    ensName: 'ana.eth',
  }

  it('accepts a valid wallet and drops an empty optional receiving address', () => {
    const result = walletSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data?.receivingAddress).toBeUndefined()
  })

  it('validates the address against the selected network', () => {
    expect(walletSchema.safeParse({ ...valid, network: 'polygon' }).success).toBe(true)
    expect(invalidFields(walletSchema.safeParse({ ...valid, network: 'solana' }))).toEqual([
      'address',
    ])
    expect(
      walletSchema.safeParse({ ...valid, network: 'solana', address: SOLANA_ADDRESS }).success,
    ).toBe(true)
    expect(
      invalidFields(walletSchema.safeParse({ ...valid, address: EVM_ADDRESS.slice(0, -1) })),
    ).toEqual(['address'])
  })

  it('accepts an ENS name or an address as the receiving address', () => {
    expect(walletSchema.safeParse({ ...valid, receivingAddress: 'cofre.eth' }).success).toBe(true)
    expect(walletSchema.safeParse({ ...valid, receivingAddress: EVM_ADDRESS }).success).toBe(true)
    expect(invalidFields(walletSchema.safeParse({ ...valid, receivingAddress: 'xyz' }))).toEqual([
      'receivingAddress',
    ])
  })

  it.each([
    ['network', 'bitcoin'],
    ['provider', 'phantom'],
    ['referralCode', 'kurio'],
    ['referralCode', 'ABCDEFGHIJKLM'],
  ])('rejects an invalid %s (%s)', (field, value) => {
    expect(invalidFields(walletSchema.safeParse({ ...valid, [field]: value }))).toEqual([field])
  })
})

describe('buyerSchema', () => {
  const valid = {
    displayName: 'Ana Souza',
    username: 'ana',
    email: 'ana@kurio.dev',
    ensName: 'ana.eth',
    profileName: 'Ana Souza',
    referralCode: 'KURIO2026',
    receivingAddress: '',
    note: '',
  }

  it('accepts a valid buyer and drops empty optional fields', () => {
    const result = buyerSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      displayName: 'Ana Souza',
      username: 'ana',
      email: 'ana@kurio.dev',
      ensName: 'ana.eth',
      profileName: 'Ana Souza',
      referralCode: 'KURIO2026',
    })
  })

  it('limits the collector note to 500 characters', () => {
    expect(buyerSchema.safeParse({ ...valid, note: 'a'.repeat(500) }).success).toBe(true)
    expect(invalidFields(buyerSchema.safeParse({ ...valid, note: 'a'.repeat(501) }))).toEqual([
      'note',
    ])
  })

  it('treats whitespace-only optional fields as absent', () => {
    const result = buyerSchema.safeParse({ ...valid, receivingAddress: '   ', note: '  ' })
    expect(result.success).toBe(true)
    expect(result.data?.receivingAddress).toBeUndefined()
    expect(result.data?.note).toBeUndefined()
  })
})
