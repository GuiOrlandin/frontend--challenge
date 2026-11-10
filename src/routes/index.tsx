import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/modules/catalog'

export const Route = createFileRoute('/')({
  component: HomePage,
})
