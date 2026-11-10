import { createFileRoute, notFound } from '@tanstack/react-router'

import { NftDetailPage, NftDetailPageSkeleton, nftQueries } from '@/modules/nft'
import { isApiError } from '@/shared/contracts'

export const Route = createFileRoute('/nft/$nftId')({
  loader: ({ context: { queryClient }, params: { nftId } }) =>
    queryClient.query(nftQueries.detail(nftId)).catch((error: unknown) => {
      throw isApiError(error, 'NOT_FOUND') ? notFound() : error
    }),
  pendingComponent: NftDetailPageSkeleton,
  component: NftDetailPage,
})
