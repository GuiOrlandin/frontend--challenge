import { PageContainer } from '@/shared/components/PageContainer'
import { Skeleton } from '@/shared/ui/skeleton'

/** Skeleton genérico de página; cada tela troca pelo seu na task da tela. */
export function PageSkeleton() {
  return (
    <PageContainer className="flex flex-col gap-6 py-10" role="status">
      <span className="sr-only">Carregando…</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  )
}
