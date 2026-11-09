/**
 * Converte as artes do Figma (`docs/figma`) em AVIF e WebP responsivos em `src/assets/nfts`.
 * Rodar com `pnpm images` depois de trocar uma arte; a saída é versionada.
 *
 * `Frame 136.svg` e `NFT Artwork 04.svg` só embrulham um PNG de 1254 px (SPEC §13.2):
 * o raster embutido é a fonte em alta resolução. As demais artes só existem em 250 px,
 * e nunca são ampliadas.
 */
import { mkdir, readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const root = fileURLToPath(new URL('..', import.meta.url))
const figma = `${root}docs/figma/`
const outDir = `${root}src/assets/nfts/`

const WIDTHS = [320, 640, 960]

const artworks = [
  { slug: 'emerald-ape', source: 'Frame 136.svg' },
  { slug: 'sage-nomad', source: 'NFT Artwork 04.svg' },
  { slug: 'neon-vessel', source: 'NFT Artwork 05.png' },
  { slug: 'golden-beat', source: 'NFT Artwork 10.png' },
]

async function loadRaster(file) {
  const buffer = await readFile(figma + file)
  if (!file.endsWith('.svg')) return buffer
  const match = /data:image\/png;base64,([^"]+)/.exec(buffer.toString('utf8'))
  if (!match) throw new Error(`Nenhum raster embutido em ${file}`)
  return Buffer.from(match[1], 'base64')
}

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

for (const { slug, source } of artworks) {
  const raster = await loadRaster(source)
  const { width: native } = await sharp(raster).metadata()
  const widths = WIDTHS.filter((w) => w <= native)
  if (widths.length === 0) widths.push(native)

  for (const width of widths) {
    const resized = sharp(raster).resize(width, width, { fit: 'cover' })
    await resized.clone().avif({ quality: 55 }).toFile(`${outDir}${slug}-${width}.avif`)
    await resized.clone().webp({ quality: 78 }).toFile(`${outDir}${slug}-${width}.webp`)
  }
  console.log(`${slug}: ${widths.join(', ')}`)
}
