/** Categorias, Redes e Coleções do Figma. Ids em slug porque vão para a URL (`?category=`). */
import type { Network } from '@/shared/contracts'

export const CATEGORIES = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const COLLECTIONS = [
  { id: 'kurio-apes', label: 'Kurio Apes' },
  { id: 'nomad-society', label: 'Nomad Society' },
  { id: 'neon-vessels', label: 'Neon Vessels' },
  { id: 'golden-signals', label: 'Golden Signals' },
  { id: 'cosmic-garden', label: 'Cosmic Garden' },
  { id: 'genesis-drop', label: 'Genesis Drop' },
] as const
