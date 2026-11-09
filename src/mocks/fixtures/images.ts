/**
 * Artes do Figma convertidas por `pnpm images` (scripts/optimize-images.mjs).
 * A fixture aponta para o WebP de maior largura até 640 px de cada arte.
 */
const files = import.meta.glob<string>('@/assets/nfts/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const ARTWORKS = ['emerald-ape', 'sage-nomad', 'neon-vessel', 'golden-beat'] as const
export type Artwork = (typeof ARTWORKS)[number]

const MAX_WIDTH = 640

export function artworkUrl(artwork: Artwork): string {
  const pattern = new RegExp(`/${artwork}-(\\d+)\\.webp$`)
  const candidates = Object.entries(files)
    .flatMap(([path, url]) => {
      const width = Number(pattern.exec(path)?.[1])
      return width <= MAX_WIDTH ? [{ width, url }] : []
    })
    .sort((a, b) => b.width - a.width)
  const best = candidates[0]
  if (!best) throw new Error(`Arte não encontrada em src/assets/nfts: ${artwork}`)
  return best.url
}
