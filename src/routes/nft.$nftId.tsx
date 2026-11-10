import { createFileRoute } from '@tanstack/react-router'

import { NftDetailPage } from '@/modules/nft'
import { PageSkeleton } from '@/shared/components/PageSkeleton'

export const Route = createFileRoute('/nft/$nftId')({
  pendingComponent: PageSkeleton,
  component: NftDetailPage,
})
