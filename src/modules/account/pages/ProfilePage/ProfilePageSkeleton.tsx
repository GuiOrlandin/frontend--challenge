import { Skeleton } from '@/shared/ui/skeleton'

import { ProfileShell } from '../../components/ProfileShell'

/** `pendingComponent` de `/perfil`: menu real e campos nas medidas do formulário (SPEC §13.4). */
export function ProfilePageSkeleton() {
  return (
    <ProfileShell>
      <div role="status" className="grid gap-6">
        <span className="sr-only">Carregando perfil…</span>
        <Skeleton className="h-5 w-56" />
        <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </ProfileShell>
  )
}
