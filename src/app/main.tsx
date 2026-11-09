import './index.css'

import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

// Vitrine só em dev; o import dinâmico some do build de produção. Sai na task do shell (26).
const DevShowcase = import.meta.env.DEV ? lazy(() => import('./DevShowcase')) : null

/** Liga o MSW antes de montar o app, só com `VITE_API_MOCKING=enabled` (SPEC §3.5). */
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') return
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado')

await enableMocking()

createRoot(root).render(
  <StrictMode>
    <main>
      {DevShowcase && (
        <Suspense>
          <DevShowcase />
        </Suspense>
      )}
    </main>
  </StrictMode>,
)
