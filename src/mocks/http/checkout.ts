/** Conexão de carteira do pagamento (SPEC §5.3, §8.3). */
import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'

import { walletProviderField, type CheckoutConnection } from '@/shared/contracts'

import { db } from '../db'
import { api, apiError, readJson, validate } from '../respond'
import { getActiveScenario } from '../scenarios'
import { requireUser } from '../session'

/** Tempo da "janela" do provedor, além da latência do cenário. */
const CONNECTION_DELAY_MS = 800

const connectionSchema = z.object({ walletId: z.string().min(1), provider: walletProviderField })

export const checkoutHandlers = [
  http.post(api('/checkout/connection'), async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const input = validate(connectionSchema, await readJson(request))
    if (input instanceof Response) return input
    const wallet = user.wallets.find((w) => w.id === input.walletId)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')

    await delay(CONNECTION_DELAY_MS)
    if (getActiveScenario().scenario.behavior?.kind === 'wallet-rejected') {
      return apiError(409, 'WALLET_REJECTED', 'Conexão recusada na carteira.')
    }

    const connection: CheckoutConnection = {
      connectionId: `conn_${crypto.randomUUID().slice(0, 8)}`,
      walletId: wallet.id,
      provider: input.provider,
      network: wallet.network,
    }
    // Uma conexão por Colecionador: conectar de novo ("Trocar carteira") derruba a anterior.
    db.mutate((data) => ({
      ...data,
      connections: [
        ...data.connections.filter((c) => c.userId !== user.id),
        { ...connection, userId: user.id },
      ],
    }))
    return HttpResponse.json<CheckoutConnection>(connection)
  }),
]
