import WalletIcon from '@/assets/icons/wallet.svg?react'
import { WALLET_PROVIDER_LABELS, WALLET_PROVIDERS, type WalletProvider } from '@/shared/contracts'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

import type { ProviderPickerProps } from './types'

/** "Carteira e rede": o provedor da Conexão (SPEC §8.3), começando pelo tipo da Carteira. */
export function ProviderPicker({ value, onChange }: ProviderPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 id="provedor" className="font-bold md:text-center">
        Carteira e rede
      </h2>
      <RadioGroup
        aria-labelledby="provedor"
        value={value}
        onValueChange={(provider) => onChange(provider as WalletProvider)}
        className="gap-3"
      >
        {WALLET_PROVIDERS.map((provider) => (
          <label
            key={provider}
            htmlFor={`provedor-${provider}`}
            className="flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-primary"
          >
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-primary"
            >
              {provider === 'coinbase' ? (
                <WalletIcon className="size-5" />
              ) : (
                provider.charAt(0).toUpperCase()
              )}
            </span>
            <span className="flex-1 text-sm">{WALLET_PROVIDER_LABELS[provider]}</span>
            <RadioGroupItem id={`provedor-${provider}`} value={provider} />
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}
