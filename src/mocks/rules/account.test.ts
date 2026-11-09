import { describe, expect, it } from 'vitest'

import { profileSchema, walletSchema, type Wallet } from '@/shared/contracts'

import { createUsers, type UserRecord } from '../fixtures/users'
import {
  findAccountConflict,
  hashPassword,
  sessionStatus,
  verifyPassword,
  walletClash,
  walletRoleTaken,
} from './account'

const users = createUsers()
const [ana, bruno] = users as [UserRecord, UserRecord]

describe('senha', () => {
  it('hash é SHA-256(salt + senha) em hex, igual ao das fixtures', async () => {
    expect(await hashPassword(ana.salt, 'Kurio@123')).toBe(ana.passwordHash)
  })

  it('verifica a senha certa e recusa a errada', async () => {
    expect(await verifyPassword(bruno, 'Kurio@123')).toBe(true)
    expect(await verifyPassword(bruno, 'kurio@123')).toBe(false)
  })

  it('o mesmo texto com salts diferentes gera hashes diferentes', async () => {
    expect(await hashPassword('aa', 'Kurio@123')).not.toBe(await hashPassword('bb', 'Kurio@123'))
  })
})

describe('unicidade', () => {
  it('e-mail já usado, sem diferenciar maiúsculas', () => {
    expect(findAccountConflict(users, { email: 'ANA@kurio.dev', username: 'nova' })).toBe(
      'EMAIL_TAKEN',
    )
  })

  it('nome de usuário já usado', () => {
    expect(findAccountConflict(users, { email: 'nova@kurio.dev', username: 'bruno' })).toBe(
      'USERNAME_TAKEN',
    )
  })

  it('o próprio usuário não conflita consigo', () => {
    expect(findAccountConflict(users, { email: ana.email, username: ana.username }, ana.id)).toBe(
      null,
    )
  })

  it('livre', () => {
    expect(findAccountConflict(users, { email: 'nova@kurio.dev', username: 'nova' })).toBe(null)
  })
})

describe('carteira por role', () => {
  it('Ana tem principal e secundária; Bruno só principal', () => {
    expect(walletRoleTaken(ana.wallets, 'primary')).toBe(true)
    expect(walletRoleTaken(ana.wallets, 'secondary')).toBe(true)
    expect(walletRoleTaken(bruno.wallets, 'primary')).toBe(true)
    expect(walletRoleTaken(bruno.wallets, 'secondary')).toBe(false)
  })
})

describe('principal × secundária', () => {
  const [primary, secondary] = ana.wallets as [Wallet, Wallet]

  it('apelido e endereço precisam ser diferentes da outra carteira', () => {
    expect(walletClash(ana.wallets, { ...secondary, label: primary.label })).toEqual({
      label: 'Use um apelido diferente da carteira principal',
    })
    expect(walletClash(ana.wallets, { ...primary, address: secondary.address })).toEqual({
      address: 'Use um endereço diferente da carteira secundária',
    })
  })

  it('sem a outra carteira, ou com dados diferentes, passa', () => {
    expect(walletClash(ana.wallets, secondary)).toBe(null)
    expect(walletClash([], primary)).toBe(null)
  })
})

describe('sessão', () => {
  const session = { token: 't', userId: ana.id, expiresAt: '2026-07-29T14:00:00.000Z' }

  it('válida antes de expirar, vencida a partir do instante', () => {
    expect(sessionStatus(session, Date.parse('2026-07-29T13:59:59.999Z'))).toBe('valid')
    expect(sessionStatus(session, Date.parse(session.expiresAt))).toBe('expired')
  })

  it('sem sessão', () => {
    expect(sessionStatus(undefined, 0)).toBe('missing')
  })
})

describe('fixtures', () => {
  it('perfis e carteiras passam nos schemas do formulário', () => {
    for (const user of users) {
      expect(profileSchema.safeParse(user).success).toBe(true)
      for (const wallet of user.wallets) expect(walletSchema.safeParse(wallet).success).toBe(true)
    }
  })

  it('favoritos distintos', () => {
    expect(ana.favoriteNftIds).not.toEqual(bruno.favoriteNftIds)
  })
})
