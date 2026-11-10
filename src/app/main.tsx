import './index.css'

/** Liga o MSW antes de montar o app, só com `VITE_API_MOCKING=enabled` (SPEC §3.5). */
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') return
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado')

await enableMocking()

// Import dinâmico, depois do MSW: o `engine.io-client` guarda o `WebSocket` global ao carregar,
// e um import estático pegaria o nativo antes de o MSW trocá-lo (o socket nunca seria interceptado).
const { renderApp } = await import('./App')
renderApp(root)
