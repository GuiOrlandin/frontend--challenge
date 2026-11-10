import { PageContainer } from '@/shared/components/PageContainer'

import { ProfileNav } from '../ProfileNav'
import type { ProfileShellProps } from './types'

/** Moldura de Perfil e Carteiras: menu à esquerda (em cima no mobile) e conteúdo, 32 px do header. */
export function ProfileShell({ children }: ProfileShellProps) {
  return (
    <PageContainer className="mt-8 mb-16 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:gap-7">
      <ProfileNav />
      <div className="min-w-0">{children}</div>
    </PageContainer>
  )
}
