import type { Nft } from '@/shared/contracts'

export interface NftCardProps {
  nft: Nft
  /** Botões do módulo dono (favoritar, adicionar ao carrinho), sobre a arte. */
  actions?: React.ReactNode
  /** Arte acima da dobra: carrega já, com prioridade (LCP). */
  priority?: boolean
}
