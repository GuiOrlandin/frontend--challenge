import { createFileRoute, notFound } from '@tanstack/react-router'

import { NftDetailPage, NftDetailPageSkeleton, nftQueries } from '@/modules/nft'
import { isApiError } from '@/shared/contracts'
import { pageHead } from '@/shared/lib/pageHead'

export const Route = createFileRoute('/nft/$nftId')({
  loader: ({ context: { queryClient }, params: { nftId } }) =>
    queryClient.query(nftQueries.detail(nftId)).catch((error: unknown) => {
      throw isApiError(error, 'NOT_FOUND') ? notFound() : error
    }),
  // Depois do `loader`: o TS infere `loaderData` na ordem das propriedades.
  head: ({ loaderData }) => (loaderData ? pageHead(loaderData.title, loaderData.description) : {}),
  pendingComponent: NftDetailPageSkeleton,
  component: NftDetailPage,
})
