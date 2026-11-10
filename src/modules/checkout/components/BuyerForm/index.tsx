import { useNavigate } from '@tanstack/react-router'
import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { EnsField } from '@/shared/components/EnsField'
import { Field } from '@/shared/components/Field'
import { SelectField } from '@/shared/components/SelectField'
import {
  buyerSchema,
  NETWORK_LABELS,
  type Profile,
  type Wallet,
  WALLET_PROVIDER_LABELS,
  type WalletProvider,
} from '@/shared/contracts'
import { withEnsSuffix } from '@/shared/lib/ens'
import { type FieldErrors, fieldErrorsOf } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

import { readDraft, writeDraft } from '../../draft'
import { CheckoutSummary } from '../CheckoutSummary'
import { ProviderPicker } from '../ProviderPicker'
import { WalletPicker } from '../WalletPicker'
import type { BuyerFormProps } from './types'

const NETWORK_OPTIONS = Object.entries(NETWORK_LABELS)
const PROVIDER_OPTIONS = Object.entries(WALLET_PROVIDER_LABELS)

/** Dados do comprador vindos do Perfil e da Carteira; editáveis, valem só para o pedido. */
const prefill = (profile: Profile, wallet: Wallet): Record<string, string> => ({
  displayName: wallet.displayName,
  username: profile.username,
  email: wallet.email,
  ensName: wallet.ensName,
  profileName: wallet.profileName,
  referralCode: wallet.referralCode,
  receivingAddress: wallet.receivingAddress ?? '',
})

// Só campos de texto: o formulário não tem upload.
const valuesOf = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form)) as Record<string, string>

/**
 * Passo "dados" (SPEC §8.1, §9). Rede, Endereço e tipo vêm da Carteira (sem carteira avulsa);
 * o provedor da Conexão é escolhido em "Carteira e rede". Cada mudança vai para o rascunho.
 */
export function BuyerForm({ userId, profile, wallets, cart }: BuyerFormProps) {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const noteId = useId()
  // Rascunho de outro usuário ou de uma Carteira que não existe mais é ignorado.
  const [draft] = useState(() => {
    const saved = readDraft(userId)
    return saved && wallets.some((w) => w.id === saved.walletId) ? saved : null
  })
  const start = draft
    ? wallets.find((w) => w.id === draft.walletId)!
    : (wallets.find((w) => w.role === 'primary') ?? wallets[0]!)
  const [walletId, setWalletId] = useState(start.id)
  const [provider, setProvider] = useState<WalletProvider>(draft?.provider ?? start.provider)
  const [values, setValues] = useState(draft?.values ?? prefill(profile, start))
  // Campos não controlados: trocar a `key` os remonta com os novos `defaultValue`.
  const [fillCount, setFillCount] = useState(0)
  const [errors, setErrors] = useState<FieldErrors>({})

  const wallet = wallets.find((w) => w.id === walletId)!
  const other = wallets.find((w) => w.id !== walletId)

  function saveDraft() {
    if (formRef.current)
      writeDraft({ userId, walletId, provider, values: valuesOf(formRef.current) })
  }

  // Troca de Carteira ou provedor também entra no rascunho (os campos já remontaram).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `saveDraft` lê o estado atual do form
  useEffect(() => saveDraft(), [walletId, provider, fillCount])

  function switchWallet() {
    if (!other || !formRef.current) return
    const { note = '' } = valuesOf(formRef.current)
    setWalletId(other.id)
    setProvider(other.provider)
    setValues({ ...prefill(profile, other), note })
    setFillCount((count) => count + 1)
    setErrors({})
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = valuesOf(form)
    const result = buyerSchema.safeParse({ ...data, ensName: withEnsSuffix(data.ensName) })
    if (!result.success) {
      // Renderiza os erros antes de focar o primeiro `aria-invalid` na ordem do formulário.
      flushSync(() => setErrors(fieldErrorsOf(result.error)))
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setErrors({})
    saveDraft()
    void navigate({ to: '/pagamento', search: { step: 'revisao' } })
  }

  return (
    <form
      ref={formRef}
      noValidate
      onChange={saveDraft}
      onSubmit={onSubmit}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]"
    >
      <section aria-labelledby="perfil-colecionador" className="flex min-w-0 flex-col gap-5">
        <WalletPicker variant="card" wallet={wallet} canSwitch={!!other} onSwitch={switchWallet} />
        <h2 id="perfil-colecionador" className="font-bold max-md:sr-only">
          Perfil do colecionador
        </h2>
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          <div key={`campos-${fillCount}`} className="contents">
            <Field
              name="displayName"
              label="Nome de exibição"
              required
              autoComplete="name"
              defaultValue={values.displayName}
              error={errors.displayName}
            />
            <Field
              name="username"
              label="Nome de usuário"
              required
              autoComplete="username"
              defaultValue={values.username}
              error={errors.username}
            />
            <SelectField
              name="network"
              label="Rede"
              options={NETWORK_OPTIONS}
              value={wallet.network}
              disabled
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
              readOnly
              spellCheck={false}
              value={wallet.address}
            />
            <Field
              name="receivingAddress"
              label="ENS ou carteira secundária (opcional)"
              autoComplete="off"
              spellCheck={false}
              defaultValue={values.receivingAddress}
              error={errors.receivingAddress}
            />
            <SelectField
              name="provider"
              label="Tipo de carteira"
              options={PROVIDER_OPTIONS}
              value={wallet.provider}
              disabled
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
          {/* Fora da `key`: o botão não remonta ao trocar e mantém o foco. */}
          <WalletPicker
            variant="toggle"
            wallet={wallet}
            canSwitch={!!other}
            onSwitch={switchWallet}
          />
          <div key={`nota-${fillCount}`} className="contents">
            <div className="grid content-start gap-3 md:col-start-1">
              <Label htmlFor={noteId} className="font-normal">
                Observação do colecionador (opcional)
              </Label>
              <Textarea
                id={noteId}
                name="note"
                maxLength={500}
                defaultValue={values.note}
                aria-invalid={errors.note ? true : undefined}
                aria-describedby={errors.note ? `${noteId}-erro` : undefined}
                className="min-h-36 rounded-sm bg-transparent dark:bg-transparent"
              />
              {errors.note && (
                <p id={`${noteId}-erro`} className="text-xs text-destructive">
                  {errors.note}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-6 max-md:pb-8">
        <CheckoutSummary cart={cart} />
        {/* Mobile: só o Total aparece no resumo, e o frame põe "Carteira e rede" antes dele. */}
        <div className="max-md:order-first">
          <ProviderPicker value={provider} onChange={setProvider} />
        </div>
        <Button
          type="submit"
          className="h-10 rounded-sm text-sm font-bold max-md:h-12 max-md:rounded-full max-md:bg-linear-to-r max-md:from-primary max-md:to-[#A86D3D]"
        >
          Continuar
        </Button>
      </aside>
    </form>
  )
}
