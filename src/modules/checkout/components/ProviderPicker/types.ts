import type { WalletProvider } from '@/shared/contracts'

export interface ProviderPickerProps {
  value: WalletProvider
  onChange: (provider: WalletProvider) => void
}
