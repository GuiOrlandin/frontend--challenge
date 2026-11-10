import { useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useId, useState } from 'react'
import { toast } from 'sonner'

import { EnsField } from '@/shared/components/EnsField'
import { Field } from '@/shared/components/Field'
import { changePasswordSchema, isApiError, profileSchema } from '@/shared/contracts'
import { withEnsSuffix } from '@/shared/lib/ens'
import { type FieldErrors, fieldErrorsOf, focusFirstInvalid } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'

import { changePassword, updateProfile } from '../../api'
import { saveProfile } from '../../queries'
import { AvatarField } from '../AvatarField'
import type { ProfileFormProps } from './types'

const PASSWORD_KEYS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

/**
 * Dados do perfil e troca de senha num "Salvar" só, como no Figma. A senha só vai se algum campo
 * dela foi preenchido, e vai antes: se falhar, nada é salvo e o erro fica no campo.
 */
export function ProfileForm({ userId, profile }: ProfileFormProps) {
  const queryClient = useQueryClient()
  const passwordGroupId = useId()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const show = (fieldErrors: FieldErrors) => {
      setErrors(fieldErrors)
      focusFirstInvalid(form, fieldErrors)
    }

    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    const profileResult = profileSchema.safeParse({ ...data, ensName: withEnsSuffix(data.ensName) })
    const wantsPassword = PASSWORD_KEYS.some((key) => data[key])
    const passwordResult = wantsPassword ? changePasswordSchema.safeParse(data) : undefined
    const clientErrors = {
      ...(profileResult.success ? {} : fieldErrorsOf(profileResult.error)),
      ...(passwordResult && !passwordResult.success ? fieldErrorsOf(passwordResult.error) : {}),
    }
    if (!profileResult.success || (passwordResult && !passwordResult.success)) {
      show(clientErrors)
      return
    }

    // Senha já trocada não pode ficar nos campos: reenviada, a "atual" estaria errada.
    const clearPasswords = () =>
      PASSWORD_KEYS.forEach((key) => {
        const input = form.elements.namedItem(key)
        if (input instanceof HTMLInputElement) input.value = ''
      })

    setErrors({})
    setPending(true)
    let passwordChanged = false
    try {
      if (passwordResult) {
        await changePassword(passwordResult.data)
        passwordChanged = true
        clearPasswords()
      }
      saveProfile(queryClient, userId, await updateProfile(profileResult.data))
      toast(passwordChanged ? 'Perfil e senha salvos' : 'Perfil salvo')
    } catch (error) {
      if (isApiError(error, 'SESSION_EXPIRED')) return
      if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) show(error.fieldErrors)
      else toast.error('Não foi possível salvar. Tente novamente.')
      if (passwordChanged) toast('A senha foi alterada; os dados do perfil não foram salvos.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="grid gap-6">
      <h1 className="font-bold">Perfil do colecionador</h1>

      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <Field
          name="displayName"
          label="Nome de exibição"
          required
          autoComplete="name"
          defaultValue={profile.displayName}
          error={errors.displayName}
        />
        <Field
          name="username"
          label="Nome de usuário"
          required
          autoComplete="username"
          defaultValue={profile.username}
          error={errors.username}
        />
        <Field
          name="email"
          type="email"
          label="E-mail"
          required
          autoComplete="email"
          defaultValue={profile.email}
          error={errors.email}
        />

        <EnsField defaultValue={profile.ensName} error={errors.ensName} />

        <Field
          name="alias"
          label="Apelido da carteira"
          required
          defaultValue={profile.alias}
          error={errors.alias}
        />
        <AvatarField userId={userId} avatarUrl={profile.avatarUrl} />

        {/* `div` em vez de `fieldset`: o fieldset ignora a largura da coluna e estoura no mobile. */}
        <div role="group" aria-labelledby={passwordGroupId} className="grid gap-6 md:col-start-1">
          <h2 id={passwordGroupId} className="font-bold">
            Alterar senha
          </h2>
          <Field
            name="currentPassword"
            type="password"
            label="Senha atual"
            autoComplete="current-password"
            error={errors.currentPassword}
          />
          <Field
            name="newPassword"
            type="password"
            label="Nova senha"
            autoComplete="new-password"
            error={errors.newPassword}
          />
          <Field
            name="confirmPassword"
            type="password"
            label="Confirmar nova senha"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </div>
      </div>

      <Button type="submit" aria-busy={pending} disabled={pending} className="h-10 w-fit px-7">
        Salvar
      </Button>
    </form>
  )
}
