import { PageContainer } from '@/shared/components/PageContainer'
import { Skeleton } from '@/shared/ui/skeleton'

/** `pendingComponent` de `/carrinho`: linhas e resumo nas medidas da tela. */
export function CartPageSkeleton() {
  return (
    <PageContainer className="flex flex-col gap-6 py-6 lg:pt-10 lg:pb-8">
      <div role="status" className="contents">
        <span className="sr-only">Carregando carrinho…</span>
        <Skeleton className="h-5 w-56" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:gap-20">
          <div className="flex flex-col gap-3">
            <Skeleton className="hidden h-7 w-full md:block" />
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-[4.5rem] w-full rounded-sm" />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
