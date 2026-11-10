import type { Wallet } from '@/shared/contracts'

export interface WalletPickerProps {
  /** Posição no layout: card no topo (mobile) ou alternador depois do E-mail (desktop). */
  variant: 'card' | 'toggle'
  /** Carteira em uso no pedido. */
  wallet: Wallet
  /** Todas as Carteiras do Colecionador (o `card` lista cada uma com radio). */
  wallets: Wallet[]
  /** Só com uma secundária cadastrada há para onde trocar. */
  canSwitch: boolean
  onSwitch: () => void
  /** `card`: o ⋮ abre e fecha os dados do comprador (`id` em `fieldsId`). */
  editing?: boolean
  onEdit?: () => void
  fieldsId?: string
}
