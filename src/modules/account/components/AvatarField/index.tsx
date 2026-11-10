import { useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import avatarPlaceholderUrl from '@/assets/icons/avatar-placeholder.svg'
import { isApiError, type Profile } from '@/shared/contracts'
import { Button } from '@/shared/ui/button'

import { removeAvatar, uploadAvatar } from '../../api'
import { saveProfile } from '../../queries'
import type { AvatarFieldProps } from './types'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_BYTES = 2 * 1024 * 1024

/** Avatar: envia ao escolher, com pré-visualização local enquanto sobe; remover volta ao vazio. */
export function AvatarField({ userId, avatarUrl }: AvatarFieldProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [preview, setPreview] = useState<string>()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function run(action: () => Promise<Profile>, done: string) {
    setError(undefined)
    setPending(true)
    try {
      saveProfile(queryClient, userId, await action())
      toast(done)
    } catch (err) {
      if (isApiError(err, 'SESSION_EXPIRED')) return
      setError(isApiError(err) ? (err.fieldErrors.file ?? err.message) : 'Não foi possível salvar.')
    } finally {
      setPending(false)
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    // Mesmas regras do servidor, para não subir um arquivo que ele vai recusar.
    if (!ACCEPT.split(',').includes(file.type)) return setError('Use PNG, JPEG ou WebP')
    if (file.size > MAX_BYTES) return setError('Use uma imagem de até 2 MB')
    const url = URL.createObjectURL(file)
    setPreview(url)
    await run(() => uploadAvatar(file), 'Avatar atualizado')
    setPreview(undefined)
    URL.revokeObjectURL(url)
  }

  const src = preview ?? avatarUrl

  return (
    <div className="grid content-start gap-3">
      <span className="text-sm">Avatar</span>
      <div className="flex items-center gap-4">
        <img
          src={src ?? avatarPlaceholderUrl}
          alt={src ? 'Seu avatar' : 'Sem avatar'}
          className="size-12.5 rounded-full object-cover"
        />
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          aria-label="Arquivo do avatar"
          tabIndex={-1}
          className="sr-only"
          onChange={(event) => {
            void onFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          size="sm"
          aria-busy={pending}
          aria-describedby={error ? errorId : undefined}
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="h-9 px-4"
        >
          Alterar
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-busy={pending}
            disabled={pending}
            onClick={() => void run(removeAvatar, 'Avatar removido')}
          >
            Remover
          </Button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
