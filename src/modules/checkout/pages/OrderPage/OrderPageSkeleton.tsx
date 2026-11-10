import { PageContainer } from '@/shared/components/PageContainer'
import { Skeleton } from '@/shared/ui/skeleton'

/** Forma do Recibo: cabeçalho, faixa de dados, três linhas e totais. */
export function ReceiptSkeleton() {
  return (
    <div aria-hidden className="mx-auto flex w-full max-w-[36.125rem] flex-col bg-card">
      <div className="flex h-39 flex-col items-center justify-center gap-4">
        <Skeleton className="size-20 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-16.25 rounded-none" />
      <div className="flex flex-col gap-3 px-4 pt-5 pb-12 md:px-11">
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-17.5 w-full" />
        ))}
        <Skeleton className="ml-auto h-10 w-full max-w-80" />
        <Skeleton className="mx-auto mt-6 h-12 w-44" />
      </div>
    </div>
  )
}

export function OrderPageSkeleton() {
  return (
    <PageContainer role="status" className="py-6 md:py-10">
      <span className="sr-only">Carregando…</span>
      <ReceiptSkeleton />
    </PageContainer>
  )
}
