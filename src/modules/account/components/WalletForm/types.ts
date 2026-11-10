import type { Wallet, WalletInput, WalletRole } from '@/shared/contracts'

export interface WalletFormProps {
  userId: string
  role: WalletRole
  /** Carteira existente (edição); sem ela, o formulário cadastra. */
  wallet?: Wallet
  /** Valores iniciais de uma Carteira nova (vindos do Perfil). */
  defaults?: Partial<WalletInput>
  /** Origem do atalho "Igual à carteira principal" (só na secundária). */
  primary?: Wallet
  /** `created`: a Carteira acabou de ser cadastrada (e não editada). */
  onSaved: (created: boolean) => void
}
