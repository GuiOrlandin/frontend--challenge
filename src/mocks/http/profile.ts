/** Perfil, avatar e senha do Colecionador (SPEC §5.3, §6, §9). */
import { http, HttpResponse } from 'msw'

import { changePasswordSchema, profileSchema, type Profile } from '@/shared/contracts'

import { db } from '../db'
import type { UserRecord } from '../fixtures'
import { api, apiError, noContent, readJson, validate } from '../respond'
import { findAccountConflict, hashPassword, verifyPassword } from '../rules/account'
import { newSalt, requireUser, updateUser } from '../session'
import { accountConflict } from './auth'

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']
// shortcut: avatar em data URL dentro do `kurio-mock-db`; dois avatares perto de 2 MB podem
// estourar a cota do localStorage e o banco passa a viver só em memória. Mover para IndexedDB se doer.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

function toProfile(user: UserRecord): Profile {
  const { displayName, username, email, ensName, alias, avatarUrl, profileVersion } = user
  return { displayName, username, email, ensName, alias, avatarUrl, version: profileVersion }
}

const bumpProfile = (user: UserRecord, patch: Partial<UserRecord>) =>
  toProfile(updateUser(user.id, (u) => ({ ...u, ...patch, profileVersion: u.profileVersion + 1 })))

async function toDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

const avatarError = (message: string) =>
  apiError(422, 'VALIDATION_FAILED', message, { fieldErrors: { file: message } })

export const profileHandlers = [
  http.get(api('/me/profile'), ({ request }) => {
    const user = requireUser(request)
    return user instanceof Response ? user : HttpResponse.json<Profile>(toProfile(user))
  }),

  http.patch(api('/me/profile'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const body = await readJson(request)
    // PATCH parcial: valida o Perfil inteiro já com as mudanças.
    const input = validate(profileSchema, { ...toProfile(user), ...(body as object) })
    if (input instanceof Response) return input
    const conflict = findAccountConflict(db.data.users, input, user.id)
    if (conflict) return accountConflict(conflict)
    return HttpResponse.json<Profile>(bumpProfile(user, input))
  }),

  http.put(api('/me/profile/avatar'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const file = (await request.formData().catch(() => null))?.get('file')
    if (!(file instanceof File)) return avatarError('Envie uma imagem')
    if (!AVATAR_TYPES.includes(file.type)) return avatarError('Use PNG, JPEG ou WebP')
    if (file.size > AVATAR_MAX_BYTES) return avatarError('Use uma imagem de até 2 MB')
    return HttpResponse.json<Profile>(bumpProfile(user, { avatarUrl: await toDataUrl(file) }))
  }),

  http.delete(api('/me/profile/avatar'), ({ request }) => {
    const user = requireUser(request)
    return user instanceof Response
      ? user
      : HttpResponse.json<Profile>(bumpProfile(user, { avatarUrl: undefined }))
  }),

  http.put(api('/me/password'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const input = validate(changePasswordSchema, await readJson(request))
    if (input instanceof Response) return input
    if (!(await verifyPassword(user, input.currentPassword))) {
      return apiError(422, 'VALIDATION_FAILED', 'Senha atual incorreta.', {
        fieldErrors: { currentPassword: 'Senha atual incorreta' },
      })
    }
    const salt = newSalt()
    const passwordHash = await hashPassword(salt, input.newPassword)
    updateUser(user.id, (u) => ({ ...u, salt, passwordHash }))
    return noContent()
  }),
]
