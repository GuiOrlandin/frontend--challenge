import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/modules/account'

export const Route = createFileRoute('/_authenticated/perfil/')({
  component: ProfilePage,
})
