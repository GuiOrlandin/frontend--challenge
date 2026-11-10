import type { Wallet } from '@/shared/contracts'

export interface WalletPickerProps {
  /** Posição no layout: card no topo (mobile) ou alternador depois do E-mail (desktop). */
  variant: 'card' | 'toggle'
  /** Carteira em uso no pedido. */
  wallet: Wallet
  /** Só com uma secundária cadastrada há para onde trocar. */
  canSwitch: boolean
  onSwitch: () => void
}
