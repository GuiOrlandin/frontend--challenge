import { PageContainer } from '@/shared/components/PageContainer'
import { Skeleton } from '@/shared/ui/skeleton'

/** Mesma grade do passo "dados": dez campos em duas colunas e o resumo ao lado. */
export function CheckoutPageSkeleton() {
  return (
    <PageContainer
      role="status"
      className="flex min-h-dvh flex-col gap-5 pt-4 md:gap-6 md:py-6 lg:pt-10 lg:pb-8"
    >
      <span className="sr-only">Carregando…</span>
      <Skeleton className="h-5 w-56" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="grid content-start gap-x-6 gap-y-5 md:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="grid gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </PageContainer>
  )
}
