import { useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'

import {
  isApiError,
  type Network,
  type WalletInput,
  type WalletProvider,
  walletSchema,
} from '@/shared/contracts'
import { withEnsSuffix } from '@/shared/lib/ens'
import { type FieldErrors, fieldErrorsOf } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'

import { createWallet, updateWallet } from '../../api'
import { saveWallet } from '../../queries'
import { EnsField } from '../EnsField'
import { Field } from '../Field'
import { SelectField } from '../SelectField'
import type { WalletFormProps } from './types'

const NETWORK_OPTIONS: [Network, string][] = [
  ['ethereum', 'Ethereum'],
  ['polygon', 'Polygon'],
  ['solana', 'Solana'],
]
const PROVIDER_OPTIONS: [WalletProvider, string][] = [
  ['metamask', 'MetaMask'],
  ['walletconnect', 'WalletConnect'],
  ['coinbase', 'Coinbase Wallet'],
]

/**
 * Cadastro ou edição de uma Carteira (SPEC §9). Rede × Endereço valida no cliente; Apelido e
 * Endereço repetidos entre principal e secundária voltam da API como `fieldErrors`.
 */
export function WalletForm({ userId, role, wallet, defaults, primary, onSaved }: WalletFormProps) {
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<Partial<WalletInput>>(wallet ?? defaults ?? {})
  // Campos não controlados: trocar a `key` os remonta com os novos `defaultValue`.
  const [fillCount, setFillCount] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  /** Atalho sem vínculo: copia a principal, mas Apelido e Endereço ficam como estão. */
  function copyPrimary() {
    if (!primary || !formRef.current) return
    const current = Object.fromEntries(new FormData(formRef.current)) as Record<string, string>
    setValues({ ...primary, label: current.label, address: current.address })
    setFillCount((count) => count + 1)
    setErrors({})
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    // Renderiza os erros antes de focar: assim o primeiro `aria-invalid` inclui os selects (gatilho Radix).
    const show = (fieldErrors: FieldErrors) => {
      flushSync(() => setErrors(fieldErrors))
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }

    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    const result = walletSchema.safeParse({ ...data, role, ensName: withEnsSuffix(data.ensName) })
    if (!result.success) {
      show(fieldErrorsOf(result.error))
      return
    }

    setErrors({})
    setPending(true)
    try {
      const saved = wallet
        ? await updateWallet(wallet.id, result.data)
        : await createWallet(result.data)
      saveWallet(queryClient, userId, saved)
      onSaved(!wallet)
    } catch (error) {
      if (isApiError(error, 'SESSION_EXPIRED')) return
      if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) show(error.fieldErrors)
      else toast.error('Não foi possível salvar a carteira. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => void onSubmit(event)}
      className="grid gap-6"
    >
      <div key={fillCount} className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <Field
          name="label"
          label="Apelido da carteira"
          required
          defaultValue={values.label}
          error={errors.label}
        />
        <Field
          name="displayName"
          label="Nome de exibição"
          required
          autoComplete="name"
          defaultValue={values.displayName}
          error={errors.displayName}
        />
        <SelectField
          name="network"
          label="Rede"
          options={NETWORK_OPTIONS}
          defaultValue={values.network}
          error={errors.network}
        />
        <Field
          name="profileName"
          label="Nome do perfil"
          required
          defaultValue={values.profileName}
          error={errors.profileName}
        />
        <Field
          name="address"
          label="Endereço da carteira"
          required
          autoComplete="off"
          spellCheck={false}
          defaultValue={values.address}
          error={errors.address}
        />
        <Field
          name="receivingAddress"
          label="ENS ou carteira secundária"
          autoComplete="off"
          spellCheck={false}
          defaultValue={values.receivingAddress}
          error={errors.receivingAddress}
        />
        <SelectField
          name="provider"
          label="Tipo de carteira"
          options={PROVIDER_OPTIONS}
          defaultValue={values.provider}
          error={errors.provider}
        />
        <Field
          name="referralCode"
          label="Código de indicação"
          required
          autoComplete="off"
          defaultValue={values.referralCode}
          error={errors.referralCode}
        />
        <Field
          name="email"
          type="email"
          label="E-mail"
          required
          autoComplete="email"
          defaultValue={values.email}
          error={errors.email}
        />
        <EnsField defaultValue={values.ensName} error={errors.ensName} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" aria-busy={pending} disabled={pending} className="h-10 w-fit px-7">
          Salvar
        </Button>
        {primary && (
          <Button type="button" variant="outline" onClick={copyPrimary} className="h-10 px-7">
            Igual à carteira principal
          </Button>
        )}
      </div>
    </form>
  )
}
