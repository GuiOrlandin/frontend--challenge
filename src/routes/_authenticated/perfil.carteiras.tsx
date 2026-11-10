import { createFileRoute } from '@tanstack/react-router'

import { WalletsPage } from '@/modules/account'

export const Route = createFileRoute('/_authenticated/perfil/carteiras')({
  component: WalletsPage,
})
