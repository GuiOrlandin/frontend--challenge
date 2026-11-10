import './index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createQueryClient } from './queryClient'
import { createAppRouter } from './router'

/** Liga o MSW antes de montar o app, só com `VITE_API_MOCKING=enabled` (SPEC §3.5). */
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') return
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root não encontrado')

await enableMocking()

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
