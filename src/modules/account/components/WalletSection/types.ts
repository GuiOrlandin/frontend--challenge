import type { WalletFormProps } from '../WalletForm/types'

export interface WalletSectionProps extends WalletFormProps {
  title: string
  /** Linha abaixo do título (só a principal tem no frame). */
  description?: string
}
