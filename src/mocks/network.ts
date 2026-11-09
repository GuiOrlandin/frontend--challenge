/**
 * Condições de rede dos cenários (SPEC §12.3): latência, offline, 503 e respostas
 * fora de ordem. É um handler na frente de todos os outros: espera, e então ou responde com a
 * falha, ou não responde nada e deixa o MSW seguir para o handler do recurso.
 */
import { delay, http, HttpResponse } from 'msw'

import { API_BASE_URL } from '@/shared/lib/http'

import { api, apiError } from './respond'
import { createRandom } from './random'
import { getActiveScenario, type RequestMatch } from './scenarios'

const LATENCY_SEED = 7
/** Fora de ordem: espera mínima de cada busca, para dar tempo de a seguinte chegar. */
const OUT_OF_ORDER_BASE_MS = 800
/** Folga entre a resposta da busca mais nova e a da mais antiga. */
const OUT_OF_ORDER_GAP_MS = 300

const basePath = new URL(API_BASE_URL, 'http://mock.local').pathname.replace(/\/$/, '')

let random = createRandom(LATENCY_SEED)
let unavailableCount = 0
let outOfOrderSeq = 0
const inFlight = new Map<number, Promise<void>>()

/** Zera contadores e PRNG (troca de cenário e reset). */
export function resetNetworkState() {
  random = createRandom(LATENCY_SEED)
  unavailableCount = 0
}

function matches(request: Request, match: RequestMatch): boolean {
  if (match.method && request.method !== match.method) return false
  const path = new URL(request.url).pathname.slice(basePath.length)
  return match.exact ? path === match.path : path.startsWith(match.path)
}

/** Responde na ordem inversa de chegada: espera a busca mais nova responder antes. */
async function waitOutOfOrder(): Promise<void> {
  const id = ++outOfOrderSeq
  let finish = () => {}
  inFlight.set(id, new Promise<void>((resolve) => (finish = resolve)))
  try {
    await delay(OUT_OF_ORDER_BASE_MS)
    for (;;) {
      const newest = Math.max(...inFlight.keys())
      if (newest === id) return
      await inFlight.get(newest)
      await delay(OUT_OF_ORDER_GAP_MS)
    }
  } finally {
    inFlight.delete(id)
    finish()
  }
}

export const networkHandler = http.all(api('/*'), async ({ request }) => {
  const { network } = getActiveScenario().scenario
  const { min, max } = network.latency

  if (network.outOfOrder && matches(request, network.outOfOrder.match)) {
    await waitOutOfOrder()
  } else {
    await delay(min === max ? min : random.int(min, max))
  }

  if (network.offline) return HttpResponse.error()

  if (network.unavailable && matches(request, network.unavailable.match)) {
    if (unavailableCount < network.unavailable.first) {
      unavailableCount += 1
      return apiError(503, 'TEMPORARILY_UNAVAILABLE', 'Serviço temporariamente indisponível.', {
        headers: { 'Retry-After': '1' },
      })
    }
  }

  // Sem resposta: o MSW segue para o handler do recurso.
  return undefined
})
