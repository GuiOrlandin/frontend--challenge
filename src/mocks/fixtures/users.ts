/**
 * Colecionadores fictícios (SPEC §6): `ana@kurio.dev` e `bruno@kurio.dev`, senha `Kurio@123`.
 * Hash = SHA-256(salt + senha) em hex, pronto para não pagar o WebCrypto na seed.
 */
import type { Wallet } from '@/shared/contracts'

export interface UserRecord {
  id: string
  username: string
  displayName: string
  email: string
  ensName: string
  alias: string
  avatarUrl?: string
  /** `version` do Perfil. */
  profileVersion: number
  salt: string
  passwordHash: string
  wallets: Wallet[]
  favoriteNftIds: string[]
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export function createUsers(): UserRecord[] {
  return [
    {
      id: 'usr_ana',
      username: 'ana',
      displayName: 'Ana Ribeiro',
      email: 'ana@kurio.dev',
      ensName: 'ana-ribeiro.eth',
      alias: 'Cofre da Ana',
      profileVersion: 1,
      salt: 'a1f3c9e27b4d5068',
      passwordHash: 'df48c0caf8a0642c87d2c5a95bd144c82e7a8e05b0599e5787624d7482239cf7',
      favoriteNftIds: ['nft_001', 'nft_004', 'nft_010'],
      wallets: [
        {
          id: 'wal_ana_1',
          role: 'primary',
          label: 'Principal',
          displayName: 'Ana Ribeiro',
          network: 'ethereum',
          profileName: 'Ana Ribeiro',
          address: '0x8f3a21c4b6d7e9f0a1b2c3d4e5f60718293a4b5c',
          provider: 'metamask',
          referralCode: 'ANA2026',
          email: 'ana@kurio.dev',
          ensName: 'ana-ribeiro.eth',
          version: 1,
        },
        {
          id: 'wal_ana_2',
          role: 'secondary',
          label: 'Reserva',
          displayName: 'Ana Ribeiro',
          network: 'polygon',
          profileName: 'Ana Ribeiro',
          address: '0x1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5e6',
          receivingAddress: 'ana-ribeiro.eth',
          provider: 'walletconnect',
          referralCode: 'ANA2026',
          email: 'ana@kurio.dev',
          ensName: 'ana-ribeiro.eth',
          version: 1,
        },
      ],
    },
    {
      id: 'usr_bruno',
      username: 'bruno',
      displayName: 'Bruno Tavares',
      email: 'bruno@kurio.dev',
      ensName: 'bruno-tavares.eth',
      alias: 'Carteira do Bruno',
      profileVersion: 1,
      salt: '5be0d7a9c3f81246',
      passwordHash: '13a6d9ca03de6944fe86f5c883bca1e490797ce16dfcc40f2ae6cbd66c6d71e6',
      favoriteNftIds: ['nft_002', 'nft_007'],
      wallets: [
        {
          id: 'wal_bruno_1',
          role: 'primary',
          label: 'Solana',
          displayName: 'Bruno Tavares',
          network: 'solana',
          profileName: 'Bruno Tavares',
          address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          provider: 'coinbase',
          referralCode: 'BRUNO42',
          email: 'bruno@kurio.dev',
          ensName: 'bruno-tavares.eth',
          version: 1,
        },
      ],
    },
  ]
}
