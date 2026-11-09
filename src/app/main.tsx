import './index.css'

import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

// Vitrine só em dev; o import dinâmico some do build de produção. Sai na task do shell (26).
const DevShowcase = import.meta.env.DEV ? lazy(() => import('./DevShowcase')) : null

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado')

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
