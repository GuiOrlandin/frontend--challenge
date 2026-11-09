/** Carteiras do Colecionador: no máximo uma por `role`, sem excluir nem promover (SPEC §5.3, §9). */
import { http, HttpResponse } from 'msw'

import { walletSchema, type Wallet } from '@/shared/contracts'

import { api, apiError, readJson, validate } from '../respond'
import { walletClash, walletRoleTaken } from '../rules/account'
import { requireUser, updateUser } from '../session'

const clashError = (fieldErrors: Record<string, string>) =>
  apiError(422, 'VALIDATION_FAILED', 'Verifique os campos destacados.', { fieldErrors })

export const walletHandlers = [
  http.get(api('/me/wallets'), ({ request }) => {
    const user = requireUser(request)
    return user instanceof Response ? user : HttpResponse.json<Wallet[]>(user.wallets)
  }),

  http.post(api('/me/wallets'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const input = validate(walletSchema, await readJson(request))
    if (input instanceof Response) return input
    if (walletRoleTaken(user.wallets, input.role)) {
      return apiError(409, 'WALLET_ROLE_TAKEN', 'Já existe uma carteira com este papel.')
    }
    const clash = walletClash(user.wallets, input)
    if (clash) return clashError(clash)
    // Sem exclusão: o contador não repete id.
    const wallet: Wallet = {
      ...input,
      id: `wal_${user.id.replace(/^usr_/, '')}_${user.wallets.length + 1}`,
      version: 1,
    }
    updateUser(user.id, (u) => ({ ...u, wallets: [...u.wallets, wallet] }))
    return HttpResponse.json<Wallet>(wallet, { status: 201 })
  }),

  http.patch<{ id: string }>(api('/me/wallets/:id'), async ({ request, params }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const current = user.wallets.find((wallet) => wallet.id === params.id)
    if (!current) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const body = await readJson(request)
    // PATCH parcial: valida a Carteira inteira (rede × endereço); o `role` não muda.
    const input = validate(walletSchema, { ...current, ...(body as object), role: current.role })
    if (input instanceof Response) return input
    const clash = walletClash(user.wallets, input)
    if (clash) return clashError(clash)
    const wallet: Wallet = { ...input, id: current.id, version: current.version + 1 }
    updateUser(user.id, (u) => ({
      ...u,
      wallets: u.wallets.map((w) => (w.id === wallet.id ? wallet : w)),
    }))
    return HttpResponse.json<Wallet>(wallet)
  }),
]
