import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createQueryClient } from './queryClient'
import { RealtimeProvider } from './realtime/RealtimeProvider'
import { createAppRouter } from './router'

export function renderApp(root: HTMLElement) {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <RouterProvider router={router} />
        </RealtimeProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}
