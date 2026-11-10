/** MSW no navegador (SPEC §3.5, §12). Carregado só pelo bootstrap com `VITE_API_MOCKING=enabled`. */
import { setupWorker } from 'msw/browser'

import { applyScenarioFromUrl, installMockControl } from './control'
import { httpHandlers } from './http'
import { networkHandler } from './network'
import { scheduleDecision } from './orders'
import { db } from './db'
import { createSocketHandler } from './ws'

// O handler de rede vem primeiro: aplica latência e falhas, depois cede ao do recurso.
const worker = setupWorker(
  networkHandler,
  ...httpHandlers,
  createSocketHandler(new URL(import.meta.env.VITE_SOCKET_URL || window.location.origin).origin),
)

export async function startMocking() {
  applyScenarioFromUrl(window.location, window.history)
  // O refresh perde os timers: pedidos ainda `pending` voltam a ter decisão agendada (SPEC §8.6).
  db.data.orders.filter((o) => o.status === 'pending').forEach(scheduleDecision)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  // Por último: `window.__mock` presente também sinaliza aos testes que o worker já intercepta.
  installMockControl(window)
}
