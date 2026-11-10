import { createFileRoute } from '@tanstack/react-router'

import { NftDetailPage } from '@/modules/nft'

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage,
})
