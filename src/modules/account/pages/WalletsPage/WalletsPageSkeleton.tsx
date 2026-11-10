import { Skeleton } from '@/shared/ui/skeleton'

import { ProfileShell } from '../../components/ProfileShell'

/** `pendingComponent` de `/perfil/carteiras`: menu real e as duas seções nas medidas do formulário. */
export function WalletsPageSkeleton() {
  return (
    <ProfileShell>
      <div role="status" className="grid gap-10">
        <span className="sr-only">Carregando carteiras…</span>
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 2 }, (_, section) => (
          <div key={section} className="grid gap-6">
            <Skeleton className="h-5 w-44" />
            <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
              {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="grid gap-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        ))}
      </div>
    </ProfileShell>
  )
}
