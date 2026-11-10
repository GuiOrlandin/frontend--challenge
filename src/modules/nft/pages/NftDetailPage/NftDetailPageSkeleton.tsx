import { PageContainer } from '@/shared/components/PageContainer'
import { Skeleton } from '@/shared/ui/skeleton'

/** `pendingComponent` do detalhe, com o mesmo desenho da página (SPEC §11.5). */
export function NftDetailPageSkeleton() {
  return (
    <PageContainer
      role="status"
      className="flex min-h-dvh flex-col gap-10 py-6 lg:gap-16 lg:pt-12 lg:pb-8"
    >
      <span className="sr-only">Carregando NFT…</span>
      <Skeleton className="h-5 w-64" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </PageContainer>
  )
}
