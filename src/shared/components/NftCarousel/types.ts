import type { Nft } from '@/shared/contracts'

export interface NftCarouselProps {
  /** Título visível da vitrine; também nomeia a região. */
  title: string
  nfts: Nft[]
  /** Ações de cada card (favoritar, carrinho), vindas do módulo dono. */
  actions?: (nft: Nft) => React.ReactNode
}
