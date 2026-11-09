/** MSW no navegador (SPEC §3.5, §12). Carregado só pelo bootstrap com `VITE_API_MOCKING=enabled`. */
import { setupWorker } from 'msw/browser'

import { applyScenarioFromUrl, installMockControl } from './control'
import { httpHandlers } from './http'
import { networkHandler } from './network'

// O handler de rede vem primeiro: aplica latência e falhas, depois cede ao do recurso.
const worker = setupWorker(networkHandler, ...httpHandlers)

export async function startMocking() {
  applyScenarioFromUrl(window.location, window.history)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  // Por último: `window.__mock` presente também sinaliza aos testes que o worker já intercepta.
  installMockControl(window)
}
